import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[AppErrorBoundary] render crash", error, info);
  }

  private handleReset = () => {
    window.location.assign("/reset");
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
          <div className="w-full max-w-md rounded-sm border border-border bg-card p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-sm border border-border bg-muted">
              <AlertTriangle className="h-5 w-5 text-primary" />
            </div>
            <h1 className="mt-5 font-display text-2xl">Não foi possível abrir o painel</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              O navegador travou ao montar esta tela. Reinicie a sessão para carregar o painel limpo.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-primary bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                <RotateCcw className="h-4 w-4" /> Reiniciar sessão
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