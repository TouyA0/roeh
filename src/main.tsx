import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// ─── Fonts ────────────────────────────────────────────────────────────────

import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";

// ─── Styles ───────────────────────────────────────────────────────────────

import "./styles/globals.css";

// ─── App ──────────────────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
