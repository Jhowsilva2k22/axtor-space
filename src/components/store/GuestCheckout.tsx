import { useState, useEffect, useMemo, FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GlowPanel } from "@/components/landing/GlowPanel";
import { fieldLabel } from "@/lib/ui";
import { toast } from "sonner";
import { Loader2, Copy, MailCheck, Check, X, Clock, RefreshCw } from "lucide-react";

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Máscara progressiva 000.000.000-00
const formatCpf = (v: string) => {
  const c = v.replace(/\D/g, "").slice(0, 11);
  if (c.length > 9) return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;
  if (c.length > 6) return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6)}`;
  if (c.length > 3) return `${c.slice(0, 3)}.${c.slice(3)}`;
  return c;
};

// Validação de dígito verificador do CPF (evita CPF inválido que o Asaas rejeita)
const isValidCpf = (cpf: string) => {
  const c = cpf.replace(/\D/g, "");
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(c[i], 10) * (10 - i);
  let d1 = 11 - (sum % 11);
  if (d1 >= 10) d1 = 0;
  if (d1 !== parseInt(c[9], 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(c[i], 10) * (11 - i);
  let d2 = 11 - (sum % 11);
  if (d2 >= 10) d2 = 0;
  return d2 === parseInt(c[10], 10);
};

type PixResult = {
  paymentId: string;
  qrCode: string | null;
  qrCodeText: string | null;
  valor: number;
};

// Tempo de vida do Pix antes de expirar (urgência real — no zero a cobrança é
// cancelada no Asaas, o QR morre de verdade).
const PIX_TTL = 5 * 60; // segundos (5 min)

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const PLAN_LABEL: Record<string, string> = { pro: "Pro", premium: "Premium" };

const SLUG_REASONS: Record<string, string> = {
  taken: "esse @ já está em uso",
  reserved: "esse @ é reservado",
  invalid: "use 3-40 letras, números ou hífen",
  too_short: "mínimo 3 caracteres",
};

/**
 * Checkout de convidado (Caminho Y): paga primeiro, conta criada depois.
 * Mostrado na /loja quando o visitante NÃO está logado.
 * Coleta email, nome, CPF e @ → chama guest-create-payment → mostra o Pix.
 * A confirmação do acesso chega por email (magic link) após o pagamento.
 */
export const GuestCheckout = ({ planSlug }: { planSlug: "pro" | "premium" }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [cpf, setCpf] = useState(""); // guardo só os dígitos
  const [cpfTouched, setCpfTouched] = useState(false);
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [accept, setAccept] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pix, setPix] = useState<PixResult | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(PIX_TTL);
  const [expired, setExpired] = useState(false);
  const [paid, setPaid] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const effectiveSlug = slugTouched ? slug : slugify(name);

  // Validações locais
  const emailOk = EMAIL_RE.test(email.trim());
  const cpfOk = isValidCpf(cpf);

  // Checagem do @ ao vivo (mesmo RPC do cadastro), com debounce
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugStatus, setSlugStatus] = useState<{ ok: boolean; reason?: string } | null>(null);
  useEffect(() => {
    if (!effectiveSlug) { setSlugStatus(null); return; }
    if (effectiveSlug.length < 3) { setSlugStatus({ ok: false, reason: "too_short" }); return; }
    setCheckingSlug(true);
    const t = window.setTimeout(async () => {
      const { data, error } = await supabase.rpc("check_slug_available" as never, { _slug: effectiveSlug } as never);
      setCheckingSlug(false);
      if (error) { setSlugStatus({ ok: false, reason: "erro ao verificar" }); return; }
      const d = data as { available?: boolean; reason?: string } | null;
      setSlugStatus({ ok: !!d?.available, reason: d?.reason });
    }, 400);
    return () => window.clearTimeout(t);
  }, [effectiveSlug]);

  const slugHint = useMemo(() => {
    if (!effectiveSlug) return null;
    if (checkingSlug) return { color: "text-muted-foreground", text: "verificando..." };
    if (!slugStatus) return null;
    if (slugStatus.ok) return { color: "text-emerald-500", text: `axtor.space/${effectiveSlug} está livre` };
    return { color: "text-destructive", text: SLUG_REASONS[slugStatus.reason ?? ""] ?? "indisponível, escolha outro" };
  }, [effectiveSlug, checkingSlug, slugStatus]);

  const canSubmit = emailOk && cpfOk && !!slugStatus?.ok && accept && name.trim().length >= 2 && !submitting;

  // Cria (ou recria) a cobrança Pix. replacePaymentId cancela a anterior no Asaas.
  const createPix = async (replacePaymentId?: string): Promise<boolean> => {
    const { data, error } = await supabase.functions.invoke("guest-create-payment", {
      body: {
        email: email.trim().toLowerCase(),
        display_name: name.trim(),
        cpf: cpf.replace(/\D/g, ""),
        slug: effectiveSlug,
        plan_slug: planSlug,
        ...(replacePaymentId ? { replace_payment_id: replacePaymentId } : {}),
      },
    });

    if (error) {
      let code = "";
      try {
        const b = await (error as { context?: { json?: () => Promise<{ error?: string }> } }).context?.json?.();
        code = b?.error ?? "";
      } catch { /* ignora */ }
      if (code === "email_has_account") {
        toast.error("Esse email já tem conta. Faça login para comprar.");
        return false;
      }
      if (code === "slug_taken") {
        setSlugStatus({ ok: false, reason: "taken" });
        toast.error("Esse @ já está em uso. Escolha outro.");
        return false;
      }
      toast.error("Não foi possível gerar o Pix. Confira os dados e tente de novo.");
      return false;
    }
    setPix(data as PixResult);
    return true;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accept) { toast.error("Aceite os termos para continuar."); return; }
    if (!emailOk) { toast.error("Confira o email."); return; }
    if (!cpfOk) { toast.error("CPF inválido."); return; }
    if (!slugStatus?.ok) { toast.error("Escolha um @ disponível."); return; }
    setSubmitting(true);
    await createPix();
    setSubmitting(false);
  };

  // Gerar novo Pix (após expirar) — cancela o antigo e cria outro, sem sair da tela.
  const regenerate = async () => {
    setRegenerating(true);
    await createPix(pix?.paymentId);
    setRegenerating(false);
  };

  // Reinicia o contador sempre que um Pix novo aparece.
  useEffect(() => {
    if (!pix) return;
    setSecondsLeft(PIX_TTL);
    setExpired(false);
    setPaid(false);
  }, [pix]);

  // Tick do contador. No zero: pergunta ao servidor se a cobrança já foi paga.
  // Se sim, mostra "pagamento recebido" (o webhook provisiona a conta). Se não,
  // expira de verdade (a cobrança é cancelada no Asaas — sem escassez falsa).
  useEffect(() => {
    if (!pix || expired || paid) return;
    if (secondsLeft <= 0) {
      (async () => {
        const { data } = await supabase.functions.invoke("guest-create-payment", {
          body: { cancel_only: true, payment_id: pix.paymentId },
        });
        if ((data as { paid?: boolean } | null)?.paid) setPaid(true);
        else setExpired(true);
      })();
      return;
    }
    const t = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [pix, expired, paid, secondsLeft]);

  // Tela do Pix (após gerar a cobrança)
  if (pix) {
    return (
      <GlowPanel className="p-6 text-center sm:p-8">
        <h2 className="font-display text-2xl">Pague para liberar seu acesso</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Plano {PLAN_LABEL[planSlug]} ·{" "}
          {pix.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </p>

        {paid ? (
          <div className="mt-6">
            <div className="mx-auto flex h-52 w-52 max-w-full items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/5 sm:h-56 sm:w-56">
              <div className="px-6">
                <MailCheck className="mx-auto h-8 w-8 text-emerald-500" />
                <p className="mt-3 text-sm font-medium text-foreground">Pagamento recebido!</p>
                <p className="mt-1 text-xs text-muted-foreground">Liberando seu acesso…</p>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-gold/15 bg-gold/[0.04] p-5 text-left">
              <p className="text-sm font-light leading-relaxed text-muted-foreground">
                Enviamos o link de acesso para{" "}
                <span className="font-medium text-foreground">{email}</span> (confira o spam também). É
                só clicar e entrar — sua conta já está criada.
              </p>
            </div>
          </div>
        ) : !expired ? (
          <>
            <div
              className={`mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-sm font-bold tabular-nums text-gold ${secondsLeft <= 60 ? "animate-pulse" : ""}`}
            >
              <Clock className="h-4 w-4" /> expira em {mmss(secondsLeft)}
            </div>
            {pix.qrCode && (
              <img
                src={`data:image/png;base64,${pix.qrCode}`}
                alt="QR Code Pix"
                className="mx-auto mt-5 h-52 w-52 max-w-full rounded-xl bg-white p-2 sm:h-56 sm:w-56"
              />
            )}
            {pix.qrCodeText && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(pix.qrCodeText!);
                  toast.success("Código Pix copiado");
                }}
                className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-gold/30 px-4 py-2 text-xs text-muted-foreground hover:text-primary"
              >
                <Copy className="h-3.5 w-3.5" /> Copiar código Pix
              </button>
            )}
            <div className="mt-6 rounded-2xl border border-gold/15 bg-gold/[0.04] p-5 text-left">
              <div className="flex items-center gap-2 text-gold">
                <MailCheck className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Acesso por email</span>
              </div>
              <p className="mt-3 text-sm font-light leading-relaxed text-muted-foreground">
                Confirmado o pagamento, enviamos o link de acesso para{" "}
                <span className="font-medium text-foreground">{email}</span>. Sua conta já estará criada e a URL{" "}
                <span className="font-medium text-foreground">axtor.space/{effectiveSlug}</span> reservada — é só entrar e personalizar.
              </p>
            </div>
          </>
        ) : (
          <div className="mt-6">
            <div className="mx-auto flex h-52 w-52 max-w-full items-center justify-center rounded-xl border border-gold/20 bg-card/40 sm:h-56 sm:w-56">
              <div className="px-6">
                <Clock className="mx-auto h-8 w-8 text-gold/70" />
                <p className="mt-3 text-sm font-medium text-foreground">Pix expirado</p>
                <p className="mt-1 text-xs text-muted-foreground">Gere um novo para continuar.</p>
              </div>
            </div>
            <Button
              type="button"
              onClick={regenerate}
              disabled={regenerating}
              className="btn-luxe mx-auto mt-6 inline-flex h-12 items-center gap-2 rounded-full px-8 text-xs font-bold uppercase tracking-[0.2em]"
            >
              {regenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <><RefreshCw className="h-4 w-4" /> Gerar novo Pix</>}
            </Button>
          </div>
        )}
      </GlowPanel>
    );
  }

  // Formulário
  return (
    <GlowPanel className="p-8">
      <h2 className="font-display text-2xl">
        Assinar <span className="text-gold">{PLAN_LABEL[planSlug]}</span>
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Pague pelo Pix e receba seu acesso por email. Sem criar conta antes.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <label className={fieldLabel}>Nome completo</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} className="h-12 rounded-full border-gold/20 bg-card/30 px-5 font-light transition-all focus:border-gold/50 focus:shadow-gold/10" placeholder="Seu nome completo" />
        </div>

        <div className="space-y-2">
          <label className={fieldLabel}>Email</label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            type="email"
            required
            className={`h-12 rounded-full bg-card/30 px-5 font-light transition-all focus:shadow-gold/10 ${emailTouched && !emailOk ? "border-destructive/60 focus:border-destructive" : "border-gold/20 focus:border-gold/50"}`}
            placeholder="voce@exemplo.com"
          />
          {emailTouched && !emailOk && email.length > 0 && (
            <p className="px-4 text-[10px] font-medium text-destructive">email inválido — confira o endereço</p>
          )}
        </div>

        <div className="space-y-2">
          <label className={fieldLabel}>CPF</label>
          <Input
            value={formatCpf(cpf)}
            onChange={(e) => setCpf(e.target.value.replace(/\D/g, "").slice(0, 11))}
            onBlur={() => setCpfTouched(true)}
            required
            inputMode="numeric"
            className={`h-12 rounded-full bg-card/30 px-5 font-light transition-all focus:shadow-gold/10 ${cpfTouched && !cpfOk ? "border-destructive/60 focus:border-destructive" : "border-gold/20 focus:border-gold/50"}`}
            placeholder="000.000.000-00"
          />
          {cpfTouched && !cpfOk && cpf.length > 0 && (
            <p className="px-4 text-[10px] font-medium text-destructive">CPF inválido</p>
          )}
        </div>

        <div className="space-y-2">
          <label className={fieldLabel}>Seu @ (URL da bio)</label>
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 select-none text-sm font-light text-muted-foreground/50">axtor.space/</span>
            <Input
              value={effectiveSlug}
              onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); }}
              required
              minLength={3}
              maxLength={40}
              className="h-12 rounded-full border-gold/20 bg-card/30 pl-[112px] pr-12 font-light transition-all focus:border-gold/50 focus:shadow-gold/10"
              placeholder="seu-nome"
            />
            {effectiveSlug && !checkingSlug && slugStatus && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {slugStatus.ok ? <Check className="h-5 w-5 text-emerald-500" /> : <X className="h-5 w-5 text-destructive" />}
              </div>
            )}
          </div>
          {slugHint && <p className={`px-4 text-[10px] font-medium ${slugHint.color}`}>{slugHint.text}</p>}
        </div>

        <label className="group flex cursor-pointer items-start gap-3 pt-1">
          <div className="relative mt-0.5 flex-shrink-0">
            <input
              type="checkbox"
              checked={accept}
              onChange={(e) => setAccept(e.target.checked)}
              className="peer h-5 w-5 appearance-none rounded-md border-2 border-gold/70 bg-card/80 transition-all checked:border-gold checked:bg-gold hover:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
            <Check className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 scale-0 text-white transition-all peer-checked:scale-100" strokeWidth={3} />
          </div>
          <span className="text-xs leading-relaxed text-muted-foreground transition-colors group-hover:text-foreground">
            Aceito os <Link to="/terms" className="text-gold hover:underline">termos de uso</Link> e a{" "}
            <Link to="/privacy" className="text-gold hover:underline">política de privacidade</Link>
          </span>
        </label>

        <Button type="submit" disabled={!canSubmit} className="btn-luxe h-12 w-full rounded-full text-xs font-bold uppercase tracking-[0.2em] disabled:opacity-70">
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Gerar Pix"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Já tem conta?{" "}
          <Link to={`/admin/login?redirect=${encodeURIComponent(`/loja?plan=${planSlug}`)}`} className="font-bold text-gold hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </GlowPanel>
  );
};
