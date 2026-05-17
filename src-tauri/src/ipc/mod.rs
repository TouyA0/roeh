//! # IPC — Interface frontend ↔ backend
//!
//! Commandes Tauri exposées au frontend React via `invoke()`.
//! Toutes les réponses sont sérialisées en JSON.
//!
//! Les commandes lisent la base SQLite via `db::Db` injectée dans le state
//! Tauri. Tant que le module `capture` n'est pas actif, un seed de
//! développement est inséré au premier lancement pour garder l'UI réaliste.

use serde::{Deserialize, Serialize};
use tauri::{command, AppHandle, Manager, State};
use crate::db::{Db, NewEvent};

// ─── Types sérialisés pour le frontend ────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppStatus {
    pub level:   String,  // "serene" | "attention" | "menace"
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FeedRow {
    pub t:   String,
    pub h:   String,
    pub v:   String,
    pub sev: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HistoryRow {
    pub t:    String,
    pub date: String,
    pub app:  String,
    pub ev:   String,
    pub sev:  String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProcessInfo {
    pub name: String,
    pub pid:  Option<u32>,
    pub cpu:  String,
    pub net:  String,
    pub flag: String,
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/// Convertit un timestamp Unix (ms) en "HH:MM:SS".
fn fmt_time(ts: i64) -> String {
    let secs = ts / 1000;
    let h = (secs / 3600) % 24;
    let m = (secs % 3600) / 60;
    let s = secs % 60;
    format!("{:02}:{:02}:{:02}", h, m, s)
}

/// Convertit un timestamp Unix (ms) en "DD/MM/YYYY".
fn fmt_date(ts: i64) -> String {
    // Approximation simple sans dépendance chrono
    let secs = ts / 1000;
    let days = secs / 86400;
    // Epoch = 01/01/1970
    let y = 1970 + days / 365;
    let d = days % 365;
    let m = (d / 30).clamp(0, 11) + 1;
    let d = d % 30 + 1;
    format!("{:02}/{:02}/{}", d, m, y)
}

// ─── Statut global ────────────────────────────────────────────────────────

#[command]
pub async fn get_status(db: State<'_, Db>) -> Result<AppStatus, String> {
    let (_, warn, bad) = db.stats(24).map_err(|e| e.to_string())?;

    let status = if bad > 0 {
        AppStatus { level: "menace".into(),    message: format!("{} action(s) bloquée(s)", bad) }
    } else if warn > 0 {
        AppStatus { level: "attention".into(), message: format!("{} événement(s) à examiner", warn) }
    } else {
        AppStatus { level: "serene".into(),    message: "rien à signaler".into() }
    };

    Ok(status)
}

// ─── Événements (mode narratif) ───────────────────────────────────────────

#[command]
pub async fn get_events(db: State<'_, Db>) -> Result<Vec<serde_json::Value>, String> {
    let rows = db.recent_events(200).map_err(|e| e.to_string())?;

    let events: Vec<serde_json::Value> = rows.into_iter().map(|r| {
        serde_json::json!({
            "id":         r.id,
            "time":       fmt_time(r.ts),
            "sev":        r.severity,
            "app":        r.app,
            "category":   r.category,
            "text":       r.narrative,
            "intercepted": r.intercepted,
            "detail":     serde_json::from_str::<serde_json::Value>(&r.detail_json)
                            .unwrap_or(serde_json::json!({})),
        })
    }).collect();

    Ok(events)
}

// ─── Flux temps réel (mode expert) ───────────────────────────────────────

#[command]
pub async fn get_feed(db: State<'_, Db>) -> Result<Vec<FeedRow>, String> {
    let rows = db.recent_events(30).map_err(|e| e.to_string())?;

    let feed = rows.into_iter().map(|r| FeedRow {
        t:   fmt_time(r.ts),
        h:   r.app.clone(),
        v:   r.category.clone(),
        sev: r.severity,
    }).collect();

    Ok(feed)
}

// ─── Historique complet ───────────────────────────────────────────────────

#[command]
pub async fn get_history(db: State<'_, Db>) -> Result<Vec<HistoryRow>, String> {
    let rows = db.recent_events(500).map_err(|e| e.to_string())?;

    let history = rows.into_iter().map(|r| HistoryRow {
        t:    fmt_time(r.ts),
        date: fmt_date(r.ts),
        app:  r.app,
        ev:   r.narrative.chars().take(80).collect(),
        sev:  r.severity,
    }).collect();

    Ok(history)
}

// ─── Processus actifs ─────────────────────────────────────────────────────

#[command]
pub async fn get_processes() -> Result<Vec<ProcessInfo>, String> {
    // TODO : lire l'arbre de processus Windows via capture::
    Ok(vec![])
}

// ─── Contrôles fenêtre ────────────────────────────────────────────────────

#[command]
pub async fn window_minimize(app: AppHandle) {
    if let Some(win) = app.get_webview_window("main") { let _ = win.minimize(); }
}

#[command]
pub async fn window_maximize(app: AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        if win.is_maximized().unwrap_or(false) { let _ = win.unmaximize(); }
        else { let _ = win.maximize(); }
    }
}

#[command]
pub async fn window_close(app: AppHandle) {
    if let Some(win) = app.get_webview_window("main") { let _ = win.close(); }
}

// ─── Seed de développement ────────────────────────────────────────────────
//
// Insère des événements réalistes dans la base si elle est vide.
// Sera supprimé quand le module `capture` sera opérationnel.

pub fn seed_if_empty(db: &Db) {
    let (ok, warn, bad) = db.stats(8760).unwrap_or((0, 0, 0)); // 1 an
    if ok + warn + bad > 0 {
        return; // déjà des données, on ne touche à rien
    }

    log::info!("[ipc] base vide — insertion du seed de développement");

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64;

    let events = vec![
        NewEvent {
            id: "seed-e1".into(), session_id: None,
            ts: now - 7_200_000, // -2h
            severity: "ok".into(), app: "Windows".into(),
            category: "Système".into(), event_type: "startup".into(),
            narrative: "Démarrage normal. Ro'eh a vérifié son intégrité avant tout autre service.".into(),
            intercepted: false, detail_json: r#"{"type":"startup"}"#.into(),
        },
        NewEvent {
            id: "seed-e2".into(), session_id: None,
            ts: now - 5_040_000, // -1h24
            severity: "warn".into(), app: "Spotify".into(),
            category: "Réseau sortant".into(), event_type: "tracking".into(),
            narrative: "Spotify a contacté 4 serveurs publicitaires au lancement.".into(),
            intercepted: false, detail_json: r#"{"type":"tracking","process":"Spotify.exe"}"#.into(),
        },
        NewEvent {
            id: "seed-e3".into(), session_id: None,
            ts: now - 3_600_000, // -1h
            severity: "warn".into(), app: "Firefox".into(),
            category: "Réseau sortant".into(), event_type: "telemetry".into(),
            narrative: "Lecture d'un article The Verge — 7 hôtes contactés dont 2 data brokers.".into(),
            intercepted: false, detail_json: r#"{"type":"telemetry","process":"firefox.exe"}"#.into(),
        },
        NewEvent {
            id: "seed-e4".into(), session_id: None,
            ts: now - 540_000, // -9min
            severity: "bad".into(), app: "OUTLOOK.EXE".into(),
            category: "Système".into(), event_type: "ransomware".into(),
            narrative: "Pièce jointe invoice_2026.exe a tenté de chiffrer des fichiers et contacter un C2.".into(),
            intercepted: true, detail_json: r#"{"type":"ransomware","process":"invoice_2026.exe","pid":6788}"#.into(),
        },
        NewEvent {
            id: "seed-e5".into(), session_id: None,
            ts: now - 120_000, // -2min
            severity: "warn".into(), app: "Adobe Acrobat".into(),
            category: "Réseau sortant".into(), event_type: "telemetry".into(),
            narrative: "Adobe Acrobat contacte 4 endpoints de télémétrie (était 2 il y a un mois).".into(),
            intercepted: false, detail_json: r#"{"type":"telemetry","process":"Acrobat.exe"}"#.into(),
        },
    ];

    for e in &events {
        if let Err(err) = db.insert_event(e) {
            log::warn!("[ipc] seed insert error: {}", err);
        }
    }

    log::info!("[ipc] {} événements seed insérés", events.len());
}
