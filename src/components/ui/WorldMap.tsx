import { useMemo, useState, useEffect } from "react";
import { geoContains } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { MapMarker } from "@/types";

// ─── TopoJSON land data (bundled locally — 100% offline) ──────────────────
// The world-atlas npm package is not a runtime dep; we fetch the JSON from
// the public/ directory which is bundled by Vite at build time.
// File to copy: node_modules/world-atlas/land-110m.json → public/land-110m.json

let _landCache: ReturnType<typeof feature> | null = null;
let _landPromise: Promise<ReturnType<typeof feature>> | null = null;

async function loadLand() {
  if (_landCache) return _landCache;
  if (_landPromise) return _landPromise;
  _landPromise = fetch("/land-110m.json")
    .then((r) => r.json())
    .then((topo: Topology) => {
      const geo = feature(topo, topo.objects["land"] as GeometryCollection);
      _landCache = geo;
      return geo;
    });
  return _landPromise;
}

// ─── Projection (equirectangular, lat -60..82) ───────────────────────────

const W = 880, H = 368;
const COLS = 130, ROWS = 54;
const CELL_W = W / COLS, CELL_H = H / ROWS;

function project(lat: number, lng: number): [number, number] {
  const x = ((lng + 180) / 360) * W;
  const y = ((82 - lat) / 142) * H;
  return [x, y];
}

// ─── Types ────────────────────────────────────────────────────────────────

interface Props {
  markers: MapMarker[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}

// ─── Component ───────────────────────────────────────────────────────────

export function WorldMap({ markers, selected, onSelect }: Props) {
  const [land, setLand] = useState<ReturnType<typeof feature> | null>(_landCache);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (land) return;
    let mounted = true;
    loadLand()
      .then((g) => { if (mounted) setLand(g); })
      .catch(() => { if (mounted) setFailed(true); });
    return () => { mounted = false; };
  }, [land]);

  const dots = useMemo(() => {
    if (!land) return [];
    const result: [number, number][] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const lng = (c / COLS) * 360 - 180 + (360 / COLS) / 2;
        const lat = 82 - (r / ROWS) * 142;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (geoContains(land as any, [lng, lat])) {
          result.push([c, r]);
        }
      }
    }
    return result;
  }, [land]);

  const sevColor = (sev: string) =>
    sev === "bad" ? "var(--menace)" : sev === "warn" ? "var(--attention)" : "var(--serene)";

  const [homeX, homeY] = project(48.85, 2.35); // Paris

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", minWidth: 540 }}>
      <defs>
        <radialGradient id="markerGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.45" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="homeGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Grid lines */}
      <line x1={0} y1={project(0, 0)[1]} x2={W} y2={project(0, 0)[1]}
        stroke="var(--border)" strokeWidth="0.4" strokeDasharray="2 4" opacity="0.55" />
      <line x1={W / 2} y1={0} x2={W / 2} y2={H}
        stroke="var(--border)" strokeWidth="0.4" strokeDasharray="2 4" opacity="0.55" />

      {/* Land dots */}
      {dots.map(([c, r], i) => (
        <circle key={i}
          cx={c * CELL_W + CELL_W / 2}
          cy={r * CELL_H + CELL_H / 2}
          r="1.5" fill="var(--ink-soft)" opacity="0.55"
        />
      ))}

      {/* Loading / error states */}
      {!land && !failed && (
        <text x={W / 2} y={H / 2} textAnchor="middle"
          style={{ fontFamily: "var(--font-mono)", fontSize: 11, fill: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Chargement de la carte…
        </text>
      )}
      {failed && (
        <text x={W / 2} y={H / 2} textAnchor="middle"
          style={{ fontFamily: "var(--font-mono)", fontSize: 11, fill: "var(--muted)" }}>
          Carte hors-ligne
        </text>
      )}

      {/* Arcs */}
      {land && markers.map((m) => {
        const [mx, my] = project(m.lat, m.lng);
        const dx = mx - homeX;
        const midX = (homeX + mx) / 2;
        const midY = Math.min(homeY, my) - Math.abs(dx) * 0.18 - 14;
        const isSelected = selected === m.id;
        return (
          <path key={`arc-${m.id}`}
            d={`M ${homeX} ${homeY} Q ${midX} ${midY} ${mx} ${my}`}
            stroke={sevColor(m.sev)}
            strokeWidth={isSelected ? 1.6 : 0.9}
            fill="none"
            opacity={selected ? (isSelected ? 0.95 : 0.12) : 0.55}
            strokeDasharray="2 3"
            style={{ transition: "all 0.25s" }}
          />
        );
      })}

      {/* Home (Paris) */}
      {land && (
        <g>
          <circle cx={homeX} cy={homeY} r="16" fill="url(#homeGlow)" />
          <circle cx={homeX} cy={homeY} r="3.5" fill="var(--accent)" />
          <circle cx={homeX} cy={homeY} r="7" fill="none" stroke="var(--accent)" strokeWidth="0.8" opacity="0.55" />
          <text x={homeX + 9} y={homeY - 6}
            style={{ fontFamily: "var(--font-mono)", fontSize: 8.5, fill: "var(--accent-ink)", fontWeight: 600 }}>
            ICI
          </text>
        </g>
      )}

      {/* Destination markers */}
      {land && markers.map((m) => {
        const [x, y] = project(m.lat, m.lng);
        const isSelected = selected === m.id;
        const color = sevColor(m.sev);
        // Tooltip position
        const tx = x + 130 > W ? x - 132 : x + 8;
        const ty = y + 30  > H ? y - 32  : y + 8;
        return (
          <g key={m.id} style={{ cursor: "pointer", color }}
            onClick={() => onSelect(isSelected ? null : m.id)}>
            <circle cx={x} cy={y} r="14" fill="url(#markerGlow)" />
            {m.sev !== "ok" && (
              <circle cx={x} cy={y} r="6" fill="none" stroke={color} strokeWidth="0.6" opacity="0.5">
                <animate attributeName="r" from="3" to="12" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.6" to="0" dur="2.4s" repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={x} cy={y} r={isSelected ? 5 : 3.2}
              fill={color} stroke="var(--panel)" strokeWidth="1.3"
              style={{ transition: "r 0.2s" }}
            />
            <text x={x} y={y - 7} textAnchor="middle"
              style={{ fontFamily: "var(--font-mono)", fontSize: 7.5, fill: "var(--ink)", fontWeight: 600 }}>
              {m.country}
            </text>
            {isSelected && (
              <g>
                <rect x={tx} y={ty} width="126" height="28" rx="4"
                  fill="var(--panel)" stroke="var(--border-strong)" strokeWidth="0.6" />
                <text x={tx + 7} y={ty + 12}
                  style={{ fontFamily: "var(--font-mono)", fontSize: 8, fill: "var(--ink)", fontWeight: 600 }}>
                  {m.host}
                </text>
                <text x={tx + 7} y={ty + 22}
                  style={{ fontFamily: "var(--font-mono)", fontSize: 7.5, fill: "var(--muted)" }}>
                  {m.tag} · {m.volume}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
