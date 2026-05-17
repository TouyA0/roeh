import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Icons } from "@/components/ui";
import type { HistoryRow } from "@/types";

export function HistoryScreen() {
  const [rows,    setRows]    = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query,   setQuery]   = useState("");

  useEffect(() => {
    invoke<HistoryRow[]>("get_history")
      .then(setRows)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = rows.filter(
    (r) =>
      !query ||
      r.app.toLowerCase().includes(query.toLowerCase()) ||
      r.ev.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <div className="screen-head">
        <h1>Mémoire complète</h1>
        <p>Journal immuable de tout ce que Ro'eh a vu sur ta machine. Cherche par application, type d'événement, date.</p>
      </div>

      {/* Search */}
      <div className="search-bar">
        {Icons.search}
        <input
          placeholder="Chercher dans l'historique… ex : spotify, tracker, 14:22"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <kbd>Ctrl K</kbd>
      </div>

      {/* Filters + export */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div className="chip-row">
          <button className="chip active">Tout</button>
          <button className="chip">Aujourd'hui</button>
          <button className="chip">Cette semaine</button>
          <button className="chip">Ce mois</button>
        </div>
        <button className="btn btn-ghost" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
          {Icons.download}
          Exporter
        </button>
      </div>

      {/* Table */}
      <div className="history-table">
        <div className="hist-row head">
          <span>Heure</span>
          <span>Jour</span>
          <span>Événement</span>
          <span>App</span>
          <span>Gravité</span>
        </div>

        {loading ? (
          <div style={{ padding: "24px 18px", color: "var(--muted)", fontSize: 13, textAlign: "center" }}>
            Chargement…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "24px 18px", color: "var(--muted)", fontSize: 13, textAlign: "center" }}>
            {query ? "Aucun résultat pour cette recherche." : "Aucun événement enregistré."}
          </div>
        ) : (
          filtered.map((r, i) => (
            <div key={i} className="hist-row">
              <span className="t">{r.t}</span>
              <span style={{ color: "var(--muted)", fontSize: 12 }}>{r.date}</span>
              <span className="ev">{r.ev}</span>
              <span className="app" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.app}</span>
              <span className={`sev-tag ${r.sev}`}>
                {r.sev === "ok" ? "normal" : r.sev === "warn" ? "à noter" : "intercepté"}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Insights — statiques pour l'instant, seront calculés dynamiquement */}
      <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="card">
          <h3>Comparaison de période</h3>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 10px", lineHeight: 1.55 }}>
            Les patterns récurrents seront affichés ici au fil de la collecte.
          </p>
          <button className="chip">Voir comparatif complet</button>
        </div>
        <div className="card">
          <h3>Dérives détectées</h3>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 10px", lineHeight: 1.55 }}>
            Les comportements en hausse par rapport aux semaines précédentes apparaîtront ici.
          </p>
          <button className="chip">Examiner</button>
        </div>
      </div>
    </>
  );
}
