import { useAppStore } from "@/store";
import { SESSIONS } from "@/data/mock";
import { Icons } from "./Icons";
import type { RoehEvent } from "@/types";

// ─── Detail rows ─────────────────────────────────────────────────────────

function HostList({ hosts }: { hosts: NonNullable<RoehEvent["detail"]["hosts"]> }) {
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

// ─── Main drawer ─────────────────────────────────────────────────────────

export function EventDrawer() {
  const openEventId    = useAppStore((s) => s.openEventId);
  const setOpenEventId = useAppStore((s) => s.setOpenEventId);
  const setInterceptionOpen = useAppStore((s) => s.setInterceptionOpen);
  const setMode        = useAppStore((s) => s.setMode);
  const setExpertTab   = useAppStore((s) => s.setExpertTab);
  const setHighlightedNode = useAppStore((s) => s.setHighlightedNode);

  // Find the event in mock data
  const event: RoehEvent | undefined = openEventId
    ? SESSIONS.flatMap((s) => s.events).find((e) => e.id === openEventId)
    : undefined;

  const isOpen = !!event;
  const d = event?.detail ?? ({} as import("@/types").EventDetail);

  const handleJumpToCausal = () => {
    if (!event) return;
    setMode("expert");
    setExpertTab("causal");
    // Highlight the process node linked to this event
    setHighlightedNode(null);
    setOpenEventId(null);
  };

  return (
    <>
      <div
        className={`drawer-backdrop ${isOpen ? "open" : ""}`}
        onClick={() => setOpenEventId(null)}
      />
      <div className={`drawer ${isOpen ? "open" : ""}`}>
        {event && (
          <>
            <div className="drawer-head">
              <div>
                <div className="tag">Détail expert · {event.time}</div>
                <h3>{event.app} — {event.category}</h3>
              </div>
              <button className="icon-btn" onClick={() => setOpenEventId(null)}>
                {Icons.close}
              </button>
            </div>

            <div className="drawer-body">
              {/* Narrative text */}
              <div className="drawer-section">
                <div style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-soft)" }}>
                  {event.text}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                  <button className="btn btn-primary"
                    style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}
                    onClick={handleJumpToCausal}>
                    {Icons.graph}
                    Voir dans le graphe causal
                  </button>
                  {event.intercepted && (
                    <button className="btn btn-danger"
                      onClick={() => { setInterceptionOpen(true); setOpenEventId(null); }}>
                      Voir l'interception
                    </button>
                  )}
                </div>
              </div>

              {/* Causality */}
              {d.process && (
                <div className="drawer-section">
                  <h4>Causalité</h4>
                  {d.action  && <div className="detail-row"><span className="k">Action</span><span className="v">{d.action}</span></div>}
                  <div className="detail-row"><span className="k">Processus</span><span className="v mono">{d.process}</span></div>
                  {d.pid     && <div className="detail-row"><span className="k">PID</span><span className="v mono">{d.pid}</span></div>}
                  {d.parent  && <div className="detail-row"><span className="k">Parent</span><span className="v mono">{d.parent}</span></div>}
                  {d.volume  && <div className="detail-row"><span className="k">Volume</span><span className="v mono">{d.volume}</span></div>}
                </div>
              )}

              {/* Hosts */}
              {d.hosts && d.hosts.length > 0 && (
                <div className="drawer-section">
                  <h4>Destinations contactées</h4>
                  <HostList hosts={d.hosts} />
                </div>
              )}

              {/* Behavior */}
              {d.behavior && d.behavior.length > 0 && (
                <div className="drawer-section">
                  <h4>Comportement observé</h4>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.7 }}>
                    {d.behavior.map((b, i) => <li key={i}>{b}</li>)}
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
          </>
        )}
      </div>
    </>
  );
}

// ─── Interception modal ──────────────────────────────────────────────────

export function InterceptionModal() {
  const open = useAppStore((s) => s.interceptionOpen);
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
