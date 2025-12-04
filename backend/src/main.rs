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
use std::sync::Arc;
use alloy::{
    primitives::{Address, U256, Bytes},
    providers::{Provider, ProviderBuilder},
    transports::http::Http,
};

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

    // Create app state
    let state = Arc::new(AppState {
        provider,
        deployer_address,
    });

    // Build router
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/api/compute-address", post(compute_address))
        .route("/api/balance/:address", get(get_balance))
        .route("/api/balance-usdc/:address", get(get_usdc_balance))
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
    let owner: Address = payload.owner.parse()
        .map_err(|_| StatusCode::BAD_REQUEST)?;

    // Generate random salt if not provided
    let salt = if let Some(s) = payload.salt {
        hex::decode(&s[2..]).map_err(|_| StatusCode::BAD_REQUEST)?
    } else {
        let random_bytes: [u8; 32] = rand::random();
        random_bytes.to_vec()
    };

    let salt_hex = format!("0x{}", hex::encode(&salt));

    // TODO: Call contract to compute address
    // For now, return placeholder
    let wallet_address = format!("0x{}", hex::encode(&[0u8; 20]));

    Ok(Json(json!({
        "wallet_address": wallet_address,
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
