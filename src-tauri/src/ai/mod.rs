//! # AI — cerveau lent, couche 4
//!
//! IA locale réveillée sur signal uniquement.
//! Ne tourne PAS en continu — endormie par défaut.
//!
//! ## Modèle
//! - Phi-3 Mini ou Mistral 7B quantisé (Q4_K_M)
//! - Interface via Ollama (HTTP local sur 127.0.0.1:11434)
//! - Consommation cible : < 4 GB RAM, négligeable en CPU quand dormante
//!
//! ## Activation
//! Le cerveau lent se réveille uniquement quand `rules::qualify`
//! retourne `Verdict::Suspect`. Il traite par lots (fenêtre 30–60s)
//! pour amortiser le coût de chargement.
//!
//! ## Ce qu'elle fait
//! - Analyse comportementale approfondie (anomalies subtiles)
//! - Corrélation multi-événements sur une fenêtre longue
//! - Génération du score de gravité final
//! - Remplissage des templates de narration (elle ne génère PAS de texte libre)
//!
//! ## Adaptation à l'activité
//! Détection de charge (jeu, visio, vidéo) → IA réduite au strict minimum.
//! Analyse complète pendant l'inactivité ou la nuit.

use crate::rules::QualifiedEvent;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiAnalysis {
    pub final_score: u8,
    pub narrative: String,      // texte narratif en français
    pub technical_detail: String,
    pub recommended_action: Option<String>,
}

/// Analyse approfondie par l'IA locale (Ollama).
/// Appelé uniquement pour les événements `Suspect` ou `Block`.
pub async fn analyze(events: Vec<QualifiedEvent>) -> Vec<AiAnalysis> {
    // TODO: appeler Ollama sur 127.0.0.1:11434
    // 1. Construire le prompt à partir des templates + données événements
    // 2. Appeler POST /api/generate avec le modèle configuré
    // 3. Parser la réponse structurée (JSON mode)
    log::info!("[ai] analyse de {} événements suspects — stub", events.len());
    vec![]
}

/// Vérifie qu'Ollama est disponible localement.
pub async fn health_check() -> bool {
    // TODO: GET http://127.0.0.1:11434/api/tags
    false
}
