import { PERM_MATRIX } from "@/data/mock";
import type { ProcessNode, PermValue } from "@/types";

// ─── Process tree data ────────────────────────────────────────────────────

const PROCESS_TREE: ProcessNode[] = [
  { name: "services.exe",  pid: 612,  depth: 0, status: "system", net: "—", children: [
    { name: "svchost.exe",              pid: "×24", depth: 1, status: "ok",      net: "0.2 KB/s" },
    { name: "Adobe GC Invoker.exe",     pid: 3902,  depth: 1, status: "warn",    net: "0.1 KB/s", tag: "Télémétrie" },
    { name: "OneDrive.exe",             pid: 1820,  depth: 1, status: "ok",      net: "4 KB/s"   },
  ]},
  { name: "roeh-core.exe", pid: 880,  depth: 0, status: "self",   net: "local", tag: "Sentinelle", children: [
    { name: "roeh-capture",         pid: 881, depth: 1, status: "self", net: "local" },
    { name: "roeh-ai (dormant)",    pid: 882, depth: 1, status: "self", net: "—"    },
  ]},
  { name: "explorer.exe",  pid: 2440, depth: 0, status: "ok",     net: "0.0 KB/s", children: [
    { name: "firefox.exe",  pid: 2056, depth: 1, status: "warn",    net: "12 KB/s",  tag: "7 hôtes"   },
    { name: "Spotify.exe",  pid: 4128, depth: 1, status: "warn",    net: "4.8 MB/s", tag: "4 trackers" },
    { name: "slack.exe",    pid: 5012, depth: 1, status: "ok",      net: "0.1 KB/s" },
    { name: "Code.exe",     pid: 7790, depth: 1, status: "ok",      net: "0.0 KB/s" },
  ]},
  { name: "OUTLOOK.EXE",  pid: 3344, depth: 0, status: "ok",     net: "0.0 KB/s", children: [
    { name: "invoice_2026.exe", pid: 6788, depth: 1, status: "blocked", net: "— bloqué —", tag: "Ransomware @ 14:22" },
  ]},
];

// ─── Process node ─────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  ok: "var(--serene)", warn: "var(--attention)", blocked: "var(--menace)",
  self: "var(--accent)", system: "var(--muted)",
};
const STATUS_LABEL: Record<string, string> = {
  ok: "ok", warn: "à suivre", blocked: "bloqué", self: "auto", system: "système",
};

function ProcNode({ p, isLastInParent }: { p: ProcessNode; isLastInParent: boolean }) {
  const color = STATUS_COLOR[p.status] || "var(--muted)";
  const label = STATUS_LABEL[p.status] || p.status;
  const isSelf    = p.status === "self";
  const isSystem  = p.status === "system";
  const isBlocked = p.status === "blocked";
  const isWarn    = p.status === "warn";

  return (
    <div className="proc-row">
      <div className="proc-tree-cell" style={{ paddingLeft: p.depth * 22 }}>
        {p.depth > 0 && (
          <svg width="20" height="28" style={{ position: "absolute", left: (p.depth - 1) * 22 + 4, top: 0 }}>
            <path
              d={isLastInParent ? "M 10 0 L 10 14 L 20 14" : "M 10 0 L 10 28 M 10 14 L 20 14"}
              stroke="var(--border-strong)" strokeWidth="1" fill="none"
            />
          </svg>
        )}
        <span className="proc-dot" style={{ background: color }} />
        <span className="proc-name" style={{
          fontFamily: isSelf ? "var(--font-serif)" : "var(--font-mono)",
          fontStyle:  isSelf ? "italic" : "normal",
          color:      isSelf ? "var(--accent)" : "var(--ink)",
          fontSize:   isSelf ? 13.5 : 12.5,
        }}>
          {p.name}
        </span>
        {p.tag && (
          <span className={`mini-tag ${isBlocked ? "bad" : isWarn ? "warn" : ""}`}>
            {p.tag}
          </span>
        )}
      </div>
      <span className="proc-pid">{p.pid}</span>
      <span className="proc-net">{p.net}</span>
      <span className={`sev-tag ${isBlocked ? "bad" : isWarn ? "warn" : isSystem || isSelf ? "" : "ok"}`}
        style={isSelf ? { background: "var(--accent-soft)", color: "var(--accent-ink)" } :
               isSystem ? { background: "transparent", color: "var(--muted)" } : {}}>
        {label}
      </span>
    </div>
  );
}

function ProcessTree() {
  return (
    <div className="card" style={{ padding: 0, marginBottom: 22 }}>
      <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>Arbre des processus</h3>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          parent → enfant
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px 90px", gap: 12, padding: "10px 18px", fontSize: 10.5, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>
        <span>Processus</span><span>PID</span><span>Réseau</span><span>Statut</span>
      </div>
      <div style={{ padding: "4px 18px 12px" }}>
        {PROCESS_TREE.map((p, i) => (
          <span key={i}>
            <ProcNode p={p} isLastInParent={false} />
            {p.children?.map((c, j) => (
              <ProcNode key={j} p={c} isLastInParent={j === (p.children?.length ?? 0) - 1} />
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Permissions matrix ───────────────────────────────────────────────────

const PERM_CONFIG: Record<PermValue, { color: string; label: string; pulse?: boolean }> = {
  active:    { color: "var(--menace)",    label: "●", pulse: true },
  yes:       { color: "var(--attention)", label: "●" },
  workspace: { color: "var(--attention)", label: "⊙" },
  inbox:     { color: "var(--attention)", label: "⊙" },
  project:   { color: "var(--attention)", label: "⊙" },
  full:      { color: "var(--menace)",    label: "●" },
  limited:   { color: "var(--attention)", label: "◐" },
  site:      { color: "var(--attention)", label: "◐" },
  ask:       { color: "var(--muted)",     label: "?" },
  idle:      { color: "var(--muted)",     label: "○" },
  no:        { color: "var(--faint)",     label: "·" },
};

const PERM_COLS = [
  { id: "mic",   label: "Micro"    },
  { id: "cam",   label: "Caméra"   },
  { id: "loc",   label: "Loc."     },
  { id: "file",  label: "Fichiers" },
  { id: "notif", label: "Notif."   },
] as const;

function PermCell({ value }: { value: PermValue }) {
  const c = PERM_CONFIG[value] || PERM_CONFIG.no;
  return (
    <div className="perm-cell" title={value}>
      <span style={{ color: c.color, fontSize: 14, fontWeight: 700 }}>{c.label}</span>
      {c.pulse && <span className="perm-pulse" style={{ background: c.color }} />}
    </div>
  );
}

function PermissionsMatrix() {
  return (
    <div className="card" style={{ padding: 0, marginBottom: 22 }}>
      <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid var(--border)" }}>
        <h3 style={{ margin: 0 }}>Permissions par application</h3>
        <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "var(--muted)" }}>
          <strong>●</strong> = actif maintenant · <strong>⊙</strong> = restreint · <strong>○</strong> = autorisé inactif · <strong>·</strong> = refusé
        </p>
      </div>
      <div className="perm-grid">
        <div className="perm-head">App</div>
        {PERM_COLS.map((c) => <div key={c.id} className="perm-head" style={{ textAlign: "center" }}>{c.label}</div>)}
        <div className="perm-head">Activité</div>
        {PERM_MATRIX.map((app) => (
          <span key={app.name}>
            <div className="perm-app">{app.name}</div>
            {PERM_COLS.map((c) => <PermCell key={c.id} value={app.perms[c.id]} />)}
            <div className="perm-when">{app.last}</div>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────

export function SystemScreen() {
  return (
    <>
      <div className="screen-head">
        <h1>Inspection système</h1>
        <p>Ce qui tourne, qui a quelles permissions, ce qui a été modifié récemment.</p>
      </div>

      <div className="card-grid">
        <div className="card">
          <h3>Intégrité de Ro'eh</h3>
          <div className="card-row"><span className="k">Service système</span><span className="v" style={{ color: "var(--serene)" }}>actif</span></div>
          <div className="card-row"><span className="k">Démarré avant</span><span className="v">tous les pilotes</span></div>
          <div className="card-row"><span className="k">Signature au boot</span><span className="v" style={{ color: "var(--serene)" }}>valide</span></div>
          <div className="card-row"><span className="k">Version</span><span className="v">1.4.2 (signée)</span></div>
        </div>
        <div className="card">
          <h3>Démarrage avec Windows</h3>
          <div className="card-row"><span className="k">roeh-core</span><span className="v" style={{ color: "var(--serene)" }}>essentiel</span></div>
          <div className="card-row"><span className="k">OneDrive</span><span className="v">autorisé</span></div>
          <div className="card-row"><span className="k">Spotify Web Helper</span><span className="v" style={{ color: "var(--attention)" }}>désactivable</span></div>
          <div className="card-row"><span className="k">Adobe GC Invoker</span><span className="v" style={{ color: "var(--attention)" }}>désactivable</span></div>
        </div>
        <div className="card">
          <h3>Modifications récentes (registre)</h3>
          <div className="card-row"><span className="k">HKLM\…\Run</span><span className="v">+1 entrée · 2j</span></div>
          <div className="card-row"><span className="k">Pare-feu Windows</span><span className="v" style={{ color: "var(--serene)" }}>règles intactes</span></div>
          <div className="card-row"><span className="k">Tâches planifiées</span><span className="v" style={{ color: "var(--menace)" }}>1 bloquée · 14:22</span></div>
        </div>
      </div>

      <ProcessTree />
      <PermissionsMatrix />
    </>
  );
}
