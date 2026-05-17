//! Ro'eh — core library entry point.
//!
//! Architecture à deux cerveaux :
//! - Cerveau rapide  : `capture` + `rules`  — toujours actif, zéro IA
//! - Cerveau lent    : `ai`                 — réveillé sur signal uniquement
//!
//! Couches : capture → causality → rules → ai → narration → ipc → frontend

use tauri::Manager;

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
        .setup(|app| {
            // Répertoire de données : %APPDATA%\fr.gir-lg.roeh\ (Windows)
            let data_dir = app.path().app_data_dir()
                .expect("impossible de résoudre app_data_dir");
            std::fs::create_dir_all(&data_dir)
                .expect("impossible de créer le répertoire de données");

            let db_path = data_dir.join("roeh.db");
            log::info!("[db] ouverture : {}", db_path.display());

            let db = db::Db::open(&db_path)
                .expect("impossible d'ouvrir la base SQLite");

            // Rend la base accessible à toutes les commandes IPC
            app.manage(db);
            Ok(())
        })
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
