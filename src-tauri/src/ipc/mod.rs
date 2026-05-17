//! # IPC — Interface frontend ↔ backend
//!
//! Commandes Tauri exposées au frontend React via `invoke()`.
//! Toutes les réponses sont sérialisées en JSON.

use serde::{Deserialize, Serialize};
use tauri::{command, AppHandle, Manager};

// ─── Types partagés ────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppStatus {
    pub level: String,   // "serene" | "attention" | "menace"
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FeedRow {
    pub t: String,
    pub h: String,
    pub v: String,
    pub sev: String, // "ok" | "warn" | "bad"
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HistoryRow {
    pub t: String,
    pub date: String,
    pub app: String,
    pub ev: String,
    pub sev: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProcessInfo {
    pub name: String,
    pub pid: Option<u32>,
    pub cpu: String,
    pub net: String,
    pub flag: String, // "ok" | "warn" | "self"
}

// ─── Commandes ─────────────────────────────────────────────────────────────

/// Statut global de l'application (couleur de la pill en topbar).
#[command]
pub async fn get_status() -> AppStatus {
    // TODO: lire l'état réel depuis le cerveau rapide
    AppStatus {
        level: "attention".into(),
        message: "2 événements à examiner".into(),
    }
}

/// Événements du jour pour le mode narratif.
#[command]
pub async fn get_events() -> Vec<serde_json::Value> {
    // TODO: requêter db::events pour aujourd'hui
    vec![]
}

/// Flux réseau temps réel pour le mode expert.
#[command]
pub async fn get_feed() -> Vec<FeedRow> {
    // TODO: lire le ring buffer de capture
    vec![]
}

/// Historique complet pour l'écran Mémoire.
#[command]
pub async fn get_history() -> Vec<HistoryRow> {
    // TODO: requêter db::events avec filtres
    vec![]
}

/// Processus actifs avec leur activité réseau.
#[command]
pub async fn get_processes() -> Vec<ProcessInfo> {
    // TODO: lire l'arbre de processus Windows
    vec![]
}

// ─── Contrôles de fenêtre (titlebar custom) ────────────────────────────────

#[command]
pub async fn window_minimize(app: AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.minimize();
    }
}

#[command]
pub async fn window_maximize(app: AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        if win.is_maximized().unwrap_or(false) {
            let _ = win.unmaximize();
        } else {
            let _ = win.maximize();
        }
    }
}

#[command]
pub async fn window_close(app: AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.close();
    }
}
