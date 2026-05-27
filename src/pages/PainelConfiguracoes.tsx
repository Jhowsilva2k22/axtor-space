import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Eye, EyeOff, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";

const PainelConfiguracoes = () => {
  const { user, signOut } = useAuth();
  const nav = useNavigate();

  // Trocar senha
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Excluir conta
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("A senha precisa ter pelo menos 8 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {
      toast.error(error.message || "Não foi possível alterar a senha");
      return;
    }
    toast.success("Senha alterada com sucesso");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleDeleteAccount = async (e: FormEvent) => {
    e.preventDefault();
    if (!deletePassword) {
      toast.error("Informe sua senha para confirmar");
      return;
    }
    if (!user?.email) {
      toast.error("Sessão inválida, faça login novamente");
      return;
    }

    setDeleting(true);

    // Passo 1 — reautenticar para confirmar a identidade antes de qualquer exclusão
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: deletePassword,
    });

    if (authError) {
      setDeleting(false);
      toast.error("Senha incorreta. Tente novamente.");
      return;
    }

    // Passo 2 — obter o JWT atualizado da sessão
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setDeleting(false);
      toast.error("Sessão expirada, faça login novamente");
      return;
    }

    // Passo 3 — chamar a edge function que deleta os dados e a conta
    const { error: fnError } = await supabase.functions.invoke("delete-account", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    setDeleting(false);

    if (fnError) {
      toast.error("Falha ao excluir conta. Tente novamente ou entre em contato.");
      return;
    }

    // Passo 4 — encerrar sessão local e redirecionar
    await supabase.auth.signOut();
    nav("/", { replace: true });
    toast.success("Conta excluída permanentemente");
  };

  return (
    <div className="relative min-h-screen bg-background grain">
      <div className="aurora-a" />
      <div className="aurora-b" />

      <div className="relative z-10 mx-auto max-w-lg px-4 py-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            to="/painel"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao painel
          </Link>
          <ThemeToggle />
        </div>

        <h1 className="mb-8 font-display text-3xl">
          Configura<span className="text-gold italic">ções</span>
        </h1>

        {/* Seção: Conta */}
        <section className="mb-6 rounded-2xl border border-gold/20 bg-card/60 p-6 backdrop-blur">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Conta
          </h2>
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-[0.15em] text-muted-foreground">
              Email cadastrado
            </label>
            <div className="flex h-11 items-center rounded-sm border border-gold/30 bg-muted/40 px-3 text-sm text-muted-foreground select-all">
              {user?.email ?? "—"}
            </div>
          </div>
        </section>

        {/* Seção: Trocar senha */}
        <section className="mb-6 rounded-2xl border border-gold/20 bg-card/60 p-6 backdrop-blur">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Segurança
          </h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-[0.15em] text-muted-foreground">
                Nova senha
              </label>
              <div className="relative">
                <Input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  type={showNew ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={8}
                  placeholder="mínimo 8 caracteres"
                  className="h-11 rounded-sm border-gold/30 bg-input pr-11 font-light"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 transition-colors hover:text-gold"
                  aria-label={showNew ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-[0.15em] text-muted-foreground">
                Confirmar nova senha
              </label>
              <div className="relative">
                <Input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={8}
                  placeholder="repita a nova senha"
                  className="h-11 rounded-sm border-gold/30 bg-input pr-11 font-light"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 transition-colors hover:text-gold"
                  aria-label={showConfirm ? "Ocultar confirmação" : "Mostrar confirmação"}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={changingPassword || !newPassword || !confirmPassword}
              className="btn-luxe h-11 w-full rounded-sm text-sm font-semibold uppercase tracking-[0.15em]"
            >
              {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : "Alterar senha"}
            </Button>
          </form>
        </section>

        {/* Seção: Zona de perigo */}
        <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-destructive/80">
            Zona de perigo
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">
            A exclusão da conta é permanente e irreversível.
          </p>

          {!deleteConfirmOpen ? (
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(true)}
              className="h-11 w-full rounded-sm border-destructive/40 text-sm text-destructive hover:border-destructive hover:bg-destructive/10"
            >
              Excluir minha conta
            </Button>
          ) : (
            <form onSubmit={handleDeleteAccount} className="space-y-4">
              {/* Aviso explícito obrigatório */}
              <div className="flex gap-3 rounded-sm border border-destructive/40 bg-destructive/10 p-4">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <p className="text-xs leading-relaxed text-destructive">
                  Todos os seus dados serão excluídos permanentemente do sistema{" "}
                  <strong>sem possibilidade de reversão</strong>. Sua bio, leads,
                  métricas e configurações serão apagados para sempre.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-[0.15em] text-muted-foreground">
                  Confirme com sua senha atual
                </label>
                <div className="relative">
                  <Input
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    type={showDeletePassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="sua senha"
                    className="h-11 rounded-sm border-destructive/40 bg-input pr-11 font-light focus-visible:ring-destructive"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 transition-colors hover:text-destructive"
                    aria-label={showDeletePassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showDeletePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setDeleteConfirmOpen(false); setDeletePassword(""); }}
                  className="h-11 flex-1 rounded-sm text-sm"
                  disabled={deleting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={deleting || !deletePassword}
                  className="h-11 flex-1 rounded-sm border-destructive bg-destructive text-sm font-semibold text-destructive-foreground uppercase tracking-[0.1em] hover:bg-destructive/90"
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir conta"}
                </Button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
};

export default PainelConfiguracoes;
