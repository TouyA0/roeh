import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { Theme } from "@/types";

// ─── Icônes thème ─────────────────────────────────────────────────────────

const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);
const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);
const SystemIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none" />
  </svg>
);
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="m5 13 4 4L19 7" />
  </svg>
);

// ─── Theme picker ─────────────────────────────────────────────────────────

const THEME_OPTS: { id: Theme; label: string; icon: React.ReactNode }[] = [
  { id: "light",  label: "Clair",   icon: <SunIcon /> },
  { id: "dark",   label: "Sombre",  icon: <MoonIcon /> },
  { id: "system", label: "Système", icon: <SystemIcon /> },
];

function ThemePicker({ value, onChange }: { value: Theme; onChange: (t: Theme) => void }) {
  return (
    <div className="theme-picker">
      {THEME_OPTS.map((o) => (
        <button key={o.id} className={`theme-opt ${value === o.id ? "active" : ""}`} onClick={() => onChange(o.id)}>
          <div className={`theme-preview theme-preview-${o.id}`}>
            <span className="theme-preview-bar" />
            <span className="theme-preview-bar short" />
            <span className="theme-preview-bar shorter" />
          </div>
          <div className="theme-opt-label">
            {o.icon}
            <span>{o.label}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Name editor ──────────────────────────────────────────────────────────

function NameEditor({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);
  const inputRef              = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.select();
  }, [editing]);

  const commit = () => { if (draft.trim()) onSave(draft.trim()); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };

  return (
    <div className="setting-line">
      <div>
        <div className="setting-line-label">Prénom</div>
        {editing ? (
          <input
            ref={inputRef}
            className="inline-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel(); }}
            autoFocus
          />
        ) : (
          <div className="setting-line-value">{value || <span style={{ color: "var(--muted)" }}>—</span>}</div>
        )}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {editing ? (
          <>
            <button className="btn btn-ghost btn-sm" onClick={cancel}>Annuler</button>
            <button className="btn btn-primary btn-sm" onClick={commit}>OK</button>
          </>
        ) : (
          <button className="btn btn-sm" onClick={() => setEditing(true)}>Modifier</button>
        )}
      </div>
    </div>
  );
}

// ─── PIN changer ──────────────────────────────────────────────────────────

function PinChanger({ currentPin, onSave }: { currentPin: string; onSave: (pin: string) => void }) {
  const [step, setStep]       = useState(0); // 0=idle 1=current 2=new 3=confirm 4=success
  const [current, setCurrent] = useState("");
  const [neu, setNeu]         = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError]     = useState<string | null>(null);
  const inputRef              = useRef<HTMLInputElement>(null);

  useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, [step]);

  const reset = () => { setStep(0); setCurrent(""); setNeu(""); setConfirm(""); setError(null); };

  const submitCurrent = () => {
    if (current === currentPin) { setError(null); setStep(2); }
    else setError("PIN incorrect. Réessaie.");
  };
  const submitNew = () => {
    if (neu.length === 4) { setError(null); setStep(3); }
    else setError("Le PIN doit faire 4 chiffres.");
  };
  const submitConfirm = () => {
    if (confirm === neu) { onSave(neu); setStep(4); setTimeout(reset, 2400); }
    else setError("Les deux PIN ne correspondent pas.");
  };

  if (step === 0) {
    return (
      <div className="setting-line">
        <div>
          <div className="setting-line-label">PIN de déverrouillage</div>
          <div className="setting-line-value">••••</div>
        </div>
        <button className="btn btn-sm" onClick={() => setStep(1)}>Modifier le PIN</button>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="pin-success">
        <CheckIcon />
        <span>PIN modifié. Tout est mis à jour localement.</span>
      </div>
    );
  }

  const steps = [
    null,
    { title: "PIN actuel",            sub: "Confirme ton PIN pour autoriser le changement.", val: current, set: setCurrent, go: submitCurrent },
    { title: "Nouveau PIN",           sub: "Choisis 4 chiffres faciles à retenir, durs à deviner.", val: neu, set: setNeu, go: submitNew },
    { title: "Confirme le nouveau PIN", sub: "Encore une fois, pour être sûr.", val: confirm, set: setConfirm, go: submitConfirm },
  ];
  const cur = steps[step]!;

  return (
    <div className="pin-form">
      <div className="pin-steps">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`pin-step-dot ${step >= i ? "done" : ""} ${step === i ? "current" : ""}`}>
            <span>{i}</span>
          </div>
        ))}
      </div>
      <div className="pin-form-body">
        <div className="setting-line-label">{cur.title}</div>
        <div className="pin-form-sub">{cur.sub}</div>
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          maxLength={4}
          className={`inline-input pin-input ${error ? "error" : ""}`}
          value={cur.val}
          onChange={(e) => { cur.set(e.target.value.replace(/\D/g, "").slice(0, 4)); setError(null); }}
          onKeyDown={(e) => { if (e.key === "Enter") cur.go(); }}
          placeholder="••••"
        />
        {error && <div className="pin-error">{error}</div>}
      </div>
      <div className="pin-form-actions">
        <button className="btn btn-ghost btn-sm" onClick={reset}>Annuler</button>
        <button className="btn btn-primary btn-sm" onClick={cur.go}>
          {step === 3 ? "Enregistrer" : "Continuer"}
        </button>
      </div>
    </div>
  );
}

// ─── Écran paramètres ─────────────────────────────────────────────────────

export function SettingsScreen() {
  const settings       = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const [confirmReset, setConfirmReset] = useState(false);

  const { protect, narrativeDefault, collective, sensitivity, name, theme } = settings;

  const sensLabel =
    sensitivity < 25 ? "Discret" :
    sensitivity < 55 ? "Équilibré" :
    sensitivity < 85 ? "Vigilant" :
                       "Très vigilant";

  const themeDesc =
    theme === "system" ? "Système suit les préférences de Windows." :
    theme === "dark"   ? "Sombre — confort de nuit." :
                         "Clair — par défaut.";

  return (
    <>
      <div className="screen-head">
        <h1>Paramètres</h1>
        <p>Tout est local. Aucune information ne quitte cette machine — sauf si tu actives le partage collectif anonyme.</p>
      </div>

      <div className="settings-grid">

        {/* ── Colonne gauche ── */}
        <div className="settings-col">

          <section>
            <div className="settings-section-label">Protection</div>
            <div className={`toggle accent`}>
              <div className="toggle-info">
                <div className="name">Protection active</div>
                <div className="desc">Ro'eh intercepte les actions dangereuses avant qu'elles ne se produisent. Sans ça, il ne fait qu'observer.</div>
              </div>
              <button className={`switch ${protect ? "on" : ""}`} onClick={() => updateSettings({ protect: !protect })} />
            </div>
            <div className="slider-row">
              <div className="top">
                <span className="name">Sensibilité</span>
                <span className="value">{sensLabel}</span>
              </div>
              <div className="desc">Plus tu es vigilant, plus Ro'eh signalera des choses subtiles — mais avec plus de bruit.</div>
              <input
                type="range" min={0} max={100} value={sensitivity}
                onChange={(e) => updateSettings({ sensitivity: Number(e.target.value) })}
              />
              <div className="slider-marks">
                <span>Discret</span><span>Équilibré</span><span>Vigilant</span><span>+++</span>
              </div>
            </div>
          </section>

          <section>
            <div className="settings-section-label">Affichage</div>
            <div className="toggle">
              <div className="toggle-info">
                <div className="name">Mode narratif par défaut</div>
                <div className="desc">L'écran principal s'ouvre en mode narratif. Tu peux basculer en Expert à tout moment.</div>
              </div>
              <button className={`switch ${narrativeDefault ? "on" : ""}`} onClick={() => updateSettings({ narrativeDefault: !narrativeDefault })} />
            </div>
            <div className="setting-card">
              <div className="setting-card-head">
                <div style={{ fontSize: 14, color: "var(--ink)", marginBottom: 2 }}>Thème</div>
                <div className="desc-soft">{themeDesc}</div>
              </div>
              <ThemePicker value={theme ?? "system"} onChange={(t) => updateSettings({ theme: t })} />
            </div>
          </section>

          <section>
            <div className="settings-section-label">Vie privée & partage</div>
            <div className="toggle">
              <div className="toggle-info">
                <div className="name">Partage collectif anonyme</div>
                <div className="desc">Quand un pattern suspect est détecté, sa signature anonymisée est partagée avec la communauté Ro'eh. Aucune donnée personnelle, jamais.</div>
              </div>
              <button className={`switch ${collective ? "on" : ""}`} onClick={() => updateSettings({ collective: !collective })} />
            </div>
          </section>

        </div>

        {/* ── Colonne droite ── */}
        <div className="settings-col">

          <section>
            <div className="settings-section-label">Identité locale</div>
            <div className="setting-card">
              <NameEditor value={name} onSave={(v) => updateSettings({ name: v })} />
              <div className="setting-divider" />
              <PinChanger currentPin={settings.pin} onSave={(pin) => updateSettings({ pin })} />
              <div className="setting-divider" />
              <div className="local-pill">
                <CheckIcon />
                <span>Aucun compte cloud · 100 % local</span>
              </div>
            </div>
          </section>

          <section>
            <div className="settings-section-label">À propos</div>
            <div className="setting-card">
              <div className="about-row"><span>Version</span><span className="mono">1.4.2 (signée)</span></div>
              <div className="about-row"><span>Canal</span><span className="mono">stable</span></div>
              <div className="about-row"><span>Licence</span><span className="mono">AGPL-3.0</span></div>
              <div className="about-row"><span>Dernière MAJ</span><span className="mono" style={{ color: "var(--serene)" }}>il y a 6 jours</span></div>
              <div className="about-actions">
                <button className="btn btn-sm"
                  onClick={() => openUrl("https://github.com/TouyA0/roeh")}>
                  Code source
                </button>
                <button className="btn btn-sm">Documentation</button>
              </div>
            </div>
          </section>

          <section>
            <div className="settings-section-label">Zone de danger</div>
            <div className="danger-card">
              <div className="danger-text">
                Réinitialiser efface toutes les données locales : historique, règles, paramètres. L'opération est <strong>irréversible</strong>.
              </div>
              {confirmReset ? (
                <div className="danger-confirm">
                  <span className="danger-confirm-q">Tu confirmes ? Rien ne sera récupérable.</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-sm" onClick={() => setConfirmReset(false)}>Non, annuler</button>
                    <button className="btn btn-danger btn-sm" onClick={() => setConfirmReset(false)}>Oui, effacer tout</button>
                  </div>
                </div>
              ) : (
                <button className="btn-danger-soft btn-sm btn" onClick={() => setConfirmReset(true)}>
                  Réinitialiser Ro'eh…
                </button>
              )}
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
