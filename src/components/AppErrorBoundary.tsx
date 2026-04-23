import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw, RefreshCw } from "lucide-react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  message?: string;
  stack?: string;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message, stack: error?.stack };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
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
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
          <div className="w-full max-w-lg rounded-sm border border-border bg-card p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-sm border border-border bg-muted">
              <AlertTriangle className="h-5 w-5 text-primary" />
            </div>
            <h1 className="mt-5 font-display text-2xl">Não foi possível abrir o painel</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Algo travou ao montar a tela. Tente recarregar antes de reiniciar a sessão (reiniciar desloga).
            </p>
            {this.state.message && (
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