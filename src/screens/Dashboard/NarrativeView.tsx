import { useState } from "react";
import { useAppStore } from "@/store";
import { SESSIONS } from "@/data/mock";
import { Icons } from "@/components/ui";
import type { RoehEvent, Session } from "@/types";

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

function Bubble({ event, onOpen }: { event: RoehEvent; onOpen: (e: RoehEvent) => void }) {
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
          <span className="sev">{SEV_LABEL[event.sev]}</span>
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

// ─── Session ──────────────────────────────────────────────────────────────

function SessionBlock({ session, onOpen }: { session: Session; onOpen: (e: RoehEvent) => void }) {
  return (
    <div className="session">
      <div className="session-header">
        <span className="session-time">{session.time}</span>
        <span className="session-trigger">{session.trigger}</span>
        <span className="session-line" />
      </div>
      <div className="session-events">
        {session.events.map((ev) => (
          <Bubble key={ev.id} event={ev} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

// ─── Main view ───────────────────────────────────────────────────────────

export function NarrativeView() {
  const setOpenEventId = useAppStore((s) => s.setOpenEventId);

  const [filter, setFilter] = useState<Filter>("Tout");
  const [period, setPeriod] = useState<Period>("Jour");

  const filteredSessions = SESSIONS.map((s) => ({
    ...s,
    events: s.events.filter((ev) => {
      if (filter === "Réseau") return ev.category.startsWith("Réseau");
      if (filter === "Système") return ev.category === "Système";
      return true;
    }),
  })).filter((s) => s.events.length > 0);

  return (
    <>
      <div className="screen-head">
        <h1>Aujourd'hui sur ta machine</h1>
        <p>Voici ce qui s'est passé pendant que tu travaillais. Clique sur un événement pour voir les détails techniques.</p>
      </div>
      <NarrativeFilters filter={filter} setFilter={setFilter} period={period} setPeriod={setPeriod} />
      {filteredSessions.map((s) => (
        <SessionBlock key={s.id} session={s} onOpen={(ev) => setOpenEventId(ev.id)} />
      ))}
    </>
  );
}
