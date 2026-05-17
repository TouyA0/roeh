import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/store";
import { Icons, NotificationCenter } from "@/components/ui";
import type { Status, Mode } from "@/types";

// ─── Status pill ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<Status, { label: string; sub: string }> = {
  serene:    { label: "Serein",    sub: "rien à signaler" },
  attention: { label: "Attention", sub: "2 événements à examiner" },
  menace:    { label: "Menace",    sub: "action récente bloquée" },
};

function StatusPill({ status }: { status: Status }) {
  const { label, sub } = STATUS_CONFIG[status];
  return (
    <div className={`status-pill ${status}`}>
      <span className="pulse" />
      <span className="label">
        {label}
        <small>· {sub}</small>
      </span>
    </div>
  );
}

// ─── Mode switch ──────────────────────────────────────────────────────────

function ModeSwitch({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ left: 3, width: 0 });

  useEffect(() => {
    if (!ref.current) return;
    const btns = ref.current.querySelectorAll("button");
    const active = mode === "narrative" ? btns[0] : btns[1];
    if (active) {
      setThumb({ left: active.offsetLeft, width: active.offsetWidth });
    }
  }, [mode]);

  return (
    <div className="mode-switch" ref={ref}>
      <div className="thumb" style={{ left: thumb.left, width: thumb.width || undefined }} />
      <button className={mode === "narrative" ? "active" : ""} onClick={() => setMode("narrative")}>
        Narratif
      </button>
      <button className={mode === "expert" ? "active" : ""} onClick={() => setMode("expert")}>
        Expert
      </button>
    </div>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────

const ROUTE_LABELS: Record<string, string> = {
  system:   "Inspection système",
  history:  "Mémoire complète",
  settings: "Configuration",
};

export function Topbar() {
  const route    = useAppStore((s) => s.route);
  const status   = useAppStore((s) => s.status);
  const mode     = useAppStore((s) => s.mode);
  const setMode  = useAppStore((s) => s.setMode);
  const setRoute = useAppStore((s) => s.setRoute);

  return (
    <div className="topbar">
      <StatusPill status={status} />

      {route === "dashboard" ? (
        <ModeSwitch mode={mode} setMode={setMode} />
      ) : (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {ROUTE_LABELS[route] ?? route}
        </span>
      )}

      <div className="top-actions">
        <NotificationCenter />
        <button className="icon-btn" title="Paramètres" onClick={() => setRoute("settings")}>
          {Icons.settings}
        </button>
      </div>
    </div>
  );
}
