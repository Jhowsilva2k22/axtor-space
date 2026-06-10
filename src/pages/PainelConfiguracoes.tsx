import { useState, useEffect, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Eye, EyeOff, TriangleAlert, AlertCircle, CreditCard, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BGPattern } from "@/components/BGPattern";

type Subscription = {
  plan_slug: string;
  billing_cycle: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  final_price_brl: number | null;
  status: string;
};

type Addon = {
  addon_slug: string;
  status: string;
  expires_at: string | null;
  value_brl: number | null;
};

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

const planLabel = (slug: string) =>
  ({ free: "Gratuito", pro: "Pro", partner: "Parceiro", tester: "Tester", owner: "Owner" } as Record<string, string>)[slug] ?? slug;

const statusLabel = (s: string) =>
  ({ active: "Ativa", canceled: "Cancelada", trialing: "Em teste", past_due: "Pendente" } as Record<string, string>)[s] ?? s;

const cycleLabel = (c: string | null) =>
  c ? (({ monthly: "Mensal", semestral: "Semestral", annual: "Anual" } as Record<string, string>)[c] ?? c) : null;

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }) : null;

const fmtBrl = (v: number | null) =>
  v != null ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : null;

const PainelConfiguracoes = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const { current: tenant, loading: tenantLoading, refresh: refreshTenant } = useCurrentTenant();

  // Perfil
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!tenant) return;
    setDisplayName(tenant.display_name ?? "");
    setSlug(tenant.slug ?? "");
    setWhatsapp(tenant.whatsapp_number ?? "");
  }, [tenant?.id]);

  const slugChanged = !!tenant && slug !== tenant.slug;
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  useEffect(() => {
    const slugClean = slug.trim();
    if (!tenant || slugClean === tenant.slug) { setSlugStatus("idle"); return; }
    if (!SLUG_RE.test(slugClean)) { setSlugStatus("idle"); return; }
    setSlugStatus("checking");
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("tenants")
        .select("id")
        .eq("slug", slugClean)
        .neq("id", tenant.id)
        .maybeSingle();
      setSlugStatus(data ? "taken" : "available");
    }, 500);
    return () => clearTimeout(timer);
  }, [slug, tenant?.id, tenant?.slug]);

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    const slugClean = slug.trim();
    if (!slugClean) { toast.error("O slug não pode estar vazio"); return; }
    if (!SLUG_RE.test(slugClean)) {
      toast.error("Slug inválido — use letras minúsculas, números e hífens (min. 2 chars)");
      return;
    }
    setSavingProfile(true);
    const { error } = await supabase
      .from("tenants")
      .update({
        display_name: displayName.trim() || tenant.display_name,
        slug: slugClean,
        whatsapp_number: whatsapp.trim() || null,
      })
      .eq("id", tenant.id);
    setSavingProfile(false);
    if (error) {
      toast.error(error.code === "23505" ? "Este slug já está em uso. Escolha outro." : "Erro ao salvar perfil");
      return;
    }
    await refreshTenant();
    toast.success("Perfil atualizado");
  };

  // Assinatura
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loadingBilling, setLoadingBilling] = useState(false);

  useEffect(() => {
    if (!tenant?.id) return;
    let cancelled = false;
    setLoadingBilling(true);
    Promise.all([
      supabase
        .from("tenant_subscriptions" as never)
        .select("plan_slug,billing_cycle,current_period_end,cancel_at_period_end,final_price_brl,status")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("tenant_addons" as never)
        .select("addon_slug,status,expires_at,value_brl")
        .eq("tenant_id", tenant.id)
        .eq("status", "active"),
    ]).then(([{ data: sub }, { data: ads }]) => {
      if (cancelled) return;
      setSubscription((sub as Subscription | null) ?? null);
      setAddons((ads as Addon[] | null) ?? []);
      setLoadingBilling(false);
    });
    return () => { cancelled = true; };
  }, [tenant?.id]);

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

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: deletePassword,
    });

    if (authError) {
      setDeleting(false);
      toast.error("Senha incorreta. Tente novamente.");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setDeleting(false);
      toast.error("Sessão expirada, faça login novamente");
      return;
    }

    const { error: fnError } = await supabase.functions.invoke("delete-account", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    setDeleting(false);

    if (fnError) {
      toast.error("Falha ao excluir conta. Tente novamente ou entre em contato.");
      return;
    }

    await supabase.auth.signOut();
    nav("/", { replace: true });
    toast.success("Conta excluída permanentemente");
  };

  return (
    <div className="relative isolate min-h-screen bg-background grain">
      <BGPattern />
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
        </div>

        <h1 className="mb-8 font-display text-3xl">
          Configura<span className="text-gold italic">ções</span>
        </h1>

        {/* Seção: Perfil */}
        <section className="mb-6 rounded-2xl border border-gold/20 bg-card/60 p-6 backdrop-blur">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Perfil
          </h2>
          {tenantLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-[0.15em] text-muted-foreground">
                  Nome de exibição
                </label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu nome ou marca"
                  className="h-11 rounded-sm border-gold/30 bg-input font-light"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-[0.15em] text-muted-foreground">
                  Slug público
                </label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="seu-slug"
                  className="h-11 rounded-sm border-gold/30 bg-input font-mono font-light"
                />
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground/60">
                    URL pública:{" "}
                    <span className="font-mono">/bio/{slug || "…"}</span>
                  </p>
                  {slugStatus === "checking" && (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
                      <Loader2 className="h-3 w-3 animate-spin" /> Verificando…
                    </span>
                  )}
                  {slugStatus === "available" && (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-500">
                      <CheckCircle2 className="h-3 w-3" /> Disponível
                    </span>
                  )}
                  {slugStatus === "taken" && (
                    <span className="flex items-center gap-1 text-[11px] text-destructive">
                      <XCircle className="h-3 w-3" /> Já está em uso
                    </span>
                  )}
                </div>
                {slugChanged && slugStatus !== "taken" && (
                  <div className="mt-2 flex gap-2 rounded-sm border border-amber-500/30 bg-amber-500/10 p-3">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                    <p className="text-xs text-amber-500">
                      Alterar o slug muda a URL pública da sua bio. Links existentes deixarão de funcionar.
                    </p>
                  </div>
                )}
                {slugStatus === "taken" && (
                  <div className="mt-2 flex gap-2 rounded-sm border border-destructive/30 bg-destructive/10 p-3">
                    <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                    <p className="text-xs text-destructive">
                      Este slug já está em uso. Escolha outro.
                    </p>
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-[0.15em] text-muted-foreground">
                  WhatsApp
                </label>
                <Input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+55 11 91234-5678"
                  className="h-11 rounded-sm border-gold/30 bg-input font-light"
                />
              </div>
              <Button
                type="submit"
                disabled={savingProfile || !displayName.trim() || !slug.trim() || slugStatus === "taken" || slugStatus === "checking"}
                className="btn-luxe h-11 w-full rounded-sm text-sm font-semibold uppercase tracking-[0.15em]"
              >
                {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar perfil"}
              </Button>
            </form>
          )}
        </section>

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

        {/* Seção: Assinatura */}
        <section className="mb-6 rounded-2xl border border-gold/20 bg-card/60 p-6 backdrop-blur">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Assinatura
          </h2>
          {loadingBilling ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                  Plano atual
                </span>
                <span className="text-sm font-semibold text-gold">
                  {planLabel(tenant?.plan ?? "free")}
                </span>
              </div>

              {subscription ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                      Status
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        subscription.status === "active"
                          ? "text-emerald-400"
                          : subscription.status === "past_due"
                          ? "text-amber-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {statusLabel(subscription.status)}
                    </span>
                  </div>
                  {cycleLabel(subscription.billing_cycle) && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                        Ciclo
                      </span>
                      <span className="text-sm">{cycleLabel(subscription.billing_cycle)}</span>
                    </div>
                  )}
                  {fmtDate(subscription.current_period_end) && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                        {subscription.cancel_at_period_end ? "Expira em" : "Renova em"}
                      </span>
                      <span className="text-sm">{fmtDate(subscription.current_period_end)}</span>
                    </div>
                  )}
                  {fmtBrl(subscription.final_price_brl) && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                        Valor
                      </span>
                      <span className="text-sm">{fmtBrl(subscription.final_price_brl)}</span>
                    </div>
                  )}
                  {subscription.cancel_at_period_end && (
                    <div className="mt-1 flex gap-2 rounded-sm border border-amber-500/30 bg-amber-500/10 p-3">
                      <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                      <p className="text-xs text-amber-500">
                        Cancelamento agendado para o fim do período atual.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                tenant?.plan === "free" && (
                  <div className="mt-2 rounded-sm border border-gold/20 bg-gold/5 p-4">
                    <div className="flex items-start gap-3">
                      <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-gold/60" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Você está no plano gratuito. Faça upgrade para desbloquear mais recursos.
                        </p>
                        <Link
                          to="/painel/loja"
                          className="mt-2 inline-block text-xs font-semibold uppercase tracking-[0.15em] text-gold hover:underline"
                        >
                          Ver planos →
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              )}

              {addons.length > 0 && (
                <div className="mt-2 border-t border-gold/10 pt-3">
                  <p className="mb-2 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    Complementos
                  </p>
                  <div className="space-y-2">
                    {addons.map((a, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{a.addon_slug.replace(/_/g, " ")}</span>
                        {fmtDate(a.expires_at) && (
                          <span className="text-xs text-muted-foreground">
                            até {fmtDate(a.expires_at)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Seção: Segurança */}
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
