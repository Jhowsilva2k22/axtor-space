import { useEffect, useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { KeyRound, Loader2, Eye, EyeOff } from "lucide-react";
import { ThemeToggle, useAdminLockedTheme } from "@/components/ThemeToggle";

const ResetPassword = () => {
  useAdminLockedTheme();
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
    nav("/admin", { replace: true });
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center grain">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 grain">
      <div className="aurora-a" />
      <div className="aurora-b" />
      <ThemeToggle className="absolute right-5 top-5 z-20" />

      <div className="relative z-10 w-full max-w-sm rounded-sm border-gold-gradient bg-card/60 p-8 shadow-deep backdrop-blur">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-sm border border-gold bg-gradient-gold-soft">
          <KeyRound className="h-5 w-5 text-primary" />
        </div>
        <h1 className="mt-6 text-center font-display text-3xl">
          Nova <span className="text-gold italic">senha</span>
        </h1>
        <p className="mt-2 text-center text-xs uppercase tracking-[0.25em] text-muted-foreground">
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
              className="btn-luxe h-12 w-full rounded-sm text-sm font-semibold uppercase tracking-[0.15em]"
            >
              Pedir novo link
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
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
                  className="h-11 rounded-sm border-gold bg-input pr-11 font-light"
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
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
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
                  className="h-11 rounded-sm border-gold bg-input pr-11 font-light"
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
              className="btn-luxe h-12 w-full rounded-sm text-sm font-semibold uppercase tracking-[0.15em]"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar senha"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
