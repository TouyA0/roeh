//! # Database — couche de persistance locale
//!
//! Base de données SQLite locale, jamais synchronisée vers le cloud.
//! Toutes les données restent sur le disque de l'utilisateur.
//!
//! ## Schéma (à implémenter)
//!
//! ```sql
//! CREATE TABLE events (
//!     id          TEXT PRIMARY KEY,
//!     timestamp   INTEGER NOT NULL,
//!     app         TEXT NOT NULL,
//!     category    TEXT NOT NULL,   -- network_out | network_in | system
//!     severity    TEXT NOT NULL,   -- ok | notable | suspect | block
//!     score       INTEGER,
//!     narrative   TEXT,
//!     raw_json    TEXT,
//!     trigger_id  TEXT REFERENCES events(id)
//! );
//!
//! CREATE TABLE hosts (
//!     domain      TEXT PRIMARY KEY,
//!     reputation  TEXT,
//!     category    TEXT,
//!     first_seen  INTEGER,
//!     last_seen   INTEGER,
//!     hit_count   INTEGER DEFAULT 0
//! );
//!
//! CREATE TABLE settings (
//!     key   TEXT PRIMARY KEY,
//!     value TEXT
//! );
//! ```
//!
//! ## Bibliothèque
//! Utiliser `rusqlite` avec `bundled` feature (SQLite compilé statiquement).
//! Décommenter dans Cargo.toml quand prêt.

/// Initialise la base de données et applique les migrations.
pub fn init() -> Result<(), Box<dyn std::error::Error>> {
    // TODO: ouvrir SQLite dans %APPDATA%\Roeh\roeh.db
    // TODO: appliquer les migrations avec rusqlite_migration
    log::info!("[db] initialisation — stub");
    Ok(())
}
