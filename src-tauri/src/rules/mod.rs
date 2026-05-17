//! # Rules — cerveau rapide, couche 3
//!
//! Qualification en temps réel : normal ou suspect.
//! Pas d'IA — uniquement des règles déterministes et des signatures connues.
//! Doit réagir en < 1 ms.
//!
//! ## Sources de règles
//! - Signatures embarquées (hashes, domaines, IPs connues malveillantes)
//! - Feeds CTI publics : Abuse.ch, MISP, OTX AlienVault
//!   → téléchargés périodiquement et stockés localement
//! - Règles comportementales : ransomware patterns, C2 beaconing, etc.
//!
//! ## Niveaux de qualification
//! - `Clean`   : comportement attendu, rien à signaler
//! - `Notable` : informatif, mérite d'être affiché (télémétrie, trackers)
//! - `Suspect` : anomalie, réveille le cerveau lent pour analyse
//! - `Block`   : menace confirmée, action immédiate sans attendre l'IA

use crate::causality::CausalEvent;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum Verdict {
    Clean,
    Notable,
    Suspect,
    Block,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualifiedEvent {
    pub event: CausalEvent,
    pub verdict: Verdict,
    pub score: u8,        // 0–100
    pub reason: String,   // explication courte en français
    pub rule_id: Option<String>,
}

/// Qualifie un événement causal avec les règles embarquées.
pub fn qualify(event: CausalEvent) -> QualifiedEvent {
    // TODO: implémenter le moteur de règles
    QualifiedEvent {
        event,
        verdict: Verdict::Clean,
        score: 0,
        reason: String::new(),
        rule_id: None,
    }
}
