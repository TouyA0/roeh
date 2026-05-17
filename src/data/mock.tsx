// Ro'eh — données mock réalistes (portées depuis le design)
// Ces données simulent une journée typique sur la machine d'un utilisateur.
// Elles seront remplacées progressivement par des données réelles du backend.

import type {
  Session,
  FeedRow,
  HistoryRow,
  ProcessInfo,
  AppPermissions,
  ProcessScore,
  MapMarker,
  CausalNode,
  CausalEdge,
} from "@/types";

// ─── Sessions narratives ──────────────────────────────────────────────────

export const SESSIONS: Session[] = [
  {
    id: "s1",
    time: "08:42",
    trigger: "Démarrage de la machine",
    events: [
      {
        id: "e1", time: "08:42:03", sev: "ok", app: "Windows", category: "Système",
        text: <>Démarrage normal. Ro'eh a vérifié sa propre intégrité avant tout autre service, et a chargé <code>17</code> processus système attendus.</>,
        detail: { type: "startup" },
      },
      {
        id: "e2", time: "08:42:30", sev: "warn", app: "Mises à jour Windows", category: "Réseau sortant",
        text: <>Windows a contacté <strong>8 serveurs Microsoft</strong> pour des vérifications de mises à jour et de la télémétrie. Comportement attendu mais informatif.</>,
        detail: { type: "telemetry", hosts: 8 as unknown as undefined },
      },
    ],
  },
  {
    id: "s2",
    time: "09:15",
    trigger: <>Tu as ouvert <em>Spotify</em></>,
    triggerApp: "Spotify",
    events: [
      {
        id: "e3", time: "09:15:04", sev: "warn", app: "Spotify", category: "Réseau sortant",
        text: <>Spotify a immédiatement contacté <strong>4 serveurs de tracking publicitaire</strong> avant même de jouer la moindre note. Aucun de ces serveurs n'est nécessaire au fonctionnement de l'application.</>,
        detail: {
          type: "tracking",
          process: "Spotify.exe",
          pid: 4128,
          hosts: [
            { domain: "adeventtracker.spotify.com", country: "US", tag: "Tracking",    sev: "warn" },
            { domain: "pixel.spotify.com",          country: "US", tag: "Tracking",    sev: "warn" },
            { domain: "doubleclick.net",             country: "US", tag: "Data broker", sev: "bad"  },
            { domain: "app-analytics.spotify.com",  country: "IE", tag: "Analytics",   sev: "warn" },
          ],
          volume: "142 KB",
          action: "Lancement de l'application",
        },
      },
      {
        id: "e4", time: "09:15:08", sev: "ok", app: "Spotify", category: "Réseau sortant",
        text: <>Connexion légitime au CDN audio de Spotify pour streamer la musique. <code>spclient.spotify.com</code></>,
        detail: { type: "normal" },
      },
    ],
  },
  {
    id: "s3",
    time: "10:30",
    trigger: <>Tu as cliqué sur un lien dans la <em>newsletter The Verge</em></>,
    triggerApp: "Firefox",
    events: [
      {
        id: "e5", time: "10:30:01", sev: "warn", app: "Firefox", category: "Réseau sortant",
        text: <>Tu n'as visité qu'<strong>un seul site</strong>, mais ton navigateur a contacté <strong>7 serveurs différents</strong> dont <strong>2 data brokers</strong> qui agrègent ton profil publicitaire.</>,
        detail: {
          type: "trackers",
          process: "firefox.exe",
          pid: 2056,
          hosts: [
            { domain: "theverge.com",           country: "US", tag: "Origin",     sev: "ok"   },
            { domain: "google-analytics.com",   country: "US", tag: "Analytics",  sev: "warn" },
            { domain: "doubleclick.net",         country: "US", tag: "Data broker",sev: "bad"  },
            { domain: "criteo.com",              country: "FR", tag: "Data broker",sev: "bad"  },
            { domain: "facebook.net",            country: "US", tag: "Tracking",   sev: "warn" },
            { domain: "amazon-adsystem.com",     country: "US", tag: "Tracking",   sev: "warn" },
            { domain: "cdn.cloudflare.com",      country: "US", tag: "CDN",        sev: "ok"   },
          ],
          volume: "2.3 MB",
          action: "Clic sur lien newsletter",
        },
      },
    ],
  },
  {
    id: "s4",
    time: "14:22",
    trigger: <>Tu as ouvert <em>une pièce jointe</em> (facture-2026-04.pdf.exe)</>,
    triggerApp: "Outlook",
    sevHint: "menace",
    events: [
      {
        id: "e6", time: "14:22:00", sev: "bad", app: "inconnu.exe", category: "Système",
        intercepted: true,
        text: <><strong>Action interceptée.</strong> Le fichier prétendait être un PDF mais c'est un exécutable. Il a tenté de chiffrer le dossier <code>Documents</code> dans la seconde qui a suivi son ouverture.</>,
        detail: {
          type: "ransomware",
          process: "invoice_2026.exe",
          pid: 6788,
          parent: "OUTLOOK.EXE",
          action: "Ouverture de pièce jointe email",
          behavior: [
            "Tentative de chiffrement massive de fichiers .docx, .xlsx, .pdf",
            "Connexion à un serveur de commande inconnu (193.142.x.x, Russie)",
            "Suppression des points de restauration Windows",
            "Création d'une tâche planifiée auto-démarrante",
          ],
          hosts: [
            { domain: "193.142.30.166", country: "RU", tag: "C2 connu", sev: "bad" },
          ],
          volume: "0 (bloqué avant exfiltration)",
        },
      },
    ],
  },
  {
    id: "s5",
    time: "15:48",
    trigger: <>Tu as ouvert <em>Slack</em></>,
    triggerApp: "Slack",
    events: [
      {
        id: "e7", time: "15:48:12", sev: "ok", app: "Slack", category: "Réseau sortant",
        text: <>Connexion normale aux serveurs Slack. <code>edge-chat.slack.com</code>, <code>files.slack.com</code>. Tout est attendu.</>,
        detail: { type: "normal" },
      },
      {
        id: "e8", time: "15:52:04", sev: "warn", app: "Slack", category: "Système",
        text: <>Slack a demandé la permission d'accéder au <strong>micro</strong>. Une réunion a démarré, donc la demande est logique — mais elle est notée.</>,
        detail: { type: "permission", resource: "microphone" },
      },
    ],
  },
  {
    id: "s6",
    time: "22:47",
    trigger: <>Tu as ouvert <em>Spotify</em></>,
    triggerApp: "Spotify",
    events: [
      {
        id: "e9", time: "22:47:01", sev: "warn", app: "Spotify", category: "Réseau sortant",
        text: <>Encore une fois, Spotify a contacté <strong>4 serveurs publicitaires</strong> avant même de lancer la lecture. C'est devenu le pattern le plus régulier de ta journée.</>,
        detail: { type: "repeat", count: 14, period: "cette semaine" },
      },
    ],
  },
];

// ─── Flux temps réel ──────────────────────────────────────────────────────

export const FEED_ROWS: FeedRow[] = [
  { t: "22:47:04", h: "pixel.spotify.com",                   v: "12 KB",  sev: "warn" },
  { t: "22:47:03", h: "doubleclick.net",                     v: "8 KB",   sev: "bad"  },
  { t: "22:47:03", h: "adeventtracker.spotify.com",          v: "4 KB",   sev: "warn" },
  { t: "22:47:01", h: "app-analytics.spotify.com",           v: "6 KB",   sev: "warn" },
  { t: "22:46:58", h: "spclient.spotify.com",                v: "1.2 MB", sev: "ok"   },
  { t: "22:46:55", h: "audio-fa.scdn.co",                    v: "4.8 MB", sev: "ok"   },
  { t: "22:46:42", h: "time.windows.com",                    v: "0.5 KB", sev: "ok"   },
  { t: "22:46:18", h: "firefox.settings.services.mozilla.com", v: "2 KB", sev: "warn" },
];

// ─── Historique ───────────────────────────────────────────────────────────

export const HISTORY_ROWS: HistoryRow[] = [
  { t: "22:47", date: "Aujourd'hui", app: "Spotify",     ev: "4 trackers publicitaires contactés au lancement", sev: "warn" },
  { t: "15:52", date: "Aujourd'hui", app: "Slack",       ev: "Permission micro accordée",                        sev: "ok"   },
  { t: "15:48", date: "Aujourd'hui", app: "Slack",       ev: "Connexion réseau normale",                         sev: "ok"   },
  { t: "14:22", date: "Aujourd'hui", app: "inconnu.exe", ev: "Tentative de ransomware bloquée",                  sev: "bad"  },
  { t: "10:30", date: "Aujourd'hui", app: "Firefox",     ev: "Newsletter The Verge — 7 serveurs, 2 data brokers",sev: "warn" },
  { t: "09:15", date: "Aujourd'hui", app: "Spotify",     ev: "4 trackers publicitaires contactés au lancement",  sev: "warn" },
  { t: "08:42", date: "Aujourd'hui", app: "Windows Update", ev: "Vérification mises à jour (8 serveurs MS)",    sev: "ok"   },
  { t: "23:18", date: "Hier",        app: "Discord",     ev: "3 connexions analytics au démarrage",              sev: "warn" },
  { t: "21:04", date: "Hier",        app: "Steam",       ev: "Connexion serveurs Steam normale",                 sev: "ok"   },
  { t: "19:55", date: "Hier",        app: "Chrome",      ev: "youtube.com — 11 serveurs publicitaires",          sev: "warn" },
  { t: "14:38", date: "Hier",        app: "Notion",      ev: "Sync normale",                                     sev: "ok"   },
  { t: "11:02", date: "Hier",        app: "Adobe Acrobat", ev: "Télémétrie Adobe (4 endpoints)",                 sev: "warn" },
  { t: "03:14", date: "2 jours",     app: "Windows",     ev: "Mise à jour signée installée (v25H2)",             sev: "ok"   },
];

// ─── Processus actifs ─────────────────────────────────────────────────────

export const PROCESSES: ProcessInfo[] = [
  { name: "firefox.exe",       pid: 2056, cpu: "4.2%",  net: "↑ 12 KB/s",  flag: "warn" },
  { name: "Spotify.exe",       pid: 4128, cpu: "1.8%",  net: "↑ 4.8 MB/s", flag: "warn" },
  { name: "slack.exe",         pid: 5012, cpu: "0.9%",  net: "↑ 0.1 KB/s", flag: "ok"   },
  { name: "OUTLOOK.EXE",       pid: 3344, cpu: "0.4%",  net: "↑ 0.0 KB/s", flag: "ok"   },
  { name: "Code.exe",          pid: 7790, cpu: "2.1%",  net: "↑ 0.0 KB/s", flag: "ok"   },
  { name: "svchost.exe (×24)", pid: null, cpu: "0.8%",  net: "↑ 0.2 KB/s", flag: "ok"   },
  { name: "roeh-core.exe",     pid: 880,  cpu: "0.1%",  net: "— local —",   flag: "self" },
];

// ─── Permissions ──────────────────────────────────────────────────────────

export const PERM_MATRIX: AppPermissions[] = [
  { name: "Slack",    perms: { mic: "active", cam: "idle",   loc: "no", file: "workspace", notif: "yes" }, last: "maintenant"   },
  { name: "Discord",  perms: { mic: "active", cam: "active", loc: "no", file: "no",        notif: "yes" }, last: "maintenant"   },
  { name: "Firefox",  perms: { mic: "ask",    cam: "ask",    loc: "ask",file: "limited",   notif: "site"}, last: "au cas par cas"},
  { name: "Spotify",  perms: { mic: "no",     cam: "no",     loc: "no", file: "no",        notif: "yes" }, last: "permanent"    },
  { name: "OneDrive", perms: { mic: "no",     cam: "no",     loc: "no", file: "full",      notif: "no"  }, last: "sync continue"},
  { name: "Outlook",  perms: { mic: "idle",   cam: "idle",   loc: "no", file: "inbox",     notif: "yes" }, last: "inactif"      },
  { name: "Code",     perms: { mic: "no",     cam: "no",     loc: "no", file: "project",   notif: "no"  }, last: "inactif"      },
];

// ─── Process scoring (expert mode) ───────────────────────────────────────

export const PROCESS_SCORES: ProcessScore[] = [
  { name: "invoice_2026.exe",  pid: 6788, parent: "OUTLOOK.EXE",  flux: 1,   suspect: 1, score: 96, status: "blocked", note: "Ransomware C2 — Russie"      },
  { name: "Spotify.exe",       pid: 4128, parent: "explorer.exe", flux: 18,  suspect: 4, score: 54, status: "watch",   note: "4 trackers persistants"       },
  { name: "firefox.exe",       pid: 2056, parent: "explorer.exe", flux: 142, suspect: 7, score: 38, status: "watch",   note: "Data brokers (newsletter)"    },
  { name: "Adobe GC.exe",      pid: 3902, parent: "services.exe", flux: 6,   suspect: 2, score: 28, status: "watch",   note: "Télémétrie en hausse"         },
  { name: "slack.exe",         pid: 5012, parent: "explorer.exe", flux: 22,  suspect: 0, score: 8,  status: "ok",      note: "Trafic attendu"               },
  { name: "OneDrive.exe",      pid: 1820, parent: "explorer.exe", flux: 14,  suspect: 0, score: 6,  status: "ok",      note: "Sync utilisateur"             },
  { name: "svchost.exe (×24)", pid: null, parent: "services.exe", flux: 38,  suspect: 1, score: 14, status: "ok",      note: "Services Windows"             },
];

// ─── Map markers (expert mode) ────────────────────────────────────────────

export const MAP_MARKERS: MapMarker[] = [
  { id: "m1", lat: 38.9,   lng: -77.0,   country: "US-E", host: "doubleclick.net",            tag: "Data broker", volume: "8 KB",   sev: "bad"  },
  { id: "m2", lat: 37.4,   lng: -122.1,  country: "US-W", host: "pixel.spotify.com",          tag: "Tracking",    volume: "12 KB",  sev: "warn" },
  { id: "m3", lat: 48.85,  lng: 2.35,    country: "FR",   host: "criteo.com",                 tag: "Data broker", volume: "6 KB",   sev: "bad"  },
  { id: "m4", lat: 53.35,  lng: -6.26,   country: "IE",   host: "app-analytics.spotify.com",  tag: "Analytics",   volume: "6 KB",   sev: "warn" },
  { id: "m5", lat: 55.75,  lng: 37.62,   country: "RU",   host: "193.142.30.166",             tag: "C2 connu",    volume: "0 KB",   sev: "bad"  },
  { id: "m6", lat: 31.23,  lng: 121.47,  country: "CN",   host: "mirror.aliyun.com",          tag: "CDN",         volume: "2 KB",   sev: "ok"   },
  { id: "m7", lat: -23.55, lng: -46.63,  country: "BR",   host: "cdn.cloudflare.com",         tag: "CDN",         volume: "142 KB", sev: "ok"   },
  { id: "m8", lat: 1.35,   lng: 103.82,  country: "SG",   host: "cdn.fastly.net",             tag: "CDN",         volume: "88 KB",  sev: "ok"   },
];

// ─── Causal graph (expert mode) ──────────────────────────────────────────

export const CAUSAL_NODES: CausalNode[] = [
  { id: "a1", col: 0, y: 70,  type: "action",  label: "Clic newsletter",      sub: "10:30:00", sev: "ok"   },
  { id: "a2", col: 0, y: 200, type: "action",  label: "Ouverture Spotify",    sub: "22:47:00", sev: "ok"   },
  { id: "a3", col: 0, y: 360, type: "action",  label: "Pièce jointe Outlook", sub: "14:22:00", sev: "bad"  },
  { id: "p1", col: 1, y: 80,  type: "process", label: "firefox.exe",          sub: "PID 2056", sev: "warn" },
  { id: "p2", col: 1, y: 220, type: "process", label: "Spotify.exe",          sub: "PID 4128", sev: "warn" },
  { id: "p3", col: 1, y: 370, type: "process", label: "invoice_2026.exe",     sub: "PID 6788", sev: "bad"  },
  { id: "f1", col: 2, y: 30,  type: "flow",    label: "theverge.com",         sub: "US · origin",      sev: "ok"   },
  { id: "f2", col: 2, y: 80,  type: "flow",    label: "doubleclick.net",      sub: "US · data broker", sev: "bad"  },
  { id: "f3", col: 2, y: 130, type: "flow",    label: "criteo.com",           sub: "FR · data broker", sev: "bad"  },
  { id: "f4", col: 2, y: 180, type: "flow",    label: "pixel.spotify.com",    sub: "US · tracking",    sev: "warn" },
  { id: "f5", col: 2, y: 230, type: "flow",    label: "adeventtracker…",      sub: "US · tracking",    sev: "warn" },
  { id: "f6", col: 2, y: 280, type: "flow",    label: "audio-fa.scdn.co",     sub: "US · CDN audio",   sev: "ok"   },
  { id: "f7", col: 2, y: 370, type: "flow",    label: "193.142.30.166",       sub: "RU · C2 connu",    sev: "bad"  },
  { id: "f8", col: 2, y: 420, type: "flow",    label: "fichiers locaux",      sub: "tentative chiffrement", sev: "bad" },
];

export const CAUSAL_EDGES: CausalEdge[] = [
  { from: "a1", to: "p1" },
  { from: "p1", to: "f1" },
  { from: "p1", to: "f2", sev: "bad"  },
  { from: "p1", to: "f3", sev: "bad"  },
  { from: "a2", to: "p2" },
  { from: "p2", to: "f4", sev: "warn" },
  { from: "p2", to: "f5", sev: "warn" },
  { from: "p2", to: "f6" },
  { from: "a3", to: "p3", sev: "bad"  },
  { from: "p3", to: "f7", sev: "bad"  },
  { from: "p3", to: "f8", sev: "bad"  },
];
