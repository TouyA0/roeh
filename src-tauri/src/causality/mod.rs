//! # Causality — cerveau rapide, couche 2
//!
//! Corrélation temporelle entre actions utilisateur et flux générés.
//!
//! ## Principe
//! Ro'eh maintient une fenêtre glissante (~5 secondes) des actions
//! utilisateur (clic, ouverture d'application, navigation web).
//! Chaque événement réseau ou système capturé est associé à l'action
//! la plus récente du même processus ou de ses ancêtres.
//!
//! ## Exemple
//! ```
//! 10:30:00  [action]  firefox.exe — navigation vers theverge.com
//! 10:30:01  [réseau]  firefox.exe → doubleclick.net:443   ← causé par ↑
//! 10:30:01  [réseau]  firefox.exe → criteo.com:443        ← causé par ↑
//! ```
//!
//! ## Plan d'implémentation
//! - Ring buffer d'actions (max 128 entrées)
//! - Hash map PID → action parente
//! - Résolution récursive via arbre de processus (pour les enfants)

use crate::capture::RawEvent;
use serde::{Deserialize, Serialize};

/// Événement enrichi avec sa cause.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CausalEvent {
    pub raw: RawEvent,
    /// Action utilisateur qui a déclenché cet événement, si connue.
    pub trigger: Option<UserAction>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserAction {
    pub description: String,
    pub timestamp_ms: u64,
    pub app: String,
}

/// Corrèle un événement brut avec une action utilisateur.
pub fn correlate(event: RawEvent) -> CausalEvent {
    // TODO: implémenter la corrélation temporelle
    CausalEvent { raw: event, trigger: None }
}
