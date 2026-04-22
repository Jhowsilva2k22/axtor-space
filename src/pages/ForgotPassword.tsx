import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mail, Loader2, ArrowLeft } from "lucide-react";
import { ThemeToggle, useAdminLockedTheme } from "@/components/ThemeToggle";

const ForgotPassword = () => {
  useAdminLockedTheme();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!clean) return;
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(clean, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Não foi possível enviar o email. Tente novamente.");
      return;
    }
    setSent(true);
    toast.success("Email enviado");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 grain">
      <div className="aurora-a" />
      <div className="aurora-b" />
      <ThemeToggle className="absolute right-5 top-5 z-20" />

      <div className="relative z-10 w-full max-w-sm rounded-sm border-gold-gradient bg-card/60 p-8 shadow-deep backdrop-blur">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-sm border border-gold bg-gradient-gold-soft">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <h1 className="mt-6 text-center font-display text-3xl">
          Recuperar <span className="text-gold italic">senha</span>
        </h1>
        <p className="mt-2 text-center text-xs uppercase tracking-[0.25em] text-muted-foreground">
          {sent ? "verifique seu email" : "enviaremos um link"}
        </p>

        {sent ? (
          <div className="mt-8 space-y-4">
            <p className="rounded-sm border border-gold/30 bg-background/40 p-4 text-sm font-light text-muted-foreground">
              Se o email <span className="text-primary">{email}</span> existir, você
              receberá um link para redefinir sua senha em alguns instantes.
            </p>
            <p className="text-xs text-muted-foreground">
              Não chegou? Confira spam/lixo eletrônico ou{" "}
              <button
                type="button"
                onClick={() => setSent(false)}
                className="text-primary hover:underline"
              >
                tentar de novo
              </button>
              .
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Email da conta
              </label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                required
                className="h-11 rounded-sm border-gold bg-input font-light"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="btn-luxe h-12 w-full rounded-sm text-sm font-semibold uppercase tracking-[0.15em]"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar link"}
            </Button>
          </form>
        )}

        <Link
          to="/admin/login"
          className="mt-6 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar para login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;