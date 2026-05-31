import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw, RefreshCw } from "lucide-react";
import { logError } from "@/lib/errorLogger";

const CHUNK_RELOAD_KEY = "axtor:chunk-reload-at";
const CHUNK_RELOAD_COOLDOWN_MS = 10_000; // 10s — evita loop infinito

function isChunkLoadError(error: Error): boolean {
  const msg = error?.message ?? "";
  const name = (error as any)?.name ?? "";
  return (
    name === "ChunkLoadError" ||
    msg.includes("dynamically imported module") ||
    msg.includes("Loading chunk") ||
    msg.includes("Failed to fetch") ||
    msg.includes("Unable to preload CSS")
  );
}

function tryAutoReload(error: Error): boolean {
  if (!isChunkLoadError(error)) return false;
  try {
    const last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? "0");
    if (Date.now() - last < CHUNK_RELOAD_COOLDOWN_MS) return false; // já tentou recentemente
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
  } catch {
    // sessionStorage indisponível — segue sem loop guard
  }
  window.location.reload();
  return true;
}

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  isChunkError: boolean;
  message?: string;
  stack?: string;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, isChunkError: false };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      isChunkError: isChunkLoadError(error),
      message: error?.message,
      stack: error?.stack,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Chunk load error após novo deploy → recarrega automaticamente
    if (tryAutoReload(error)) return;

    console.error("[AppErrorBoundary] render crash", error, info);
    try {
      sessionStorage.setItem(
        "axtor:last-crash",
        JSON.stringify({
          at: new Date().toISOString(),
          message: error?.message,
          stack: error?.stack,
          componentStack: info?.componentStack,
          url: window.location.href,
        }),
      );
    } catch {
      // ignore
    }
    void logError({
      severity: "boundary",
      message: error?.message ?? "render crash",
      stack: error?.stack,
      componentStack: info?.componentStack ?? undefined,
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, message: undefined, stack: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    window.location.assign("/reset");
  };

  render() {
    if (this.state.hasError) {
      const { isChunkError } = this.state;
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
          <div className="w-full max-w-lg rounded-sm border border-border bg-card p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-sm border border-border bg-muted">
              <AlertTriangle className="h-5 w-5 text-primary" />
            </div>
            <h1 className="mt-5 font-display text-2xl">
              {isChunkError ? "Nova versão disponível" : "Não foi possível abrir o painel"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isChunkError
                ? "O app foi atualizado. Recarregando automaticamente…"
                : "Algo travou ao montar a tela. Tente recarregar antes de reiniciar a sessão (reiniciar desloga)."}
            </p>
            {this.state.message && !isChunkError && (
              <pre className="mt-4 max-h-40 overflow-auto rounded-sm border border-border bg-muted/40 p-3 text-left text-[11px] leading-snug text-muted-foreground">
                {this.state.message}
              </pre>
            )}
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-primary bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                <RefreshCw className="h-4 w-4" /> Tentar de novo
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-border px-4 text-sm text-foreground transition-colors hover:bg-muted"
              >
                <RotateCcw className="h-4 w-4" /> Recarregar página
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Reiniciar sessão (desloga)
              </button>
              <a
                href="/admin/login"
                className="inline-flex h-11 items-center justify-center rounded-sm border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Voltar ao login
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}