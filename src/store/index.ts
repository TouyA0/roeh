import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Route,
  Status,
  Mode,
  ExpertTab,
  AppSettings,
} from "@/types";

// ─── State ─────────────────────────────────────────────────────────────────

interface AppState {
  // Navigation
  route: Route;
  // Dashboard
  mode: Mode;
  expertTab: ExpertTab;
  // Status global (mis à jour par le backend)
  status: Status;
  // Paramètres persistés
  settings: AppSettings;
  // Event drawer ouvert (id de l'événement)
  openEventId: string | null;
  // Interception modal
  interceptionOpen: boolean;
  // Nœud causal sélectionné
  highlightedNode: string | null;
}

// ─── Actions ───────────────────────────────────────────────────────────────

interface AppActions {
  setRoute: (route: Route) => void;
  setMode: (mode: Mode) => void;
  setExpertTab: (tab: ExpertTab) => void;
  setStatus: (status: Status) => void;
  updateSettings: (partial: Partial<AppSettings>) => void;
  completeOnboarding: (data: Pick<AppSettings, "name" | "pin"> & Partial<AppSettings>) => void;
  setOpenEventId: (id: string | null) => void;
  setInterceptionOpen: (open: boolean) => void;
  setHighlightedNode: (id: string | null) => void;
}

// ─── Valeurs par défaut ────────────────────────────────────────────────────

const DEFAULT_SETTINGS: AppSettings = {
  protect: true,
  narrativeDefault: true,
  collective: true,
  sensitivity: 60,
  name: "",
  pin: "",
  theme: "system",
};

// ─── Store ─────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set) => ({
      // State initial
      route: "onboarding",
      mode: "narrative",
      expertTab: "overview",
      status: "attention",
      settings: DEFAULT_SETTINGS,
      openEventId: null,
      interceptionOpen: false,
      highlightedNode: null,

      // Actions
      setRoute: (route) => set({ route }),
      setMode: (mode) => set({ mode }),
      setExpertTab: (tab) => set({ expertTab: tab }),
      setStatus: (status) => set({ status }),

      updateSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),

      completeOnboarding: (data) =>
        set((state) => ({
          route: "dashboard",
          settings: { ...state.settings, ...data },
        })),

      setOpenEventId: (id) => set({ openEventId: id }),
      setInterceptionOpen: (open) => set({ interceptionOpen: open }),
      setHighlightedNode: (id) => set({ highlightedNode: id }),
    }),
    {
      name: "roeh-store",
      // Ne pas persister les états éphémères
      partialize: (state) => ({
        route: state.route,
        mode: state.mode,
        settings: state.settings,
      }),
    }
  )
);
