import { useState, FormEvent } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Lock, Loader2, RotateCcw } from "lucide-react";
import { ThemeToggle, useAdminLockedTheme } from "@/components/ThemeToggle";

const AdminLogin = () => {
  const { user, isAdmin, loading, signIn } = useAuth();
  useAdminLockedTheme();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);

  const resetSession = async () => {
    setResetting(true);
    try {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignora — vamos limpar tudo manualmente
      }
      try {
        Object.keys(localStorage)
          .filter((k) => k.startsWith("sb-") || k.startsWith("supabase.") || k.startsWith("admin-tenant-id") || k.startsWith("tenant-cache-v1:"))
          .forEach((k) => localStorage.removeItem(k));
        Object.keys(sessionStorage)
          .filter((k) => k.startsWith("sb-") || k.startsWith("supabase.") || k.startsWith("admin-tenant-id") || k.startsWith("tenant-cache-v1:"))
          .forEach((k) => sessionStorage.removeItem(k));
      } catch {
        // noop
      }
      toast.success("Sessão limpa — recarregando");
      setTimeout(() => window.location.reload(), 400);
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center grain">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  // Qualquer usuário logado (admin ou tenant owner) vai pro painel.
  if (user) return <Navigate to="/admin" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email.trim().toLowerCase(), password);
    setSubmitting(false);
    if (error) {
      toast.error("Credenciais inválidas");
      return;
    }
    toast.success("Bem-vindo");
    nav("/admin", { replace: true });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 grain">
      <div className="aurora-a" />
      <div className="aurora-b" />
      <ThemeToggle className="absolute right-5 top-5 z-20" />
      <form onSubmit={onSubmit} className="relative z-10 w-full max-w-sm rounded-sm border-gold-gradient bg-card/60 p-8 shadow-deep backdrop-blur">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-sm border border-gold bg-gradient-gold-soft">
          <Lock className="h-5 w-5 text-primary" />
        </div>
        <h1 className="mt-6 text-center font-display text-3xl">Acesso <span className="text-gold italic">restrito</span></h1>
        <p className="mt-2 text-center text-xs uppercase tracking-[0.25em] text-muted-foreground">painel administrativo</p>

        <div className="mt-8 space-y-4">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">Email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" required className="h-11 rounded-sm border-gold bg-input font-light" />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">Senha</label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" required className="h-11 rounded-sm border-gold bg-input font-light" />
          </div>
        </div>

        <Button type="submit" disabled={submitting} className="btn-luxe mt-6 h-12 w-full rounded-sm text-sm font-semibold uppercase tracking-[0.15em]">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
        </Button>
        <div className="mt-3 text-center">
          <Link to="/forgot-password" className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-primary">
            esqueci minha senha
          </Link>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          ainda não tem conta? <Link to="/signup" className="text-primary hover:underline">criar grátis</Link>
        </p>

        <div className="mt-6 border-t border-border/40 pt-4">
          <button
            type="button"
            onClick={resetSession}
            disabled={resetting}
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-sm border border-border/40 bg-background/30 px-3 text-[10px] uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:border-gold/40 hover:text-primary"
          >
            {resetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
            reiniciar sessão
          </button>
          <p className="mt-2 text-center text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60">
            limpa cookies locais se travar
          </p>
        </div>
      </form>
    </div>
  );
};

export default AdminLogin;