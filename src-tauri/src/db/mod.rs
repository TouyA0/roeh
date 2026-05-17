//! # Database — couche de persistance locale
//!
//! SQLite via rusqlite (bundled). La base est stockée dans le répertoire
//! de données de l'application, jamais synchronisée vers le cloud.
//!
//! ## Schéma
//!
//! ```
//! sessions  — groupes d'événements (vue narrative)
//! events    — événements de sécurité individuels
//! rules     — règles allow/block définies par l'utilisateur
//! hosts     — cache de réputation des hôtes
//! ```
//!
//! ## Accès thread-safe
//! `Db` enveloppe une `Arc<Mutex<Connection>>` : on peut le cloner
//! librement et le passer à des commandes Tauri async.

use rusqlite::{Connection, Result as SqlResult, params};
use std::path::Path;
use std::sync::{Arc, Mutex};

// ─── Handle public ────────────────────────────────────────────────────────

#[derive(Clone)]
pub struct Db(Arc<Mutex<Connection>>);

impl Db {
    /// Ouvre (ou crée) la base à `path` et applique le schéma.
    pub fn open(path: impl AsRef<Path>) -> SqlResult<Self> {
        let conn = Connection::open(path)?;

        // WAL pour de meilleures performances en lecture concurrente
        conn.execute_batch("PRAGMA journal_mode = WAL;")?;
        conn.execute_batch("PRAGMA foreign_keys = ON;")?;

        let db = Db(Arc::new(Mutex::new(conn)));
        db.migrate()?;
        Ok(db)
    }

    fn conn(&self) -> std::sync::MutexGuard<'_, Connection> {
        self.0.lock().expect("db mutex poisoned")
    }

    // ─── Migrations ───────────────────────────────────────────────────────

    fn migrate(&self) -> SqlResult<()> {
        self.conn().execute_batch(SCHEMA)?;
        log::info!("[db] schéma appliqué");
        Ok(())
    }
}

// ─── Schéma SQL ───────────────────────────────────────────────────────────

const SCHEMA: &str = "
-- Sessions : regroupent les événements liés (vue narrative)
CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT    PRIMARY KEY,
    started_at  INTEGER NOT NULL,   -- Unix ms
    trigger     TEXT    NOT NULL,   -- déclencheur lisible (ex : 'Démarrage')
    app         TEXT,               -- application principale impliquée
    sev_hint    TEXT                -- 'attention' | 'menace' | NULL
);

-- Événements : unité de base de tout ce que Ro'eh observe
CREATE TABLE IF NOT EXISTS events (
    id          TEXT    PRIMARY KEY,
    session_id  TEXT    REFERENCES sessions(id) ON DELETE SET NULL,
    ts          INTEGER NOT NULL,           -- Unix ms
    severity    TEXT    NOT NULL,           -- 'ok' | 'warn' | 'bad'
    app         TEXT    NOT NULL,
    category    TEXT    NOT NULL,           -- 'Réseau sortant' | 'Réseau entrant' | 'Système'
    event_type  TEXT    NOT NULL DEFAULT 'normal',
    narrative   TEXT    NOT NULL DEFAULT '',
    intercepted INTEGER NOT NULL DEFAULT 0, -- 1 = bloqué par Ro'eh
    detail_json TEXT    NOT NULL DEFAULT '{}'  -- EventDetail sérialisé en JSON
);

CREATE INDEX IF NOT EXISTS idx_events_ts       ON events(ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_app      ON events(app);
CREATE INDEX IF NOT EXISTS idx_events_severity ON events(severity);
CREATE INDEX IF NOT EXISTS idx_events_session  ON events(session_id);

-- Règles : décisions persistées de l'utilisateur (toujours autoriser / bloquer)
CREATE TABLE IF NOT EXISTS rules (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at   INTEGER NOT NULL,
    rule_type    TEXT    NOT NULL,  -- 'allow' | 'block'
    target_type  TEXT    NOT NULL,  -- 'app' | 'host' | 'domain' | 'category'
    target_value TEXT    NOT NULL,
    reason       TEXT,              -- note libre de l'utilisateur
    active       INTEGER NOT NULL DEFAULT 1,
    expires_at   INTEGER           -- NULL = permanent
);

CREATE INDEX IF NOT EXISTS idx_rules_lookup ON rules(active, target_type, target_value);

-- Hôtes : cache de réputation des domaines / IP contactés
CREATE TABLE IF NOT EXISTS hosts (
    domain      TEXT    PRIMARY KEY,
    country     TEXT    NOT NULL DEFAULT '',
    tag         TEXT    NOT NULL DEFAULT '',  -- ex : 'Télémétrie', 'CDN', 'C2'
    severity    TEXT    NOT NULL DEFAULT 'ok',
    last_seen   INTEGER NOT NULL,
    hit_count   INTEGER NOT NULL DEFAULT 1,
    source      TEXT    NOT NULL DEFAULT 'local'  -- 'local' | 'community' | 'cti'
);

CREATE INDEX IF NOT EXISTS idx_hosts_severity ON hosts(severity);
";

// ─── CRUD — Events ────────────────────────────────────────────────────────

#[derive(Debug)]
pub struct NewEvent {
    pub id:          String,
    pub session_id:  Option<String>,
    pub ts:          i64,
    pub severity:    String,
    pub app:         String,
    pub category:    String,
    pub event_type:  String,
    pub narrative:   String,
    pub intercepted: bool,
    pub detail_json: String,
}

#[derive(Debug)]
pub struct EventRow {
    pub id:          String,
    pub session_id:  Option<String>,
    pub ts:          i64,
    pub severity:    String,
    pub app:         String,
    pub category:    String,
    pub event_type:  String,
    pub narrative:   String,
    pub intercepted: bool,
    pub detail_json: String,
}

impl Db {
    pub fn insert_event(&self, e: &NewEvent) -> SqlResult<()> {
        self.conn().execute(
            "INSERT OR IGNORE INTO events
             (id, session_id, ts, severity, app, category, event_type, narrative, intercepted, detail_json)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)",
            params![
                e.id, e.session_id, e.ts, e.severity, e.app,
                e.category, e.event_type, e.narrative,
                e.intercepted as i32, e.detail_json
            ],
        )?;
        Ok(())
    }

    /// Renvoie les N derniers événements, du plus récent au plus ancien.
    pub fn recent_events(&self, limit: u32) -> SqlResult<Vec<EventRow>> {
        let conn = self.conn();
        let mut stmt = conn.prepare(
            "SELECT id, session_id, ts, severity, app, category, event_type,
                    narrative, intercepted, detail_json
             FROM events ORDER BY ts DESC LIMIT ?1"
        )?;
        let rows = stmt.query_map([limit], |r| Ok(EventRow {
            id:          r.get(0)?,
            session_id:  r.get(1)?,
            ts:          r.get(2)?,
            severity:    r.get(3)?,
            app:         r.get(4)?,
            category:    r.get(5)?,
            event_type:  r.get(6)?,
            narrative:   r.get(7)?,
            intercepted: r.get::<_, i32>(8)? != 0,
            detail_json: r.get(9)?,
        }))?.collect::<SqlResult<_>>()?;
        Ok(rows)
    }

    /// Recherche textuelle basique sur app + narrative.
    pub fn search_events(&self, q: &str, limit: u32) -> SqlResult<Vec<EventRow>> {
        let pattern = format!("%{}%", q);
        let conn = self.conn();
        let mut stmt = conn.prepare(
            "SELECT id, session_id, ts, severity, app, category, event_type,
                    narrative, intercepted, detail_json
             FROM events
             WHERE app LIKE ?1 OR narrative LIKE ?1
             ORDER BY ts DESC LIMIT ?2"
        )?;
        let rows = stmt.query_map(params![pattern, limit], |r| Ok(EventRow {
            id:          r.get(0)?,
            session_id:  r.get(1)?,
            ts:          r.get(2)?,
            severity:    r.get(3)?,
            app:         r.get(4)?,
            category:    r.get(5)?,
            event_type:  r.get(6)?,
            narrative:   r.get(7)?,
            intercepted: r.get::<_, i32>(8)? != 0,
            detail_json: r.get(9)?,
        }))?.collect::<SqlResult<_>>()?;
        Ok(rows)
    }

    /// Compte d'événements par sévérité sur les dernières `hours` heures.
    pub fn stats(&self, hours: u32) -> SqlResult<(i64, i64, i64)> {
        let since = chrono_ms_ago(hours);
        let conn = self.conn();
        let ok:   i64 = conn.query_row("SELECT COUNT(*) FROM events WHERE ts >= ?1 AND severity='ok'",   [since], |r| r.get(0))?;
        let warn: i64 = conn.query_row("SELECT COUNT(*) FROM events WHERE ts >= ?1 AND severity='warn'", [since], |r| r.get(0))?;
        let bad:  i64 = conn.query_row("SELECT COUNT(*) FROM events WHERE ts >= ?1 AND severity='bad'",  [since], |r| r.get(0))?;
        Ok((ok, warn, bad))
    }
}

// ─── CRUD — Rules ─────────────────────────────────────────────────────────

#[derive(Debug)]
pub struct NewRule {
    pub rule_type:    String,
    pub target_type:  String,
    pub target_value: String,
    pub reason:       Option<String>,
    pub expires_at:   Option<i64>,
}

#[derive(Debug)]
pub struct RuleRow {
    pub id:           i64,
    pub created_at:   i64,
    pub rule_type:    String,
    pub target_type:  String,
    pub target_value: String,
    pub reason:       Option<String>,
    pub active:       bool,
    pub expires_at:   Option<i64>,
}

impl Db {
    pub fn insert_rule(&self, r: &NewRule) -> SqlResult<i64> {
        let now = now_ms();
        self.conn().execute(
            "INSERT INTO rules (created_at, rule_type, target_type, target_value, reason, expires_at)
             VALUES (?1,?2,?3,?4,?5,?6)",
            params![now, r.rule_type, r.target_type, r.target_value, r.reason, r.expires_at],
        )?;
        Ok(self.conn().last_insert_rowid())
    }

    pub fn active_rules(&self) -> SqlResult<Vec<RuleRow>> {
        let conn = self.conn();
        let mut stmt = conn.prepare(
            "SELECT id, created_at, rule_type, target_type, target_value, reason, active, expires_at
             FROM rules WHERE active=1 ORDER BY created_at DESC"
        )?;
        let rows = stmt.query_map([], |r| Ok(RuleRow {
            id:           r.get(0)?,
            created_at:   r.get(1)?,
            rule_type:    r.get(2)?,
            target_type:  r.get(3)?,
            target_value: r.get(4)?,
            reason:       r.get(5)?,
            active:       r.get::<_, i32>(6)? != 0,
            expires_at:   r.get(7)?,
        }))?.collect::<SqlResult<_>>()?;
        Ok(rows)
    }

    pub fn deactivate_rule(&self, id: i64) -> SqlResult<()> {
        self.conn().execute("UPDATE rules SET active=0 WHERE id=?1", [id])?;
        Ok(())
    }

    /// Vérifie si une app/hôte/domaine est couvert par une règle active.
    pub fn lookup_rule(&self, target_type: &str, target_value: &str) -> SqlResult<Option<String>> {
        let conn = self.conn();
        let result = conn.query_row(
            "SELECT rule_type FROM rules
             WHERE active=1 AND target_type=?1 AND target_value=?2
             LIMIT 1",
            params![target_type, target_value],
            |r| r.get::<_, String>(0),
        );
        match result {
            Ok(rt) => Ok(Some(rt)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }
}

// ─── CRUD — Hosts ─────────────────────────────────────────────────────────

#[derive(Debug)]
pub struct HostRow {
    pub domain:    String,
    pub country:   String,
    pub tag:       String,
    pub severity:  String,
    pub last_seen: i64,
    pub hit_count: i64,
    pub source:    String,
}

impl Db {
    /// Insère ou met à jour un hôte (upsert).
    pub fn upsert_host(&self, domain: &str, country: &str, tag: &str, severity: &str, source: &str) -> SqlResult<()> {
        let now = now_ms();
        self.conn().execute(
            "INSERT INTO hosts (domain, country, tag, severity, last_seen, hit_count, source)
             VALUES (?1,?2,?3,?4,?5,1,?6)
             ON CONFLICT(domain) DO UPDATE SET
               country   = excluded.country,
               tag       = excluded.tag,
               severity  = excluded.severity,
               last_seen = excluded.last_seen,
               hit_count = hit_count + 1",
            params![domain, country, tag, severity, now, source],
        )?;
        Ok(())
    }

    pub fn suspicious_hosts(&self, limit: u32) -> SqlResult<Vec<HostRow>> {
        let conn = self.conn();
        let mut stmt = conn.prepare(
            "SELECT domain, country, tag, severity, last_seen, hit_count, source
             FROM hosts WHERE severity IN ('warn','bad')
             ORDER BY last_seen DESC LIMIT ?1"
        )?;
        let rows = stmt.query_map([limit], |r| Ok(HostRow {
            domain:    r.get(0)?,
            country:   r.get(1)?,
            tag:       r.get(2)?,
            severity:  r.get(3)?,
            last_seen: r.get(4)?,
            hit_count: r.get(5)?,
            source:    r.get(6)?,
        }))?.collect::<SqlResult<_>>()?;
        Ok(rows)
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

fn now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64
}

fn chrono_ms_ago(hours: u32) -> i64 {
    now_ms() - (hours as i64 * 3_600_000)
}
