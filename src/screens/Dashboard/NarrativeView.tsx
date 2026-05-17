import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "@/store";
import { Icons } from "@/components/ui";
import type { LiveEvent } from "@/types";

// ─── Filters ─────────────────────────────────────────────────────────────

type Filter = "Tout" | "Réseau" | "Système";
type Period = "Jour" | "Semaine" | "Mois";

function NarrativeFilters({
  filter, setFilter, period, setPeriod,
}: {
  filter: Filter; setFilter: (f: Filter) => void;
  period: Period; setPeriod: (p: Period) => void;
}) {
  return (
    <div className="filter-bar">
      <div className="chip-row">
        {(["Tout", "Réseau", "Système"] as Filter[]).map((f) => (
          <button key={f} className={`chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>
      <div className="chip-row">
        {(["Jour", "Semaine", "Mois"] as Period[]).map((p) => (
          <button key={p} className={`chip ${period === p ? "active" : ""}`} onClick={() => setPeriod(p)}>
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Bubble ───────────────────────────────────────────────────────────────

const SEV_LABEL = { ok: "normal", warn: "à noter", bad: "intercepté" } as const;

function Bubble({ event, onOpen }: { event: LiveEvent; onOpen: (e: LiveEvent) => void }) {
  const cls = event.sev === "warn" ? "attention" : event.sev === "bad" ? "menace" : "";
  return (
    <div className={`bubble ${cls}`} onClick={() => onOpen(event)}>
      <span className="bubble-marker" />
      <div className="bubble-content">
        <div className="bubble-meta">
          <span>{event.time}</span>
          <span>·</span>
          <span>{event.category}</span>
          <span>·</span>
          <span>{event.app}</span>
          {event.intercepted && <span className="sev" style={{ color: "var(--menace)" }}>intercepté</span>}
          {!event.intercepted && <span className="sev">{SEV_LABEL[event.sev]}</span>}
        </div>
        <div className="bubble-text">{event.text}</div>
      </div>
      <div className="bubble-cta">
        détail
        {Icons.chevron}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)" }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>🌿</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-soft)" }}>Rien à signaler</div>
      <div style={{ fontSize: 13, marginTop: 4 }}>Ro'eh surveille en silence.</div>
    </div>
  );
}

// ─── Main view ───────────────────────────────────────────────────────────

export function NarrativeView() {
  const setOpenEvent = useAppStore((s) => s.setOpenEvent);

  const [events,  setEvents]  = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<Filter>("Tout");
  const [period,  setPeriod]  = useState<Period>("Jour");

  useEffect(() => {
    invoke<LiveEvent[]>("get_events")
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = events.filter((ev) => {
    if (filter === "Réseau")  return ev.category.startsWith("Réseau");
    if (filter === "Système") return ev.category === "Système";
    return true;
  });

  // Groupe par date (extraite du champ `time` qui est "HH:MM:SS")
  // On regroupera tout sous "Aujourd'hui" pour l'instant ;
  // quand le backend renverra des sessions, on adaptera.
  const groups: { label: string; events: LiveEvent[] }[] = filtered.length > 0
    ? [{ label: "Aujourd'hui", events: filtered }]
    : [];

  return (
    <>
      <div className="screen-head">
        <h1>Aujourd'hui sur ta machine</h1>
        <p>Voici ce qui s'est passé pendant que tu travaillais. Clique sur un événement pour voir les détails techniques.</p>
      </div>

      <NarrativeFilters
        filter={filter} setFilter={setFilter}
        period={period} setPeriod={setPeriod}
      />

      {loading ? (
        <div style={{ textAlign: "center", color: "var(--muted)", padding: 40, fontSize: 13 }}>
          Chargement des événements…
        </div>
      ) : groups.length === 0 ? (
        <EmptyState />
      ) : (
        groups.map((g) => (
          <div key={g.label} className="session">
            <div className="session-header">
              <span className="session-time">{g.label}</span>
              <span className="session-trigger">Activité surveillée</span>
              <span className="session-line" />
            </div>
            <div className="session-events">
              {g.events.map((ev) => (
                <Bubble key={ev.id} event={ev} onOpen={(e) => setOpenEvent(e)} />
              ))}
            </div>
          </div>
        ))
      )}
    </>
  );
}
