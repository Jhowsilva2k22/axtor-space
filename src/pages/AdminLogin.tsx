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
  if (user) return <Navigate to="/painel" replace />;

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
    nav("/painel", { replace: true });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 grain overflow-x-hidden">
      <div className="aurora-a" />
      <div className="aurora-b" />
      <ThemeToggle className="absolute right-5 top-5 z-20" />
      <form onSubmit={onSubmit} className="relative z-10 w-full max-w-sm rounded-[32px] border border-gold/20 bg-card/40 p-10 shadow-2xl backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/30 bg-gradient-gold-soft shadow-gold/20 shadow-lg">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <h1 className="mt-8 text-center font-display text-4xl">Acesso <span className="text-gold italic">restrito</span></h1>
        <p className="mt-3 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">painel administrativo</p>

        <div className="mt-10 space-y-5">
          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/80">Email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" required className="h-12 rounded-full border-gold/20 bg-card/30 px-5 font-light transition-all focus:border-gold/50 focus:shadow-gold/10" placeholder="voce@exemplo.com" />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/80">Senha</label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" required className="h-12 rounded-full border-gold/20 bg-card/30 px-5 font-light transition-all focus:border-gold/50 focus:shadow-gold/10" placeholder="••••••••" />
          </div>
        </div>

        <Button type="submit" disabled={submitting} className="btn-luxe mt-10 h-14 w-full rounded-full text-xs font-bold uppercase tracking-[0.2em] shadow-lg shadow-gold/10">
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Entrar"}
        </Button>

        <div className="mt-6 text-center">
          <Link to="/forgot-password" title="Esqueci minha senha" className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 hover:text-gold transition-colors">
            esqueci minha senha
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Ainda não tem conta? <Link to="/signup" className="font-bold text-gold hover:underline">Criar grátis</Link>
        </p>

        <div className="mt-8 border-t border-gold/10 pt-6">
          <button
            type="button"
            onClick={resetSession}
            disabled={resetting}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-white/5 bg-white/5 px-5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 transition-all hover:bg-white/10 hover:text-foreground"
          >
            {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            reiniciar sessão
          </button>
          <p className="mt-3 text-center text-[9px] uppercase tracking-[0.2em] text-muted-foreground/40">
            limpa cookies locais se travar
          </p>
        </div>
      </form>
    </div>
  );
};

export default AdminLogin;
