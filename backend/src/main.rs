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

#[tokio::main]
async fn main() {
    println!("🚀 PrivatePay Backend starting...");

    // Create app state
    let state = Arc::new(AppState {
        message: "PrivatePay API v1.0".to_string(),
    });

    // Build router
    let app = Router::new()
        .route("/health", get(health_check))
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
    message: String,
}

async fn health_check(State(state): State<Arc<AppState>>) -> Json<Value> {
    Json(json!({
        "status": "healthy",
        "message": state.message
    }))
}
