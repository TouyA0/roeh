import { useAppStore } from "@/store";
import { Icons } from "./Icons";
import type { LiveEvent } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Lit un champ string depuis le detail JSON de l'événement. */
function str(detail: Record<string, unknown>, key: string): string | undefined {
  const v = detail[key];
  return typeof v === "string" ? v : undefined;
}

function num(detail: Record<string, unknown>, key: string): number | undefined {
  const v = detail[key];
  return typeof v === "number" ? v : undefined;
}

function strArr(detail: Record<string, unknown>, key: string): string[] | undefined {
  const v = detail[key];
  return Array.isArray(v) ? (v as string[]) : undefined;
}

// ─── Host list ────────────────────────────────────────────────────────────

interface HostItem { domain: string; country: string; tag: string; sev: string }

function HostList({ hosts }: { hosts: HostItem[] }) {
  return (
    <div className="host-list">
      {hosts.map((h, i) => (
        <div key={i} className="host">
          <span className="domain">{h.domain}</span>
          <span className="country">{h.country}</span>
          <span className={`tag-pill ${h.sev === "ok" ? "ok" : h.sev === "warn" ? "warn" : ""}`}>
            {h.tag}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Detail body ──────────────────────────────────────────────────────────

function DrawerDetail({ event }: { event: LiveEvent }) {
  const d = event.detail;

  const process  = str(d, "process");
  const pid      = num(d, "pid");
  const parent   = str(d, "parent");
  const volume   = str(d, "volume");
  const action   = str(d, "action");
  const behavior = strArr(d, "behavior");

  // Hosts : tableau d'objets bruts
  const rawHosts = Array.isArray(d.hosts) ? (d.hosts as HostItem[]) : undefined;

  return (
    <div className="drawer-body">
      {/* Narrative text */}
      <div className="drawer-section">
        <div style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-soft)" }}>
          {event.text}
        </div>
        {event.intercepted && (
          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
            <span className="sev-tag bad">Action interceptée</span>
          </div>
        )}
      </div>

      {/* Causalité */}
      {process && (
        <div className="drawer-section">
          <h4>Causalité</h4>
          {action  && <div className="detail-row"><span className="k">Action</span><span className="v">{action}</span></div>}
          <div className="detail-row"><span className="k">Processus</span><span className="v mono">{process}</span></div>
          {pid    != null && <div className="detail-row"><span className="k">PID</span><span className="v mono">{pid}</span></div>}
          {parent  && <div className="detail-row"><span className="k">Parent</span><span className="v mono">{parent}</span></div>}
          {volume  && <div className="detail-row"><span className="k">Volume</span><span className="v mono">{volume}</span></div>}
        </div>
      )}

      {/* Destinations */}
      {rawHosts && rawHosts.length > 0 && (
        <div className="drawer-section">
          <h4>Destinations contactées</h4>
          <HostList hosts={rawHosts} />
        </div>
      )}

      {/* Comportement observé */}
      {behavior && behavior.length > 0 && (
        <div className="drawer-section">
          <h4>Comportement observé</h4>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.7 }}>
            {behavior.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="drawer-section">
        <h4>Que faire ?</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button className="btn">Toujours autoriser cette application</button>
          <button className="btn">Toujours bloquer ces destinations</button>
          <button className="btn btn-ghost" style={{ justifyContent: "flex-start" }}>
            Exporter cet événement (STIX)
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main drawer ─────────────────────────────────────────────────────────

export function EventDrawer() {
  const openEvent      = useAppStore((s) => s.openEvent);
  const setOpenEvent   = useAppStore((s) => s.setOpenEvent);
  const setInterceptionOpen = useAppStore((s) => s.setInterceptionOpen);
  const setMode        = useAppStore((s) => s.setMode);
  const setExpertTab   = useAppStore((s) => s.setExpertTab);

  const isOpen = !!openEvent;

  const handleJumpToCausal = () => {
    setMode("expert");
    setExpertTab("causal");
    setOpenEvent(null);
  };

  return (
    <>
      <div
        className={`drawer-backdrop ${isOpen ? "open" : ""}`}
        onClick={() => setOpenEvent(null)}
      />
      <div className={`drawer ${isOpen ? "open" : ""}`}>
        {openEvent && (
          <>
            <div className="drawer-head">
              <div>
                <div className="tag">Détail expert · {openEvent.time}</div>
                <h3>{openEvent.app} — {openEvent.category}</h3>
              </div>
              <button className="icon-btn" onClick={() => setOpenEvent(null)}>
                {Icons.close}
              </button>
            </div>

            <div style={{ padding: "0 4px" }}>
              <div style={{ display: "flex", gap: 8, padding: "14px 18px 0" }}>
                <button
                  className="btn btn-primary"
                  style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}
                  onClick={handleJumpToCausal}
                >
                  {Icons.graph}
                  Voir dans le graphe causal
                </button>
                {openEvent.intercepted && (
                  <button
                    className="btn btn-danger"
                    onClick={() => { setInterceptionOpen(true); setOpenEvent(null); }}
                  >
                    Voir l'interception
                  </button>
                )}
              </div>
            </div>

            <DrawerDetail event={openEvent} />
          </>
        )}
      </div>
    </>
  );
}

// ─── Interception modal ──────────────────────────────────────────────────

export function InterceptionModal() {
  const open    = useAppStore((s) => s.interceptionOpen);
  const setOpen = useAppStore((s) => s.setInterceptionOpen);

  return (
    <div className={`modal-backdrop ${open ? "open" : ""}`} onClick={() => setOpen(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-banner">
          <div className="tag">
            {Icons.alert}
            Interception · risque élevé
          </div>
          <h2>Ro'eh a arrêté une action avant qu'elle ne fasse des dégâts</h2>
        </div>

        <div className="modal-body">
          <p>
            Tu viens d'ouvrir une pièce jointe nommée{" "}
            <strong>facture-2026-04.pdf.exe</strong> dans Outlook.{" "}
            <strong>Ce n'est pas un PDF</strong> — c'est un programme déguisé.
          </p>
          <p>
            En moins d'une seconde, il a commencé à{" "}
            <strong>chiffrer tes documents</strong> et à contacter un serveur en
            Russie qui figure dans les bases d'attaques connues.
          </p>

          <div className="risk-bar">
            <span className="label">Niveau de risque</span>
            <div className="risk-meter">
              <div className="fill" style={{ width: "88%" }} />
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--menace)", fontWeight: 600 }}>
              88 / 100
            </span>
          </div>

          <p style={{ color: "var(--muted)", fontSize: 12.5 }}>
            <strong style={{ color: "var(--ink)" }}>Pourquoi je suis sûr ?</strong>{" "}
            Le processus a tenté de chiffrer plus de 100 fichiers à la seconde,
            supprimé les points de restauration, et contacté un domaine que la
            communauté Ro'eh a déjà signalé comme dangereux 14 fois ce mois-ci.
          </p>
        </div>

        <div className="modal-actions">
          <label className="modal-check">
            <input type="checkbox" defaultChecked />
            Toujours bloquer cette action
          </label>
          <button className="btn btn-ghost" onClick={() => setOpen(false)}>
            Autoriser quand même
          </button>
          <button className="btn btn-primary" onClick={() => setOpen(false)}>
            Bloquer · recommandé
          </button>
        </div>
      </div>
    </div>
  );
}
