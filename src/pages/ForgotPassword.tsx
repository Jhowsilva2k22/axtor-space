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
    <div className="relative flex min-h-screen items-center justify-center px-6 grain overflow-x-hidden">
      <div className="aurora-a" />
      <div className="aurora-b" />
      <ThemeToggle className="absolute right-5 top-5 z-20" />

      <div className="relative z-10 w-full max-w-sm rounded-[32px] border border-gold/20 bg-card/40 p-10 shadow-2xl backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/30 bg-gradient-gold-soft shadow-gold/20 shadow-lg">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <h1 className="mt-8 text-center font-display text-4xl">
          Recuperar <span className="text-gold italic">senha</span>
        </h1>
        <p className="mt-3 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">
          {sent ? "verifique seu email" : "enviaremos um link seguro"}
        </p>

        {sent ? (
          <div className="mt-10 space-y-6">
            <p className="rounded-2xl border border-gold/20 bg-gold/5 p-6 text-sm font-light leading-relaxed text-muted-foreground/90">
              Se o email <span className="font-medium text-gold">{email}</span> estiver cadastrado, você
              receberá um link de redefinição em instantes.
            </p>
            <p className="text-center text-[11px] text-muted-foreground/60">
              Não chegou? Confira o spam ou{" "}
              <button
                type="button"
                onClick={() => setSent(false)}
                className="font-bold text-gold hover:underline"
              >
                tente novamente
              </button>
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-10 space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/80">
                Email da conta
              </label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                required
                className="h-12 rounded-full border-gold/20 bg-card/30 px-5 font-light transition-all focus:border-gold/50"
                placeholder="voce@exemplo.com"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="btn-luxe h-14 w-full rounded-full text-xs font-bold uppercase tracking-[0.2em] shadow-lg shadow-gold/10"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Enviar link de acesso"}
            </Button>
          </form>
        )}

        <div className="mt-8 text-center">
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 hover:text-gold transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar para login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;