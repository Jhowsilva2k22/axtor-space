import { useEffect, useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { KeyRound, Loader2, Eye, EyeOff } from "lucide-react";
import { useBrasilLockedTheme } from "@/components/ThemeToggle";
import { DottedSurface } from "@/components/landing/DottedSurface";
import { GlowPanel } from "@/components/landing/GlowPanel";
import { fieldLabel } from "@/lib/ui";
import { cn } from "@/lib/utils";

const ResetPassword = () => {
  useBrasilLockedTheme();
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Supabase trata o token de recovery automaticamente via hash da URL
    // e dispara PASSWORD_RECOVERY no onAuthStateChange.
    let unmounted = false;

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (unmounted) return;
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setValidSession(true);
        setReady(true);
      }
    });

    // Verifica se já existe sessão (caso a página tenha sido recarregada)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (unmounted) return;
      if (session) setValidSession(true);
      setReady(true);
    });

    return () => {
      unmounted = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("A senha precisa ter pelo menos 8 caracteres");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      toast.error(error.message || "Não foi possível atualizar a senha");
      return;
    }
    toast.success("Senha atualizada");
    nav("/painel", { replace: true });
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center grain">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 grain overflow-x-hidden">
      <div
        className="pointer-events-none fixed inset-0 -z-20"
        style={{ background: "radial-gradient(ellipse at top, hsl(223 68% 12%), hsl(223 68% 4%))" }}
      />
      <DottedSurface />

      <GlowPanel>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/30 bg-gradient-gold-soft shadow-gold/20 shadow-lg">
          <KeyRound className="h-6 w-6 text-primary" />
        </div>
        <h1 className="mt-8 text-center font-display text-4xl">
          Nova <span className="text-gold italic">senha</span>
        </h1>
        <p className="mt-3 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">
          escolha algo seguro
        </p>

        {!validSession ? (
          <div className="mt-8 space-y-4">
            <p className="rounded-sm border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              Link inválido ou expirado. Solicite um novo email de recuperação.
            </p>
            <Button
              type="button"
              onClick={() => nav("/forgot-password", { replace: true })}
              className="btn-luxe h-14 w-full rounded-full text-xs font-bold uppercase tracking-[0.2em] shadow-lg shadow-gold/10"
            >
              Pedir novo link
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label className={cn("mb-2", fieldLabel)}>
                Nova senha
              </label>
              <div className="relative">
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  className="h-12 rounded-full border-gold/20 bg-card/30 px-5 pr-12 font-light transition-all focus:border-gold/50 focus:shadow-gold/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-gold transition-colors"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className={cn("mb-2", fieldLabel)}>
                Confirmar senha
              </label>
              <div className="relative">
                <Input
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  className="h-12 rounded-full border-gold/20 bg-card/30 px-5 pr-12 font-light transition-all focus:border-gold/50 focus:shadow-gold/10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-gold transition-colors"
                  aria-label={showConfirm ? "Ocultar confirmação" : "Mostrar confirmação"}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="btn-luxe h-14 w-full rounded-full text-xs font-bold uppercase tracking-[0.2em] shadow-lg shadow-gold/10"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar senha"}
            </Button>
          </form>
        )}
      </GlowPanel>
    </div>
  );
};

export default ResetPassword;
