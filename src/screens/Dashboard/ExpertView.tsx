import { useState, memo } from "react";
import { useAppStore } from "@/store";
import { WorldMap } from "@/components/ui";
import {
  FEED_ROWS,
  MAP_MARKERS,
  PROCESS_SCORES,
  CAUSAL_NODES,
  CAUSAL_EDGES,
} from "@/data/mock";

// ─── KPIs ─────────────────────────────────────────────────────────────────

const ExpertKPIs = memo(function ExpertKPIs() {
  return (
    <div className="kpi-row">
      <div className="kpi">
        <div className="label">Flux observés</div>
        <div className="value">1 247</div>
        <div className="delta">aujourd'hui</div>
      </div>
      <div className="kpi">
        <div className="label">Suspects</div>
        <div className="value" style={{ color: "var(--attention)" }}>23</div>
        <div className="delta">↑ 4 vs hier</div>
      </div>
      <div className="kpi">
        <div className="label">Bloqués</div>
        <div className="value" style={{ color: "var(--menace)" }}>1</div>
        <div className="delta">14:22 · ransomware</div>
      </div>
      <div className="kpi">
        <div className="label">Hôtes uniques</div>
        <div className="value">142</div>
        <div className="delta">14 pays</div>
      </div>
    </div>
  );
});

// ─── Realtime feed ───────────────────────────────────────────────────────

function RealtimeFeed({ tall }: { tall?: boolean }) {
  return (
    <div className="feed" style={tall ? { minHeight: 320 } : {}}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h4 style={{ margin: 0 }}>Flux temps réel</h4>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, color: "var(--menace)" }}>● LIVE</span>
      </div>
      {FEED_ROWS.map((r, i) => (
        <div key={i} className={`feed-row ${r.sev === "bad" ? "bad" : r.sev === "warn" ? "warn" : ""}`}>
          <span className="t">{r.t}</span>
          <span className="h">{r.h}</span>
          <span className="v">{r.v}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Process scoring ─────────────────────────────────────────────────────

function scoreColor(s: number) {
  return s >= 70 ? "var(--menace)" : s >= 35 ? "var(--attention)" : "var(--serene)";
}

const ProcessScoring = memo(function ProcessScoring() {
  return (
    <div className="card" style={{ padding: 0 }}>
      <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>Processus — scoring de risque</h3>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {PROCESS_SCORES.length} actifs · live
        </span>
      </div>
      {/* Header row */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.7fr 0.5fr 0.6fr 1.5fr 1fr", gap: 12, padding: "10px 18px", fontSize: 10.5, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>
        <span>Processus / parent</span><span>Flux</span><span>Susp.</span><span>Score</span><span>Risque</span><span>Note</span>
      </div>
      {PROCESS_SCORES.map((p, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr 0.7fr 0.5fr 0.6fr 1.5fr 1fr", gap: 12, padding: "11px 18px", fontSize: 12.5, borderBottom: i < PROCESS_SCORES.length - 1 ? "1px solid var(--border)" : "none", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink)" }}>{p.name}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)" }}>
              {p.pid ? `PID ${p.pid} · ` : ""}← {p.parent}
            </span>
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-soft)" }}>{p.flux}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: p.suspect > 0 ? "var(--attention)" : "var(--muted)" }}>{p.suspect}</span>
          <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 18, color: scoreColor(p.score), lineHeight: 1 }}>{p.score}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, height: 4, background: "var(--border)", borderRadius: 100, overflow: "hidden" }}>
              <div style={{ width: `${p.score}%`, height: "100%", background: scoreColor(p.score), transition: "width 0.4s" }} />
            </div>
            <span className={`sev-tag ${p.status === "blocked" ? "bad" : p.status === "watch" ? "warn" : "ok"}`}>
              {p.status === "blocked" ? "bloqué" : p.status === "watch" ? "à suivre" : "ok"}
            </span>
          </div>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>{p.note}</span>
        </div>
      ))}
    </div>
  );
});

// ─── Causal graph ─────────────────────────────────────────────────────────

function CausalGraph({
  selectedNode,
  onSelectNode,
}: {
  selectedNode: string | null;
  onSelectNode: (id: string | null) => void;
}) {
  const W = 920, H = 500, nodeWidth = 180, nodeHeight = 44;
  // cx(col) = left padding + col * step
  // step garantit que cx(2) + nodeWidth + right_pad <= W
  const PAD = 40;
  const step = (W - PAD * 2 - nodeWidth) / 2; // ~230
  const cx = (col: number) => PAD + col * step;
  const getNode = (id: string) => CAUSAL_NODES.find((n) => n.id === id)!;

  const sevColor = (sev: string) =>
    sev === "bad" ? "var(--menace)" : sev === "warn" ? "var(--attention)" : "var(--serene)";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "auto", display: "block", minHeight: H }}>
      <defs>
        <marker id="ar"      viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="var(--border-strong)" /></marker>
        <marker id="ar-bad"  viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="var(--menace)" /></marker>
        <marker id="ar-warn" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="var(--attention)" /></marker>
      </defs>

      {/* Column labels */}
      {[{ label: "Action utilisateur", col: 0 }, { label: "Processus", col: 1 }, { label: "Flux / cible", col: 2 }].map((c) => (
        <text key={c.col} x={cx(c.col) + nodeWidth / 2} y={14} textAnchor="middle"
          style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, fill: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {c.label}
        </text>
      ))}

      {/* Edges */}
      {CAUSAL_EDGES.map((e, i) => {
        const a = getNode(e.from), b = getNode(e.to);
        const x1 = cx(a.col) + nodeWidth, y1 = a.y + nodeHeight / 2;
        const x2 = cx(b.col),             y2 = b.y + nodeHeight / 2;
        const midX = (x1 + x2) / 2;
        const color  = e.sev === "bad" ? "var(--menace)" : e.sev === "warn" ? "var(--attention)" : "var(--border-strong)";
        const marker = e.sev === "bad" ? "url(#ar-bad)" : e.sev === "warn" ? "url(#ar-warn)" : "url(#ar)";
        const highlight = selectedNode && (e.from === selectedNode || e.to === selectedNode);
        return (
          <path key={i}
            d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
            stroke={color} strokeWidth={highlight ? 2 : 1.2} fill="none"
            opacity={selectedNode && !highlight ? 0.2 : 0.9}
            markerEnd={marker}
            style={{ transition: "all 0.2s" }}
          />
        );
      })}

      {/* Nodes */}
      {CAUSAL_NODES.map((n) => {
        const x = cx(n.col);
        const isSelected = selectedNode === n.id;
        const isDim = selectedNode && !isSelected &&
          !CAUSAL_EDGES.some((e) =>
            (e.from === selectedNode && e.to === n.id) ||
            (e.to === selectedNode && e.from === n.id)
          );
        const bgColor =
          n.type === "action"  ? "var(--bg-2)" :
          n.type === "process" ? "var(--panel)" :
                                 "var(--bg)";
        return (
          <g key={n.id} style={{ cursor: "pointer", opacity: isDim ? 0.35 : 1, transition: "opacity 0.2s" }}
            onClick={() => onSelectNode(isSelected ? null : n.id)}>
            <rect x={x} y={n.y} width={nodeWidth} height={nodeHeight} rx="6"
              fill={bgColor}
              stroke={isSelected ? "var(--accent)" : sevColor(n.sev)}
              strokeWidth={isSelected ? 2 : 1}
              opacity={n.sev === "ok" ? 0.55 : 1}
            />
            <circle cx={x + 12} cy={n.y + 12} r="3" fill={sevColor(n.sev)} />
            <text x={x + 22} y={n.y + 16}
              style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, fill: "var(--ink)", fontWeight: 500 }}>
              {n.label}
            </text>
            <text x={x + 22} y={n.y + 32}
              style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, fill: "var(--muted)" }}>
              {n.sub}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Expert view ──────────────────────────────────────────────────────────

export function ExpertView() {
  const tab            = useAppStore((s) => s.expertTab);
  const setTab         = useAppStore((s) => s.setExpertTab);
  const highlightedNode    = useAppStore((s) => s.highlightedNode);
  const setHighlightedNode = useAppStore((s) => s.setHighlightedNode);

  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  return (
    <>
      <div className="screen-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 24 }}>
        <div>
          <h1>Vue analyste</h1>
          <p>Flux, géolocalisation, scoring de risque. Données temps réel, croisées avec les feeds CTI publics.</p>
        </div>
        <div className="subtabs">
          <button className={`subtab ${tab === "overview" ? "active" : ""}`} onClick={() => setTab("overview")}>
            Temps réel
          </button>
          <button className={`subtab ${tab === "causal" ? "active" : ""}`} onClick={() => setTab("causal")}>
            Graphe causal
          </button>
        </div>
      </div>

      {/* ── Overview tab ── */}
      {tab === "overview" && (
        <div key="overview" style={{ animation: "screen-in 0.18s ease-out both" }}>
          <ExpertKPIs />
          <div className="expert-grid">
            <div className="card map-card">
              <div className="map-head">
                <div>
                  <h3 style={{ margin: 0, fontSize: 13 }}>Destinations dans le monde</h3>
                  <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "var(--muted)" }}>
                    {MAP_MARKERS.length} hôtes actifs · {selectedMarker ? "isolé" : "clique sur un point"}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 14, alignItems: "center", fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--menace)" }} />Menace
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--attention)" }} />À noter
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--serene)" }} />OK
                  </span>
                </div>
              </div>
              <div className="map-body">
                <WorldMap markers={MAP_MARKERS} selected={selectedMarker} onSelect={setSelectedMarker} />
              </div>
            </div>
            <RealtimeFeed tall />
          </div>
          <ProcessScoring />
        </div>
      )}

      {/* ── Causal graph tab ── */}
      {tab === "causal" && (
        <div key="causal" style={{ animation: "screen-in 0.18s ease-out both" }}>
        <div className="graph-canvas" style={{ marginTop: 4 }}>
          <div className="graph-toolbar">
            <span>action → processus → flux</span>
            <span>
              {highlightedNode
                ? <button className="chip" onClick={() => setHighlightedNode(null)}>désélectionner</button>
                : `${CAUSAL_NODES.length} nœuds · ${CAUSAL_EDGES.length} arêtes`
              }
            </span>
          </div>
          <CausalGraph selectedNode={highlightedNode} onSelectNode={setHighlightedNode} />
        </div>
        </div>
      )}
    </>
  );
}
