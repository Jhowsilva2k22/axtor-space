import { useState, FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Lock, Loader2 } from "lucide-react";

const AdminLogin = () => {
  const { user, isAdmin, loading, signIn } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center grain">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (user && isAdmin) return <Navigate to="/admin" replace />;

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
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
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
      </form>
    </div>
  );
};

export default AdminLogin;