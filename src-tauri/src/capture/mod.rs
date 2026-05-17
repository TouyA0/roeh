//! # Capture — cerveau rapide, couche 1
//!
//! Acquisition de tous les événements réseau et système Windows.
//!
//! ## Plan d'implémentation
//!
//! ### Réseau (sortant + entrant)
//! - **ETW** (Event Tracing for Windows) via `windows-rs` :
//!   provider `Microsoft-Windows-TCPIP` pour les connexions TCP/UDP
//! - **WinDivert** (optionnel) pour l'inspection au niveau paquet
//!   et l'interception avant transmission
//!
//! ### Système interne
//! - **ETW** provider `Microsoft-Windows-Kernel-File` → modifications fichiers
//! - **ETW** provider `Microsoft-Windows-Kernel-Registry` → clés registre
//! - **WMI** ou **EnumProcesses** → arbre de processus
//!
//! ### Sortie
//! Chaque événement brut est envoyé dans le canal `causality` pour corrélation.

use serde::{Deserialize, Serialize};

/// Événement brut capturé avant toute qualification.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RawEvent {
    pub timestamp_ms: u64,
    pub kind: EventKind,
    pub pid: u32,
    pub process_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum EventKind {
    /// Connexion réseau sortante
    NetworkOutbound {
        remote_addr: String,
        remote_port: u16,
        protocol: String,
        bytes: u64,
    },
    /// Connexion réseau entrante
    NetworkInbound {
        local_port: u16,
        remote_addr: String,
        protocol: String,
    },
    /// Modification de fichier
    FileModified {
        path: String,
        operation: String, // create | write | delete | rename
    },
    /// Modification du registre
    RegistryModified {
        key: String,
        value_name: Option<String>,
        operation: String,
    },
    /// Nouveau processus créé
    ProcessCreated {
        parent_pid: u32,
        image_path: String,
        command_line: String,
    },
}

/// Lance le thread de capture en arrière-plan.
/// Doit démarrer avant tout autre service utilisateur.
pub fn start() {
    // TODO: initialiser ETW session + WinDivert
    log::info!("[capture] démarrage — stub");
}
