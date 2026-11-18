import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { preloadPiano } from "./audio/piano";
import { registerServiceWorker } from "./pwa/sw";
import { initInstall } from "./pwa/install";
import "./styles.css";

preloadPiano();
// antes de montar React: Chrome puede ofrecer la instalación antes de que exista Ajustes
initInstall();
registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
