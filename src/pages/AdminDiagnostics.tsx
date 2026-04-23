import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Loader2, Trash2, Download, RefreshCw, ArrowLeft, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useAdminLockedTheme } from "@/components/ThemeToggle";
import { readLocalErrors, clearLocalErrors, type LoggedError } from "@/lib/errorLogger";
import { toast } from "sonner";

type RemoteError = {
  id: string;
  created_at: string;
  severity: string;
  message: string;
  stack: string | null;
  component_stack: string | null;
  route: string | null;
  user_agent: string | null;
  user_email: string | null;
};

const fmt = (iso: string) => new Date(iso).toLocaleString("pt-BR");

const sessionSnapshot = () => {
  const lsKeys: string[] = [];
  const ssKeys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) lsKeys.push(localStorage.key(i)!);
    for (let i = 0; i < sessionStorage.length; i++) ssKeys.push(sessionStorage.key(i)!);
  } catch {
    /* noop */
  }
  const lastCrash = (() => {
    try {
      const raw = sessionStorage.getItem("axtor:last-crash");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();
  return { lsKeys, ssKeys, lastCrash, userAgent: navigator.userAgent, route: window.location.href };
};

const AdminDiagnostics = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  useAdminLockedTheme();
  const [remote, setRemote] = useState<RemoteError[] | null>(null);
  const [local, setLocal] = useState<LoggedError[]>(readLocalErrors());
  const [loading, setLoading] = useState(true);
  const snapshot = useMemo(() => sessionSnapshot(), []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("client_error_log")
      .select("id,created_at,severity,message,stack,component_stack,route,user_agent,user_email")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) toast.error(error.message);
    setRemote((data as RemoteError[] | null) ?? []);
    setLocal(readLocalErrors());
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && user && isAdmin) void load();
  }, [authLoading, user, isAdmin]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <ShieldAlert className="h-7 w-7 text-primary" />
        <p className="font-display text-2xl">Acesso restrito</p>
        <p className="text-sm text-muted-foreground">Apenas administradores acessam o painel de diagnóstico.</p>
        <Link to="/admin" className="text-xs uppercase tracking-[0.2em] text-primary hover:underline">voltar</Link>
      </div>
    );
  }

  const exportJson = () => {
    const blob = new Blob(
      [JSON.stringify({ snapshot, remote, local }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `axtor-diagnostics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const wipeLocal = () => {
    clearLocalErrors();
    setLocal([]);
    toast.success("Buffer local limpo");
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">painel</p>
            <h1 className="font-display text-2xl">Diagnóstico</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin" className="inline-flex h-9 items-center gap-2 rounded-sm border border-border px-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-3.5 w-3.5" /> Admin
            </Link>
            <Button onClick={() => void load()} className="h-9 rounded-sm border border-border bg-card/40 px-3 text-[11px] uppercase tracking-[0.2em] text-primary hover:bg-card/60">
              <RefreshCw className="h-3.5 w-3.5" /> atualizar
            </Button>
            <Button onClick={exportJson} className="h-9 rounded-sm border border-border bg-card/40 px-3 text-[11px] uppercase tracking-[0.2em] text-primary hover:bg-card/60">
              <Download className="h-3.5 w-3.5" /> exportar JSON
            </Button>
          </div>
        </header>

        <section className="rounded-sm border border-border p-5">
          <h2 className="font-display text-lg">Estado da sessão atual</h2>
          <div className="mt-3 grid gap-3 text-xs md:grid-cols-2">
            <div className="rounded-sm border border-border bg-card/40 p-3">
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Usuário</p>
              <p className="mt-1">{user.email}</p>
              <p className="mt-1 text-muted-foreground">id: {user.id}</p>
              <p className="mt-1 text-muted-foreground">admin: {isAdmin ? "sim" : "não"}</p>
            </div>
            <div className="rounded-sm border border-border bg-card/40 p-3">
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">URL atual</p>
              <p className="mt-1 break-all">{snapshot.route}</p>
              <p className="mt-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">User agent</p>
              <p className="mt-1 break-all text-[11px] text-muted-foreground">{snapshot.userAgent}</p>
            </div>
            <div className="rounded-sm border border-border bg-card/40 p-3 md:col-span-2">
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Chaves locais (localStorage / sessionStorage)</p>
              <p className="mt-1 break-all text-[11px] text-muted-foreground">
                <strong className="text-foreground">local:</strong> {snapshot.lsKeys.length === 0 ? "(vazio)" : snapshot.lsKeys.join(", ")}
              </p>
              <p className="mt-1 break-all text-[11px] text-muted-foreground">
                <strong className="text-foreground">session:</strong> {snapshot.ssKeys.length === 0 ? "(vazio)" : snapshot.ssKeys.join(", ")}
              </p>
              {snapshot.lastCrash && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-[11px] uppercase tracking-[0.2em] text-amber-500">último crash registrado na sessão</summary>
                  <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap rounded-sm border border-border bg-muted/30 p-2 text-[11px] leading-snug text-muted-foreground">
{JSON.stringify(snapshot.lastCrash, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/reset" className="inline-flex h-9 items-center gap-2 rounded-sm border border-amber-500/60 px-3 text-[11px] uppercase tracking-[0.2em] text-amber-500 hover:bg-amber-500/10">
              ir pra /reset (limpa cookies)
            </Link>
            <button onClick={wipeLocal} className="inline-flex h-9 items-center gap-2 rounded-sm border border-border px-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" /> limpar buffer local
            </button>
          </div>
        </section>

        <section className="rounded-sm border border-border p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg">Crashes registrados (servidor)</h2>
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              {loading ? "carregando…" : `${remote?.length ?? 0} / 100`}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {(remote ?? []).map((r) => (
              <details key={r.id} className="rounded-sm border border-border bg-card/30 p-3 open:bg-card/60">
                <summary className="flex flex-wrap items-center justify-between gap-2 cursor-pointer">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-sm border px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] ${r.severity === "boundary" ? "border-destructive text-destructive" : r.severity === "promise" ? "border-amber-500 text-amber-500" : "border-border text-muted-foreground"}`}>
                      {r.severity}
                    </span>
                    <span className="text-xs">{r.message}</span>
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{fmt(r.created_at)}</span>
                </summary>
                <div className="mt-3 space-y-2 text-[11px] text-muted-foreground">
                  <p><strong className="text-foreground">rota:</strong> {r.route ?? "—"}</p>
                  <p><strong className="text-foreground">usuário:</strong> {r.user_email ?? "(anônimo)"}</p>
                  <p className="break-all"><strong className="text-foreground">UA:</strong> {r.user_agent ?? "—"}</p>
                  {r.stack && (
                    <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-sm border border-border bg-muted/30 p-2 leading-snug">{r.stack}</pre>
                  )}
                  {r.component_stack && (
                    <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-sm border border-border bg-muted/30 p-2 leading-snug">{r.component_stack}</pre>
                  )}
                </div>
              </details>
            ))}
            {!loading && (remote?.length ?? 0) === 0 && (
              <p className="text-xs text-muted-foreground">Nenhum crash registrado ainda. 🙂</p>
            )}
          </div>
        </section>

        <section className="rounded-sm border border-border p-5">
          <h2 className="font-display text-lg">Buffer local (este navegador)</h2>
          <p className="mt-1 text-[11px] text-muted-foreground">Mantido mesmo se o envio pro servidor falhar.</p>
          <div className="mt-3 space-y-2">
            {local.length === 0 && <p className="text-xs text-muted-foreground">Vazio.</p>}
            {local.slice().reverse().map((e, i) => (
              <details key={`${e.ts}-${i}`} className="rounded-sm border border-border bg-card/30 p-3 open:bg-card/60">
                <summary className="flex flex-wrap items-center justify-between gap-2 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <span className="rounded-sm border border-border px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{e.severity}</span>
                    <span className="text-xs">{e.message}</span>
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{fmt(e.ts)}</span>
                </summary>
                {e.stack && (
                  <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap rounded-sm border border-border bg-muted/30 p-2 text-[11px] leading-snug text-muted-foreground">{e.stack}</pre>
                )}
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDiagnostics;