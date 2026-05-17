import { useAppStore } from "@/store";
import { Icons } from "@/components/ui";
import type { Route } from "@/types";

const NAV_ITEMS: { id: Route; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard",  icon: Icons.dashboard },
  { id: "system",    label: "Système",    icon: Icons.system    },
  { id: "history",   label: "Historique", icon: Icons.history   },
  { id: "settings",  label: "Paramètres", icon: Icons.settings  },
];

const WATCH_ITEMS = [
  { label: "Réseau entrant",  color: "var(--serene)"    },
  { label: "Réseau sortant",  color: "var(--attention)" },
  { label: "Système interne", color: "var(--serene)"    },
];

export function Sidebar() {
  const route    = useAppStore((s) => s.route);
  const setRoute = useAppStore((s) => s.setRoute);
  const settings = useAppStore((s) => s.settings);

  const initials = settings.name
    ? settings.name.slice(0, 2).toUpperCase()
    : "—";

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="brand">
        <div className="brand-mark">
          Ro<span className="apostrophe">'</span>eh
        </div>
      </div>

      {/* Primary navigation */}
      <div className="nav-section-label">Navigation</div>
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          className={`nav-item ${route === item.id ? "active" : ""}`}
          onClick={() => setRoute(item.id)}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}

      {/* Surveillance zones */}
      <div className="nav-section-label">Surveillé</div>
      {WATCH_ITEMS.map((w) => (
        <div key={w.label} className="nav-item" style={{ cursor: "default" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: w.color, display: "inline-block", flexShrink: 0 }} />
          <span style={{ fontSize: 12.5 }}>{w.label}</span>
        </div>
      ))}

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="user-avatar">{initials}</div>
        <div className="user-meta">
          <span className="name">{settings.name || "Utilisateur"}</span>
          <span className="status">protégé · local</span>
        </div>
      </div>
    </aside>
  );
}
