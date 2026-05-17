import { useEffect, Component } from "react";
import type { ReactNode } from "react";
import { useAppStore } from "@/store";
import { Titlebar, Sidebar, Topbar } from "@/components/layout";
import { EventDrawer, InterceptionModal } from "@/components/ui";
import { Onboarding } from "@/screens/Onboarding";
import { Dashboard } from "@/screens/Dashboard";
import { SystemScreen } from "@/screens/System";
import { HistoryScreen } from "@/screens/History";
import { SettingsScreen } from "@/screens/Settings";

// ─── Error boundary ───────────────────────────────────────────────────────

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div style={{
          padding: 32, fontFamily: "monospace", background: "#1a0a0a",
          color: "#ff6b6b", height: "100vh", overflow: "auto",
          whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.6,
        }}>
          <strong style={{ fontSize: 16, display: "block", marginBottom: 16 }}>
            💥 Erreur de rendu React
          </strong>
          {error.message}
          {"\n\n"}
          {error.stack}
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── App ──────────────────────────────────────────────────────────────────

export default function App() {
  const route  = useAppStore((s) => s.route);
  const theme  = useAppStore((s) => s.settings.theme);

  // Applique le thème sur <html> — gère aussi le mode système
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const apply = () => { root.dataset.theme = mq.matches ? "dark" : "light"; };
      apply();
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    } else {
      root.dataset.theme = theme ?? "system";
    }
  }, [theme]);

  // ── Onboarding (pas de chrome) ───────────────────────────────────────────
  if (route === "onboarding") {
    return (
      <ErrorBoundary>
        <div className="win">
          <Titlebar />
          <Onboarding />
        </div>
      </ErrorBoundary>
    );
  }

  // ── Application principale ───────────────────────────────────────────────
  return (
    <ErrorBoundary>
      <div className="win">
        <Titlebar />
        <div className="win-body">
          <Sidebar />
          <div className="main">
            <Topbar />
            <div className="screen">
              <div className="screen-pad" key={route}>
                {route === "dashboard" && <Dashboard />}
                {route === "system"    && <SystemScreen />}
                {route === "history"   && <HistoryScreen />}
                {route === "settings"  && <SettingsScreen />}
              </div>
            </div>
            {/* Drawer et modal au niveau de .main pour couvrir topbar + contenu */}
            <EventDrawer />
            <InterceptionModal />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
