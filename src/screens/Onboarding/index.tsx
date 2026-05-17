import { useState, useRef } from "react";
import { useAppStore } from "@/store";
import type { AppSettings } from "@/types";

export function Onboarding() {
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const pinRef = useRef<HTMLInputElement>(null);
  const [protect, setProtect] = useState(true);
  const [narrative, setNarrative] = useState(true);
  const [collective, setCollective] = useState(true);
  const [sensitivity, setSensitivity] = useState(60);

  const sensLabel =
    sensitivity < 25 ? "Discret" :
    sensitivity < 55 ? "Équilibré" :
    sensitivity < 85 ? "Vigilant" :
                       "Très vigilant";

  const next = () => {
    if (step < 3) {
      setStep((s) => s + 1);
    } else {
      const settings: Pick<AppSettings, "name" | "pin"> & Partial<AppSettings> = {
        name,
        pin,
        protect,
        narrativeDefault: narrative,
        collective,
        sensitivity,
      };
      completeOnboarding(settings);
    }
  };

  const back = () => setStep((s) => s - 1);

  return (
    <div className="onb">
      {/* ── Left panel ── */}
      <div className="onb-left">
        <div>
          <div className="onb-mark">
            Ro<span className="apostrophe">'</span>eh
          </div>
          <div className="onb-tagline">
            Celui qui voit ce que les autres ne voient pas.
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 2 }}>
          {/* Progress dots */}
          <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{
                width: i === step ? 24 : 6,
                height: 6,
                borderRadius: 100,
                background: i <= step ? "var(--accent)" : "var(--border-strong)",
                transition: "all 0.3s",
              }} />
            ))}
          </div>
          <div className="onb-foot">Étape {step + 1} sur 4 · 100 % local</div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="onb-right">

        {/* Step 0 — Welcome */}
        {step === 0 && (
          <>
            <div>
              <div className="step-num">Bienvenue</div>
              <h2>Tout commence ici.</h2>
            </div>
            <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6, margin: 0 }}>
              Ro'eh est une sentinelle locale. Il surveille ce qui entre et — surtout — ce qui sort
              de ta machine, sans jamais envoyer la moindre information vers un serveur extérieur.
            </p>
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
              Avant de démarrer, on a besoin de trois choses : ton prénom, un PIN, et tes préférences.
              C'est tout. Pas d'email, pas de compte, pas de cloud.
            </p>
            <div style={{ marginTop: 20 }}>
              <button className="btn btn-primary btn-flex" style={{ width: "100%" }} onClick={next}>
                Commencer
              </button>
            </div>
          </>
        )}

        {/* Step 1 — Identity */}
        {step === 1 && (
          <>
            <div>
              <div className="step-num">Étape 1 — Identité</div>
              <h2>Comment t'appeler ?</h2>
            </div>
            <div className="input-group">
              <label>Prénom</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ton prénom"
                autoFocus
              />
            </div>
            <div className="input-group">
              <label>PIN à 4 chiffres</label>
              <div
                className="pin-dots"
                onClick={() => pinRef.current?.focus()}
              >
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`pin-dot${pin.length > i ? " filled" : ""}${pin.length === i ? " active" : ""}`}
                  />
                ))}
                <input
                  ref={pinRef}
                  type="tel"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  style={{
                    position: "absolute",
                    opacity: 0,
                    width: "1px",
                    height: "1px",
                    pointerEvents: "none",
                  }}
                />
              </div>
            </div>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
              Ce PIN reste sur ta machine. On ne pourra jamais le récupérer pour toi — c'est par construction.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button className="btn btn-flex" onClick={back}>Retour</button>
              <button className="btn btn-primary btn-flex" onClick={next} disabled={!name || pin.length < 4}>
                Continuer
              </button>
            </div>
          </>
        )}

        {/* Step 2 — Settings */}
        {step === 2 && (
          <>
            <div>
              <div className="step-num">Étape 2 — Comment je travaille</div>
              <h2>Trois choix qui font tout.</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="toggle">
                <div className="toggle-info">
                  <div className="name" style={{ fontSize: 13 }}>Protection active</div>
                  <div className="desc" style={{ fontSize: 11.5 }}>J'intercepte avant les actions dangereuses.</div>
                </div>
                <button className={`switch ${protect ? "on" : ""}`} onClick={() => setProtect(!protect)} />
              </div>
              <div className="toggle">
                <div className="toggle-info">
                  <div className="name" style={{ fontSize: 13 }}>Mode narratif</div>
                  <div className="desc" style={{ fontSize: 11.5 }}>J'explique en français, pas en logs.</div>
                </div>
                <button className={`switch ${narrative ? "on" : ""}`} onClick={() => setNarrative(!narrative)} />
              </div>
              <div className="toggle">
                <div className="toggle-info">
                  <div className="name" style={{ fontSize: 13 }}>Partage collectif anonyme</div>
                  <div className="desc" style={{ fontSize: 11.5 }}>Signatures anonymes, jamais tes données.</div>
                </div>
                <button className={`switch ${collective ? "on" : ""}`} onClick={() => setCollective(!collective)} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-flex" onClick={back}>Retour</button>
              <button className="btn btn-primary btn-flex" onClick={next}>Continuer</button>
            </div>
          </>
        )}

        {/* Step 3 — Sensitivity */}
        {step === 3 && (
          <>
            <div>
              <div className="step-num">Étape 3 — Ta sensibilité</div>
              <h2>À quel point dois-je te déranger ?</h2>
            </div>
            <div className="slider-row" style={{ background: "transparent", border: "none", padding: 0 }}>
              <div className="top">
                <span className="name" style={{ fontSize: 13 }}>Curseur unique</span>
                <span className="value">{sensLabel}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={sensitivity}
                onChange={(e) => setSensitivity(Number(e.target.value))}
              />
              <div className="slider-marks">
                <span>Discret</span>
                <span>Équilibré</span>
                <span>Vigilant</span>
                <span>+++</span>
              </div>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
              Tu pourras changer ça à tout moment dans les paramètres. Discret est très bien pour débuter.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-flex" onClick={back}>Retour</button>
              <button className="btn btn-primary btn-flex" onClick={next}>Activer Ro'eh</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
