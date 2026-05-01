import { useEffect, useMemo, useState, FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Sparkles, Check, X, ExternalLink, Copy, Gift } from "lucide-react";
import { ThemeToggle, useAdminLockedTheme } from "@/components/ThemeToggle";
import { savePendingSignup, clearPendingSignup } from "@/lib/pendingSignup";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const REASONS: Record<string, string> = {
  too_short: "muito curto (mínimo 3 caracteres)",
  too_long: "muito longo (máximo 40 caracteres)",
  invalid_format: "use apenas letras minúsculas, números e hífens",
  reserved: "este nome é reservado",
  taken: "já está em uso",
};

const INVITE_REASONS: Record<string, string> = {
  invalid_format: "código inválido",
  not_found: "código não encontrado",
  revoked: "este código foi substituído por um novo — confira seu email mais recente ou peça pra quem te enviou",
  already_used: "código já utilizado",
  expired: "este código expirou — peça um novo pra quem te enviou",
  email_mismatch: "este código é para outro email",
};

type Created = { tenant_id: string; slug: string; url: string };

const Signup = () => {
  useAdminLockedTheme();
  const { user, loading: authLoading } = useAuth();
  const { refresh } = useCurrentTenant();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const initialInvite = (searchParams.get("invite") || "").toUpperCase();
  const initialEmail = searchParams.get("email") || "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [accept, setAccept] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<Created | null>(null);
  const [inviteOpen, setInviteOpen] = useState(!!initialInvite);
  const [inviteCode, setInviteCode] = useState(initialInvite);
  const [inviteChecking, setInviteChecking] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<{ valid: boolean; type?: string; reason?: string } | null>(null);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  const [checking, setChecking] = useState(false);
  const [slugStatus, setSlugStatus] = useState<{ ok: boolean; reason?: string } | null>(null);
  useEffect(() => {
    if (!slug) { setSlugStatus(null); return; }
    setChecking(true);
    const t = window.setTimeout(async () => {
      const { data, error } = await supabase.rpc("check_slug_available" as any, { _slug: slug });
      setChecking(false);
      if (error) { setSlugStatus({ ok: false, reason: "erro ao verificar" }); return; }
      const d = data as any;
      setSlugStatus({ ok: !!d?.available, reason: d?.reason });
    }, 400);
    return () => window.clearTimeout(t);
  }, [slug]);

  const slugHint = useMemo(() => {
    if (!slug) return null;
    if (checking) return { color: "text-muted-foreground", text: "verificando..." };
    if (!slugStatus) return null;
    if (slugStatus.ok) return { color: "text-emerald-500", text: `axtor.space/${slug} está livre` };
    return { color: "text-destructive", text: REASONS[slugStatus.reason ?? ""] ?? "indisponível" };
  }, [slug, checking, slugStatus]);

  useEffect(() => {
    if (!inviteCode) { setInviteStatus(null); return; }
    setInviteChecking(true);
    const t = window.setTimeout(async () => {
      const { data, error } = await supabase.rpc("validate_invite_code" as any, {
        _code: inviteCode,
        _email: email || null,
      });
      setInviteChecking(false);
      if (error) { setInviteStatus({ valid: false, reason: "invalid_format" }); return; }
      const d = data as any;
      setInviteStatus({ valid: !!d?.valid, type: d?.type, reason: d?.reason });
    }, 400);
    return () => window.clearTimeout(t);
  }, [inviteCode, email]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center grain">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (user && !created) return <Navigate to="/admin" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accept) { toast.error("aceite os termos para continuar"); return; }
    if (!slugStatus?.ok) { toast.error("escolha um slug disponível"); return; }
    if (password.length < 8) { toast.error("senha precisa ter ao menos 8 caracteres"); return; }

    setSubmitting(true);
    savePendingSignup({
      slug,
      displayName: name.trim(),
      inviteCode: inviteCode || null,
      email: email.trim().toLowerCase(),
    });
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/admin`,
        data: { full_name: name.trim() },
      },
    });
    if (signUpErr || !signUpData.user) {
      setSubmitting(false);
      toast.error(signUpErr?.message ?? "erro ao criar conta");
      return;
    }

    if (!signUpData.session) {
      setSubmitting(false);
      toast.success("conta criada! confirme seu email — sua bio será liberada automaticamente quando você voltar");
      return;
    }

    const { data: tdata, error: terr } = await supabase.rpc(
      "create_tenant_for_user" as any,
      { _slug: slug, _display_name: name.trim(), _invite_code: inviteCode || null } as any
    );
    setSubmitting(false);
    if (terr) {
      toast.error("conta criada, mas falha ao criar bio: " + terr.message);
      return;
    }
    const result = tdata as any as Created;
    await refresh();
    setCreated(result);
    clearPendingSignup();
    const planLabel = (tdata as any)?.plan;
    if (planLabel === "partner") toast.success("bio criada — acesso parceiro liberado ✨");
    else if (planLabel === "tester") toast.success("bio criada — acesso beta-tester liberado ✨");
    else toast.success("bio criada com sucesso");

    try {
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "welcome-tenant",
          recipientEmail: email.trim().toLowerCase(),
          idempotencyKey: `welcome-${result.tenant_id}`,
          templateData: {
            name: name.trim(),
            bioUrl: result.url,
            adminUrl: `${window.location.origin}/admin`,
            slug: result.slug,
            plan: planLabel ?? "free",
          },
        },
      });
    } catch (err) {
      console.error("welcome email failed:", err);
    }
  };

  if (created) {
    return (
      <div className="relative flex min-h-screen items-center justify-center px-6 grain">
        <div className="aurora-a" />
        <div className="aurora-b" />
        <ThemeToggle className="absolute right-5 top-5 z-20" />
        <div className="relative z-10 w-full max-w-md rounded-[32px] border border-gold/20 bg-card/40 p-10 shadow-2xl backdrop-blur-xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/30 bg-gradient-gold-soft shadow-gold/20 shadow-lg">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h1 className="mt-8 font-display text-4xl">Bio <span className="text-gold italic">criada</span></h1>
          <p className="mt-4 text-sm text-muted-foreground">sua bio já está no ar em</p>
          <button
            onClick={() => { navigator.clipboard.writeText(created.url); toast.success("link copiado"); }}
            className="mt-4 inline-flex items-center gap-3 rounded-full border border-gold/30 bg-gold/5 px-6 py-2.5 text-sm font-medium text-primary transition-all hover:bg-gold/10 hover:shadow-gold/20 hover:shadow-lg"
          >
            {created.url} <Copy className="h-4 w-4" />
          </button>
          <div className="mt-10 grid grid-cols-2 gap-3">
            <Button asChild className="btn-luxe h-12 rounded-full text-xs font-bold uppercase tracking-[0.2em]">
              <button onClick={() => nav("/admin")}>Ir pro admin</button>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-full border-gold/30 bg-card/40 text-xs font-bold uppercase tracking-[0.2em] transition-all hover:shadow-gold/20 hover:shadow-lg">
              <a href={created.url} target="_blank" rel="noopener noreferrer">
                Ver bio <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-10 grain overflow-x-hidden">
      <div className="aurora-a" />
      <div className="aurora-b" />
      <ThemeToggle className="absolute right-5 top-5 z-20" />
      <form onSubmit={onSubmit} className="relative z-10 w-full max-w-md rounded-[32px] border border-gold/20 bg-card/40 p-10 shadow-2xl backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/30 bg-gradient-gold-soft shadow-gold/20 shadow-lg">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <h1 className="mt-8 text-center font-display text-4xl">Crie sua <span className="text-gold italic">bio</span></h1>
        <p className="mt-3 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">grátis pra começar · sem cartão · sem código</p>

        <div className="mt-10 space-y-5">
          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/80">Nome completo</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} className="h-12 rounded-full border-gold/20 bg-card/30 px-5 font-light transition-all focus:border-gold/50 focus:shadow-gold/10" placeholder="Ex: Stefany Mello" />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/80">Email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" required className="h-12 rounded-full border-gold/20 bg-card/30 px-5 font-light transition-all focus:border-gold/50 focus:shadow-gold/10" placeholder="voce@exemplo.com" />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/80">Senha (mín. 8)</label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="new-password" required minLength={8} className="h-12 rounded-full border-gold/20 bg-card/30 px-5 font-light transition-all focus:border-gold/50 focus:shadow-gold/10" placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/80">Sua URL</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 select-none text-sm text-muted-foreground/50">axtor.space/</span>
              <Input
                value={slug}
                onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); }}
                placeholder="seu-nome"
                required
                minLength={3}
                maxLength={40}
                className="h-12 rounded-full border-gold/20 bg-card/30 pl-[95px] pr-12 font-light transition-all focus:border-gold/50 focus:shadow-gold/10"
              />
              {slug && slugStatus && !checking && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {slugStatus.ok ? <Check className="h-5 w-5 text-emerald-500" /> : <X className="h-5 w-5 text-destructive" />}
                </div>
              )}
            </div>
            {slugHint && <p className={`mt-1.5 px-4 text-[10px] font-medium ${slugHint.color}`}>{slugHint.text}</p>}
          </div>

          {/* Checkbox aceite — Item polimento UX 2026-05-01: aumentei tamanho, border mais visível e fundo contrastante. */}
          <label className="group flex items-start gap-3 px-2 py-2 cursor-pointer">
            <div className="relative mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                checked={accept}
                onChange={(e) => setAccept(e.target.checked)}
                className="peer h-5 w-5 appearance-none rounded-md border-2 border-gold/70 bg-card/80 transition-all checked:bg-gold checked:border-gold hover:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
              <Check className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 scale-0 text-background transition-all peer-checked:scale-100" strokeWidth={3} />
            </div>
            <span className="text-xs leading-relaxed text-muted-foreground transition-colors group-hover:text-foreground">
              Aceito os <Link to="/terms" className="text-gold hover:underline">termos de uso</Link> e a <Link to="/privacy" className="text-gold hover:underline">política de privacidade</Link>
            </span>
          </label>

          <div className="pt-2">
            {!inviteOpen ? (
              <button
                type="button"
                onClick={() => setInviteOpen(true)}
                className="text-[11px] font-medium text-muted-foreground/60 hover:text-gold transition-colors underline-offset-4 hover:underline"
              >
                Tenho um código de convite
              </button>
            ) : (
              <div className="space-y-2 animate-fade-in">
                <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/80">Código de convite</label>
                <Input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase().trim())}
                  placeholder="EX: STEFANY-2026"
                  className="h-11 rounded-full border-gold/20 bg-card/30 px-5 font-mono text-xs uppercase tracking-wider transition-all focus:border-gold/50"
                />
                {inviteCode && (inviteChecking ? (
                  <p className="mt-1.5 px-4 text-[10px] text-muted-foreground">Verificando...</p>
                ) : inviteStatus && (
                  inviteStatus.valid ? (
                    <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/5 px-4 py-1.5 text-[10px] font-medium text-emerald-500 animate-fade-up">
                      <Gift className="h-3 w-3" />
                      {inviteStatus.type === "partner" ? "Acesso Parceiro: Vitalício ✨" : "Acesso Beta-Tester ✨"}
                    </p>
                  ) : (
                    <p className="mt-1.5 px-4 text-[10px] font-medium text-destructive">
                      {INVITE_REASONS[inviteStatus.reason ?? ""] ?? "Código inválido"}
                    </p>
                  )
                ))}
              </div>
            )}
          </div>
        </div>

        <Button
          type="submit"
          disabled={submitting || !slugStatus?.ok || !accept}
          className="btn-luxe mt-10 h-14 w-full rounded-full text-xs font-bold uppercase tracking-[0.2em] shadow-lg shadow-gold/10"
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Criar minha bio grátis"}
        </Button>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Já tem conta? <Link to="/admin/login" className="font-bold text-gold hover:underline">Entrar</Link>
        </p>
      </form>
    </div>
  );
};

export default Signup;
