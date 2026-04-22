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

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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
  revoked: "código revogado",
  already_used: "código já utilizado",
  expired: "código expirado",
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

  // sugestão automática a partir do nome
  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  // check de slug em tempo real (debounce)
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

  // validação invite code com debounce
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

    // Se confirmação de email estiver ON, não há sessão; orientar usuário.
    if (!signUpData.session) {
      setSubmitting(false);
      toast.success("conta criada! confirme seu email para continuar");
      return;
    }

    // Criar tenant
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
    const planLabel = (tdata as any)?.plan;
    if (planLabel === "partner") toast.success("bio criada — acesso parceiro liberado ✨");
    else if (planLabel === "tester") toast.success("bio criada — acesso beta-tester liberado ✨");
    else toast.success("bio criada com sucesso");
  };

  if (created) {
    return (
      <div className="relative flex min-h-screen items-center justify-center px-6 grain">
        <div className="aurora-a" />
        <div className="aurora-b" />
        <ThemeToggle className="absolute right-5 top-5 z-20" />
        <div className="relative z-10 w-full max-w-md rounded-sm border-gold-gradient bg-card/60 p-8 shadow-deep backdrop-blur text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-sm border border-gold bg-gradient-gold-soft">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <h1 className="mt-6 font-display text-3xl">Bio <span className="text-gold italic">criada</span></h1>
          <p className="mt-3 text-sm text-muted-foreground">sua bio já está no ar em</p>
          <button
            onClick={() => { navigator.clipboard.writeText(created.url); toast.success("link copiado"); }}
            className="mt-3 inline-flex items-center gap-2 rounded-sm border border-gold bg-gradient-gold-soft px-4 py-2 text-sm text-primary"
          >
            {created.url} <Copy className="h-3.5 w-3.5" />
          </button>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Button asChild className="btn-luxe h-11 rounded-sm text-xs uppercase tracking-[0.2em]">
              <button onClick={() => nav("/admin")}>Ir pro admin</button>
            </Button>
            <Button asChild variant="outline" className="h-11 rounded-sm border-gold bg-card/40 text-xs uppercase tracking-[0.2em]">
              <a href={created.url} target="_blank" rel="noopener noreferrer">
                Ver bio <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-10 grain">
      <div className="aurora-a" />
      <div className="aurora-b" />
      <ThemeToggle className="absolute right-5 top-5 z-20" />
      <form onSubmit={onSubmit} className="relative z-10 w-full max-w-md rounded-sm border-gold-gradient bg-card/60 p-8 shadow-deep backdrop-blur">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-sm border border-gold bg-gradient-gold-soft">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <h1 className="mt-6 text-center font-display text-3xl">Crie sua <span className="text-gold italic">bio</span></h1>
        <p className="mt-2 text-center text-xs uppercase tracking-[0.25em] text-muted-foreground">grátis pra começar · sem cartão · sem código</p>

        <div className="mt-8 space-y-4">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">Nome completo</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} className="h-11 rounded-sm border-gold bg-input font-light" />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">Email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" required className="h-11 rounded-sm border-gold bg-input font-light" />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">Senha (mín. 8)</label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="new-password" required minLength={8} className="h-11 rounded-sm border-gold bg-input font-light" />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">Sua URL</label>
            <div className="flex items-center gap-1">
              <span className="select-none text-sm text-muted-foreground">axtor.space/</span>
              <Input
                value={slug}
                onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); }}
                placeholder="seu-nome"
                required
                minLength={3}
                maxLength={40}
                className="h-11 rounded-sm border-gold bg-input font-light"
              />
              {slug && slugStatus && !checking && (
                slugStatus.ok ? <Check className="h-5 w-5 text-emerald-500" /> : <X className="h-5 w-5 text-destructive" />
              )}
            </div>
            {slugHint && <p className={`mt-1.5 text-[11px] ${slugHint.color}`}>{slugHint.text}</p>}
          </div>
          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} className="mt-0.5" />
            <span>aceito os termos de uso e a política de privacidade</span>
          </label>
        </div>

        <Button type="submit" disabled={submitting || !slugStatus?.ok || !accept} className="btn-luxe mt-6 h-12 w-full rounded-sm text-sm font-semibold uppercase tracking-[0.15em]">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar minha bio grátis"}
        </Button>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          já tem conta? <Link to="/admin/login" className="text-primary hover:underline">entrar</Link>
        </p>
      </form>
    </div>
  );
};

export default Signup;