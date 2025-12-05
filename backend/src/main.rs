use axum::{
    routing::{get, post},
    Router,
    Json,
    extract::{State, Path, Query},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tower_http::cors::CorsLayer;
use std::sync::{Arc, Mutex};
use alloy::{
    primitives::{Address, U256, Bytes, FixedBytes, keccak256},
    providers::{Provider, ProviderBuilder},
    transports::http::Http,
    sol,
    sol_types::SolCall,
};
use rusqlite::Connection;

// Define Deployer contract interface
sol! {
    #[allow(missing_docs)]
    interface IDeployer {
        function computeWalletAddress(bytes32 salt, address owner) external view returns (address);
        function computeSalt(bytes32 salt, address owner) external pure returns (bytes32);
    }
}

const USDC_ADDRESS: &str = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

#[tokio::main]
async fn main() {
    dotenv::dotenv().ok();
    println!("🚀 PrivatePay Backend starting...");

    // Setup provider
    let rpc_url = std::env::var("RPC_URL")
        .unwrap_or_else(|_| "https://sepolia.base.org".to_string());

    let provider = ProviderBuilder::new()
        .on_http(rpc_url.parse().unwrap());

    let deployer_address: Address = std::env::var("DEPLOYER_ADDRESS")
        .unwrap_or_else(|_| "0x0000000000000000000000000000000000000000".to_string())
        .parse()
        .unwrap();

    // Setup database connection
    let db_path = std::env::var("DATABASE_PATH")
        .unwrap_or_else(|_| "./auto_sweep.db".to_string());

    let conn = Connection::open(&db_path)
        .expect("Failed to open database");

    println!("📊 Database connected: {}", db_path);

    // Create app state
    let state = Arc::new(AppState {
        provider,
        deployer_address,
        db: Arc::new(Mutex::new(conn)),
    });

    // Build router
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/api/compute-address", post(compute_address))
        .route("/api/balance/:address", get(get_balance))
        .route("/api/balance-usdc/:address", get(get_usdc_balance))
        .route("/api/enable-auto-sweep", post(enable_auto_sweep))
        .route("/api/disable-auto-sweep", post(disable_auto_sweep))
        .route("/api/sweep-history/:address", get(get_sweep_history))
        .route("/api/payment-links", post(create_payment_link))
        .route("/api/payment-links/:id", get(get_payment_link))
        .route("/api/payment-links/user/:address", get(get_user_payment_links))
        .route("/api/payment-links/:id/claim", post(claim_payment_link))
        .with_state(state)
        .layer(CorsLayer::permissive());

    // Start server
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001")
        .await
        .unwrap();

    println!("✅ Server running on http://0.0.0.0:3001");

    axum::serve(listener, app).await.unwrap();
}

#[derive(Clone)]
struct AppState {
    provider: alloy::providers::RootProvider<Http<reqwest::Client>>,
    deployer_address: Address,
    db: Arc<Mutex<Connection>>,
}

async fn health_check() -> Json<Value> {
    Json(json!({
        "status": "healthy",
        "service": "PrivatePay API",
        "version": "1.0.0"
    }))
}

#[derive(Deserialize)]
struct ComputeAddressRequest {
    owner: String,
    #[serde(default)]
    salt: Option<String>,
}

async fn compute_address(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<ComputeAddressRequest>,
) -> Result<Json<Value>, StatusCode> {
    println!("=== compute_address called ===");
    println!("Payload: owner={}, salt={:?}", payload.owner, payload.salt);

    let owner: Address = payload.owner.parse()
        .map_err(|e| {
            eprintln!("Failed to parse owner address: {:?}", e);
            StatusCode::BAD_REQUEST
        })?;

    // Generate random salt if not provided
    let salt_bytes = if let Some(s) = payload.salt {
        let decoded = hex::decode(&s[2..]).map_err(|e| {
            eprintln!("Failed to decode salt hex: {:?}", e);
            StatusCode::BAD_REQUEST
        })?;

        if decoded.len() != 32 {
            eprintln!("Salt must be 32 bytes, got {} bytes", decoded.len());
            return Err(StatusCode::BAD_REQUEST);
        }

        let mut arr = [0u8; 32];
        arr.copy_from_slice(&decoded);
        arr
    } else {
        rand::random()
    };

    let salt: FixedBytes<32> = FixedBytes::from(salt_bytes);
    let salt_hex = format!("0x{}", hex::encode(&salt_bytes));

    // Call contract to compute address using the generated function call
    let call = IDeployer::computeWalletAddressCall { salt, owner };

    println!("Calling contract at: {}", state.deployer_address);
    println!("With salt: {}", salt_hex);
    println!("With owner: {}", owner);

    let wallet_address = match state.provider
        .call(&alloy::rpc::types::TransactionRequest::default()
            .to(state.deployer_address)
            .input(call.abi_encode().into()))
        .await
    {
        Ok(result) => {
            println!("Contract call succeeded, result length: {}", result.len());
            println!("Result hex: 0x{}", hex::encode(&result));

            // Decode the result (address is 20 bytes)
            if result.len() >= 32 {
                let addr_bytes = &result[12..32]; // Address is right-aligned in 32 bytes
                Address::from_slice(addr_bytes)
            } else if result.len() >= 20 {
                // Sometimes it's not padded
                Address::from_slice(&result[result.len()-20..])
            } else {
                eprintln!("Result too short: {} bytes", result.len());
                return Err(StatusCode::INTERNAL_SERVER_ERROR);
            }
        }
        Err(e) => {
            eprintln!("Contract call error: {:?}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    println!("Computed wallet address: {}", wallet_address);

    Ok(Json(json!({
        "wallet_address": wallet_address.to_string(),
        "salt": salt_hex,
        "owner": owner.to_string(),
        "deployer_contract": state.deployer_address.to_string(),
        "chain_id": 84532
    })))
}

async fn get_balance(
    Path(address): Path<String>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Value>, StatusCode> {
    let addr: Address = address.parse()
        .map_err(|_| StatusCode::BAD_REQUEST)?;

    let balance = state.provider.get_balance(addr)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(json!({
        "address": addr.to_string(),
        "balance": balance.to_string(),
        "balance_eth": format!("{:.6}", balance.to::<u128>() as f64 / 1e18),
        "has_funds": balance > U256::ZERO
    })))
}

async fn get_usdc_balance(
    Path(address): Path<String>,
    State(_state): State<Arc<AppState>>,
) -> Result<Json<Value>, StatusCode> {
    let addr: Address = address.parse()
        .map_err(|_| StatusCode::BAD_REQUEST)?;

    // TODO: Call USDC balanceOf
    // For now, return placeholder
    Ok(Json(json!({
        "address": addr.to_string(),
        "balance": "0",
        "balance_usdc": "0.000000",
        "has_funds": false
    })))
}

// Auto-sweep endpoints

#[derive(Deserialize)]
struct AutoSweepRequest {
    address: String,
    owner: String,
    salt: String,
}

async fn enable_auto_sweep(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<AutoSweepRequest>,
) -> Result<Json<Value>, StatusCode> {
    let db = state.db.lock().unwrap();

    // Check if wallet already exists
    let exists: bool = db.query_row(
        "SELECT COUNT(*) FROM auto_sweep_wallets WHERE address = ?1",
        [&payload.address],
        |row| row.get::<_, i64>(0).map(|count| count > 0)
    ).map_err(|e| {
        eprintln!("Database error checking wallet: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    if exists {
        return Ok(Json(json!({
            "success": true,
            "message": "Wallet already in auto-sweep monitoring",
            "address": payload.address
        })));
    }

    // Insert wallet into database
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as i64;

    db.execute(
        "INSERT INTO auto_sweep_wallets (address, owner, salt, created_at, last_checked, sweep_count) VALUES (?1, ?2, ?3, ?4, 0, 0)",
        rusqlite::params![&payload.address, &payload.owner, &payload.salt, now],
    ).map_err(|e| {
        eprintln!("Database error inserting wallet: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    println!("✅ Enabled auto-sweep for wallet: {}", payload.address);

    Ok(Json(json!({
        "success": true,
        "message": "Auto-sweep enabled successfully",
        "address": payload.address,
        "owner": payload.owner
    })))
}

async fn disable_auto_sweep(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<AutoSweepRequest>,
) -> Result<Json<Value>, StatusCode> {
    let db = state.db.lock().unwrap();

    // Remove wallet from database
    let rows_affected = db.execute(
        "DELETE FROM auto_sweep_wallets WHERE address = ?1",
        [&payload.address],
    ).map_err(|e| {
        eprintln!("Database error removing wallet: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    if rows_affected == 0 {
        return Ok(Json(json!({
            "success": true,
            "message": "Wallet was not in auto-sweep monitoring",
            "address": payload.address
        })));
    }

    println!("❌ Disabled auto-sweep for wallet: {}", payload.address);

    Ok(Json(json!({
        "success": true,
        "message": "Auto-sweep disabled successfully",
        "address": payload.address
    })))
}

#[derive(Serialize)]
struct SweepHistoryItem {
    id: i64,
    #[serde(rename = "walletAddress")]
    wallet_address: String,
    #[serde(rename = "txHash")]
    tx_hash: String,
    amount: String,
    timestamp: i64,
    recipient: String,
}

async fn get_sweep_history(
    Path(address): Path<String>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Value>, StatusCode> {
    let db = state.db.lock().unwrap();

    let mut stmt = db.prepare(
        "SELECT id, wallet_address, tx_hash, amount, timestamp, recipient
         FROM sweep_history
         WHERE wallet_address = ?1
         ORDER BY timestamp DESC
         LIMIT 50"
    ).map_err(|e| {
        eprintln!("Database error preparing statement: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let history_iter = stmt.query_map([&address], |row| {
        Ok(SweepHistoryItem {
            id: row.get(0)?,
            wallet_address: row.get(1)?,
            tx_hash: row.get(2)?,
            amount: row.get(3)?,
            timestamp: row.get(4)?,
            recipient: row.get(5)?,
        })
    }).map_err(|e| {
        eprintln!("Database error querying history: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let history: Vec<SweepHistoryItem> = history_iter
        .filter_map(|item| item.ok())
        .collect();

    Ok(Json(json!({
        "success": true,
        "history": history
    })))
}

// Payment link endpoints

#[derive(Deserialize)]
struct CreatePaymentLinkRequest {
    creator_address: String,
    recipient_address: Option<String>,
    amount: Option<String>,
    description: Option<String>,
    expires_in_hours: Option<i64>,
    max_claims: Option<i64>,
}

#[derive(Serialize)]
struct PaymentLink {
    id: String,
    #[serde(rename = "creatorAddress")]
    creator_address: String,
    #[serde(rename = "recipientAddress")]
    recipient_address: Option<String>,
    amount: Option<String>,
    description: Option<String>,
    #[serde(rename = "createdAt")]
    created_at: i64,
    #[serde(rename = "expiresAt")]
    expires_at: Option<i64>,
    #[serde(rename = "claimCount")]
    claim_count: i64,
    #[serde(rename = "maxClaims")]
    max_claims: i64,
    #[serde(rename = "isActive")]
    is_active: bool,
}

async fn create_payment_link(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreatePaymentLinkRequest>,
) -> Result<Json<Value>, StatusCode> {
    let db = state.db.lock().unwrap();

    // Generate short unique ID (8 chars)
    let id: String = (0..8)
        .map(|_| {
            let idx = rand::random::<usize>() % 36;
            "abcdefghijklmnopqrstuvwxyz0123456789".chars().nth(idx).unwrap()
        })
        .collect();

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as i64;

    let expires_at = payload.expires_in_hours.map(|hours| now + (hours * 3600 * 1000));

    db.execute(
        "INSERT INTO payment_links (id, creator_address, recipient_address, amount, description, created_at, expires_at, max_claims) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        rusqlite::params![
            &id,
            &payload.creator_address,
            &payload.recipient_address,
            &payload.amount,
            &payload.description,
            now,
            expires_at,
            payload.max_claims.unwrap_or(1),
        ],
    ).map_err(|e| {
        eprintln!("Database error creating payment link: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    println!("✅ Created payment link: {} for {}", id, payload.creator_address);

    Ok(Json(json!({
        "success": true,
        "link": {
            "id": id,
            "creatorAddress": payload.creator_address,
            "recipientAddress": payload.recipient_address,
            "amount": payload.amount,
            "description": payload.description,
            "createdAt": now,
            "expiresAt": expires_at,
            "claimCount": 0,
            "maxClaims": payload.max_claims.unwrap_or(1),
            "isActive": true
        }
    })))
}

async fn get_payment_link(
    Path(id): Path<String>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Value>, StatusCode> {
    let db = state.db.lock().unwrap();

    let link: PaymentLink = db.query_row(
        "SELECT id, creator_address, recipient_address, amount, description, created_at, expires_at, claim_count, max_claims, is_active FROM payment_links WHERE id = ?1",
        [&id],
        |row| {
            Ok(PaymentLink {
                id: row.get(0)?,
                creator_address: row.get(1)?,
                recipient_address: row.get(2)?,
                amount: row.get(3)?,
                description: row.get(4)?,
                created_at: row.get(5)?,
                expires_at: row.get(6)?,
                claim_count: row.get(7)?,
                max_claims: row.get(8)?,
                is_active: row.get::<_, i64>(9)? == 1,
            })
        }
    ).map_err(|e| {
        eprintln!("Payment link not found: {:?}", e);
        StatusCode::NOT_FOUND
    })?;

    Ok(Json(json!({
        "success": true,
        "link": link
    })))
}

async fn get_user_payment_links(
    Path(address): Path<String>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Value>, StatusCode> {
    let db = state.db.lock().unwrap();

    let mut stmt = db.prepare(
        "SELECT id, creator_address, recipient_address, amount, description, created_at, expires_at, claim_count, max_claims, is_active
         FROM payment_links
         WHERE creator_address = ?1
         ORDER BY created_at DESC
         LIMIT 50"
    ).map_err(|e| {
        eprintln!("Database error: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let links_iter = stmt.query_map([&address], |row| {
        Ok(PaymentLink {
            id: row.get(0)?,
            creator_address: row.get(1)?,
            recipient_address: row.get(2)?,
            amount: row.get(3)?,
            description: row.get(4)?,
            created_at: row.get(5)?,
            expires_at: row.get(6)?,
            claim_count: row.get(7)?,
            max_claims: row.get(8)?,
            is_active: row.get::<_, i64>(9)? == 1,
        })
    }).map_err(|e| {
        eprintln!("Database error: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let links: Vec<PaymentLink> = links_iter
        .filter_map(|item| item.ok())
        .collect();

    Ok(Json(json!({
        "success": true,
        "links": links
    })))
}

#[derive(Deserialize)]
struct ClaimPaymentLinkRequest {
    payer_address: String,
    amount: String,
    tx_hash: String,
}

async fn claim_payment_link(
    Path(id): Path<String>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<ClaimPaymentLinkRequest>,
) -> Result<Json<Value>, StatusCode> {
    let db = state.db.lock().unwrap();

    // Record the claim
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as i64;

    db.execute(
        "INSERT INTO payment_claims (link_id, payer_address, amount, tx_hash, claimed_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![&id, &payload.payer_address, &payload.amount, &payload.tx_hash, now],
    ).map_err(|e| {
        eprintln!("Database error recording claim: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Increment claim count
    db.execute(
        "UPDATE payment_links SET claim_count = claim_count + 1 WHERE id = ?1",
        [&id],
    ).map_err(|e| {
        eprintln!("Database error updating claim count: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    println!("✅ Claimed payment link: {} by {}", id, payload.payer_address);

    Ok(Json(json!({
        "success": true,
        "message": "Payment claim recorded successfully"
    })))
}
