import { memo } from "react";
import { useAppStore } from "@/store";
import { NarrativeView } from "./NarrativeView";
import { ExpertView }   from "./ExpertView";

export const Dashboard = memo(function Dashboard() {
  const mode = useAppStore((s) => s.mode);
  return (
    <div key={mode} style={{ animation: "screen-in 0.18s ease-out both" }}>
      {mode === "narrative" ? <NarrativeView /> : <ExpertView />}
    </div>
  );
});
