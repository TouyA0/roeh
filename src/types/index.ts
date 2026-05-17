// ─── Primitives ────────────────────────────────────────────────────────────

export type Severity = "ok" | "warn" | "bad";

export type Route = "onboarding" | "dashboard" | "system" | "history" | "settings";

export type Status = "serene" | "attention" | "menace";

export type Mode = "narrative" | "expert";

export type ExpertTab = "overview" | "causal";

// ─── Réseau ────────────────────────────────────────────────────────────────

export interface Host {
  domain: string;
  country: string;
  tag: string;
  sev: Severity;
}

export interface FeedRow {
  t: string;
  h: string;
  v: string;
  sev: Severity;
}

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  country: string;
  host: string;
  tag: string;
  volume: string;
  sev: Severity;
}

// ─── Événements ────────────────────────────────────────────────────────────

export type EventDetailType =
  | "startup"
  | "telemetry"
  | "tracking"
  | "trackers"
  | "normal"
  | "ransomware"
  | "permission"
  | "repeat";

export interface EventDetail {
  type: EventDetailType;
  process?: string;
  pid?: number;
  parent?: string;
  hosts?: Host[];
  volume?: string;
  action?: string;
  behavior?: string[];
  resource?: string;
  count?: number;
  period?: string;
}

export interface RoehEvent {
  id: string;
  time: string;
  sev: Severity;
  app: string;
  category: "Réseau sortant" | "Réseau entrant" | "Système";
  /** Texte narratif — peut être du JSX donc React.ReactNode */
  text: React.ReactNode;
  intercepted?: boolean;
  detail: EventDetail;
}

export interface Session {
  id: string;
  time: string;
  trigger: React.ReactNode;
  triggerApp?: string;
  sevHint?: "menace" | "attention";
  events: RoehEvent[];
}

// ─── Événement DB (retourné par invoke("get_events")) ──────────────────────

export interface LiveEvent {
  id:          string;
  time:        string;    // "HH:MM:SS"
  sev:         Severity;
  app:         string;
  category:    string;
  text:        string;    // narrative plain-text
  intercepted: boolean;
  detail:      Record<string, unknown>;
}

// ─── Historique ────────────────────────────────────────────────────────────

export interface HistoryRow {
  t: string;
  date: string;
  app: string;
  ev: string;
  sev: Severity;
}

// ─── Système ───────────────────────────────────────────────────────────────

export type ProcessStatus = "ok" | "warn" | "blocked" | "self" | "system";

export interface ProcessNode {
  name: string;
  pid: number | string;
  depth: number;
  status: ProcessStatus;
  net: string;
  tag?: string;
  children?: ProcessNode[];
}

export interface ProcessInfo {
  name: string;
  pid: number | null;
  cpu: string;
  net: string;
  flag: "ok" | "warn" | "self";
}

export type PermValue =
  | "active"
  | "yes"
  | "workspace"
  | "inbox"
  | "project"
  | "full"
  | "limited"
  | "site"
  | "ask"
  | "idle"
  | "no";

export interface AppPermissions {
  name: string;
  perms: {
    mic: PermValue;
    cam: PermValue;
    loc: PermValue;
    file: PermValue;
    notif: PermValue;
  };
  last: string;
}

// ─── Expert mode ───────────────────────────────────────────────────────────

export type ProcessScoreStatus = "ok" | "watch" | "blocked";

export interface ProcessScore {
  name: string;
  pid: number | null;
  parent: string;
  flux: number;
  suspect: number;
  score: number;
  status: ProcessScoreStatus;
  note: string;
}

// ─── Graphe causal ─────────────────────────────────────────────────────────

export type NodeType = "action" | "process" | "flow";

export interface CausalNode {
  id: string;
  col: 0 | 1 | 2;
  y: number;
  type: NodeType;
  label: string;
  sub: string;
  sev: Severity;
}

export interface CausalEdge {
  from: string;
  to: string;
  sev?: Severity;
}

// ─── Paramètres ────────────────────────────────────────────────────────────

export type Theme = "light" | "dark" | "system";

export interface AppSettings {
  protect: boolean;
  narrativeDefault: boolean;
  collective: boolean;
  sensitivity: number; // 0–100
  name: string;
  pin: string;
  theme: Theme;
}
