import { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/store";

// ─── Types ────────────────────────────────────────────────────────────────

type Sev = "ok" | "warn" | "bad";

interface Notif {
  id: string;
  sev: Sev;
  app: string;
  msg: string;
  time: string;
  unread: boolean;
}

// ─── Mock initial (remplacé par le backend plus tard) ─────────────────────

const INITIAL_NOTIFS: Notif[] = [
  { id: "n1", sev: "bad",  app: "inconnu.exe", msg: "Tentative de ransomware bloquée à temps.",          time: "il y a 2 min",  unread: true  },
  { id: "n2", sev: "warn", app: "Spotify",     msg: "4 trackers publicitaires contactés au lancement.",  time: "il y a 14 min", unread: true  },
  { id: "n3", sev: "warn", app: "Firefox",     msg: "Newsletter The Verge — 7 hôtes, 2 data brokers.",   time: "il y a 1 h",    unread: true  },
  { id: "n4", sev: "warn", app: "Slack",       msg: "Permission micro accordée.",                         time: "il y a 3 h",    unread: false },
  { id: "n5", sev: "ok",   app: "Windows",     msg: "Mise à jour signée installée (v25H2).",             time: "il y a 2 j",    unread: false },
];

// ─── Sub-components ───────────────────────────────────────────────────────

function NotifEmpty() {
  return (
    <div className="notif-empty">
      <div className="notif-empty-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10 21a2 2 0 0 0 4 0" />
        </svg>
      </div>
      <div className="notif-empty-title">Aucune alerte récente</div>
      <div className="notif-empty-sub">Tout est calme. Ro'eh continue d'observer en silence.</div>
    </div>
  );
}

function NotifAllCaughtUp() {
  return (
    <div className="notif-caught-up">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 13 4 4L19 7" />
      </svg>
      <span>Tu es à jour</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────

export function NotificationCenter() {
  const [open, setOpen]   = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>(INITIAL_NOTIFS);
  const containerRef      = useRef<HTMLDivElement>(null);
  const setRoute          = useAppStore((s) => s.setRoute);

  const unreadCount = notifs.filter((n) => n.unread).length;

  // Fermeture au clic extérieur / Escape
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    // Délai pour ne pas attraper le clic d'ouverture
    const t = setTimeout(() => {
      document.addEventListener("mousedown", onMouseDown);
      document.addEventListener("keydown", onEsc);
    }, 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const markAllRead = () => setNotifs((ns) => ns.map((n) => ({ ...n, unread: false })));
  const markOneRead = (id: string) =>
    setNotifs((ns) => ns.map((n) => (n.id === id ? { ...n, unread: false } : n)));

  return (
    <div className="notif-anchor" ref={containerRef}>
      {/* ── Bell button ── */}
      <button
        className={`icon-btn notif-bell ${open ? "is-open" : ""}`}
        title="Alertes"
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10 21a2 2 0 0 0 4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount}</span>
        )}
      </button>

      {/* ── Popover ── */}
      {open && (
        <div className="notif-panel">
          {/* Header */}
          <div className="notif-head">
            <div>
              <div className="notif-title">Alertes</div>
              <div className="notif-sub">
                {unreadCount > 0
                  ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
                  : "tout est à jour"}
              </div>
            </div>
            {unreadCount > 0 && (
              <button className="notif-mark-all" onClick={markAllRead}>
                Tout marquer lu
              </button>
            )}
          </div>

          {/* List */}
          <div className="notif-list">
            {notifs.length === 0 ? (
              <NotifEmpty />
            ) : (
              notifs.map((n) => (
                <button
                  key={n.id}
                  className={`notif-item ${n.unread ? "unread" : ""}`}
                  onClick={() => markOneRead(n.id)}
                >
                  <span className={`notif-dot sev-${n.sev}`} />
                  <div className="notif-body">
                    <div className="notif-line-top">
                      <span className="notif-app">{n.app}</span>
                      <span className="notif-time">{n.time}</span>
                    </div>
                    <div className="notif-msg">{n.msg}</div>
                  </div>
                  {n.unread && <span className="notif-unread-dot" />}
                </button>
              ))
            )}

            {notifs.length > 0 && notifs.every((n) => !n.unread) && (
              <NotifAllCaughtUp />
            )}
          </div>

          {/* Footer */}
          <div className="notif-foot">
            <button
              className="notif-foot-link"
              onClick={() => { setRoute("history"); setOpen(false); }}
            >
              Voir tout l'historique
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
