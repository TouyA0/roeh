//! Ro'eh — core library entry point.
//!
//! Architecture à deux cerveaux :
//! - Cerveau rapide  : `capture` + `rules`  — toujours actif, zéro IA
//! - Cerveau lent    : `ai`                 — réveillé sur signal uniquement
//!
//! Couches : capture → causality → rules → ai → narration → ipc → frontend

mod capture;
mod causality;
mod rules;
mod ai;
mod db;
mod ipc;

pub fn run() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            ipc::get_status,
            ipc::get_events,
            ipc::get_feed,
            ipc::get_history,
            ipc::get_processes,
            ipc::window_minimize,
            ipc::window_maximize,
            ipc::window_close,
        ])
        .run(tauri::generate_context!())
        .expect("Erreur critique au démarrage de Ro'eh");
}
