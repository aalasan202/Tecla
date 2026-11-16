import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { preloadPiano } from "./audio/piano";
import "./styles.css";

preloadPiano();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
