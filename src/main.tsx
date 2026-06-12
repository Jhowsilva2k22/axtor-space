import * as Sentry from "@sentry/react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { installGlobalErrorHandlers } from "@/lib/errorLogger";

const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0,
  });
}

installGlobalErrorHandlers();

const rootEl = document.getElementById("root")!;
const app = (
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

// Rotas pre-renderizadas (/vendas, /planos) chegam com HTML pronto: hidrata.
// As demais rotas chegam com o shell vazio: cria do zero como antes.
if (rootEl.hasChildNodes()) {
  hydrateRoot(rootEl, app);
} else {
  createRoot(rootEl).render(app);
}
