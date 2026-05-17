import { useAppStore } from "@/store";
import { invoke } from "@tauri-apps/api/core";
import { Icons } from "@/components/ui";

export function Titlebar() {
  const status = useAppStore((s) => s.status);

  const dotColor =
    status === "menace"    ? "var(--menace)" :
    status === "attention" ? "var(--attention)" :
                             "var(--serene)";

  return (
    <div className="titlebar">
      <div className="titlebar-title">
        <span className="dot" style={{ background: dotColor }} />
        <span>Ro'eh — Tableau de bord</span>
      </div>
      <div className="titlebar-controls">
        <button title="Réduire"  onClick={() => invoke("window_minimize")}>{Icons.minimize}</button>
        <button title="Agrandir" onClick={() => invoke("window_maximize")}>{Icons.maximize}</button>
        <button className="close" title="Fermer" onClick={() => invoke("window_close")}>{Icons.close}</button>
      </div>
    </div>
  );
}
