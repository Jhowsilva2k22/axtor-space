import { useState } from "react";
import { applyTenantTheme } from "@/lib/applyTenantTheme";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowRight, Sparkles, Lock, CheckCircle2, AlertTriangle, Loader2, Instagram, TrendingUp, Target, Zap, SearchX, Share2, Clock, Check, Crown, MessageCircle, ExternalLink } from "lucide-react";
import { validateEmail, validateName, validatePhone, maskPhone, suggestEmailDomain, COUNTRIES, normalizeWhatsappUrl, type CountryCode } from "@/lib/validators";
import { trackPageView, trackFunnel } from "@/lib/analytics";
import { PUBLIC_BASE_URL } from "@/lib/site";
import { useEffect } from "react";
import FeedbackWidget from "@/components/FeedbackWidget";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PROXY = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proxy-image?url=`;
const proxied = (url?: string) => (url ? PROXY + encodeURIComponent(url) : "");

// Chave do localStorage usada pra reaproveitar nome/email/phone/handle
// na rota /d/funnel/<slug> sem fazer o lead redigitar tudo.
const LEAD_CACHE_KEY = "axtor_lead";
const LEAD_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type Step = "handle" | "lead" | "loading" | "result" | "private" | "not_found" | "blocked";

type PartnerCtas = {
  tenant_id: string;
  slug: string;
  display_name: string;
  bio_url: string | null;
  instagram_handle: string | null;
  whatsapp_number: string | null;
  whatsapp_message: string | null;
  secondary_cta_label: string | null;
  secondary_cta_url: string | null;
};

interface DiagnosisData {
  status: string;
  handle?: string;
  message?: string;
  unlocks_at?: string;
  diagnostic_id?: string;
  cached?: boolean;
  profile?: any;
  profile_preview?: any;
  diagnosis?: {
    score_geral: number;
    scores: Record<string, number>;
    pontos_fortes: string[];
    gaps_criticos: string[];
    plano_acao: string[];
    veredicto: string;
  };
  error?: string;
}

const LOADING_STEPS = [
  "Conectando com o Instagram...",
  "Analisando sua bio e posicionamento...",
  "Calculando taxa de engajamento real...",
  "Comparando com perfis do seu nicho...",
  "Identificando pontos de conversão perdidos...",
  "Gerando seu plano de ação personalizado...",
];

const Index = () => {
  const [step, setStep] = useState<Step>("handle");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState<CountryCode>("BR");
  const [name, setName] = useState("");
  const [loadingMsg, setLoadingMsg] = useState(LOADING_STEPS[0]);
  const [data, setData] = useState<DiagnosisData | null>(null);
  const [partnerCtas, setPartnerCtas] = useState<PartnerCtas | null>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [bioCfg, setBioCfg] = useState<any>(null);
  const [captureCfg, setCaptureCfg] = useState<any>(null);
  const [primaryFunnelSlug, setPrimaryFunnelSlug] = useState<string | null>(null);
  const { slug: pathSlug } = useParams();

  useEffect(() => {
    trackPageView("/");
    trackFunnel("diag_landing_view");
    const params = new URLSearchParams(window.location.search);
    const utm = params.get("utm_source") || params.get("ref");

    // Pré-preenche form se o lead já preencheu nas últimas 24h (em qualquer rota Axtor).
    try {
      const saved = localStorage.getItem(LEAD_CACHE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.ts && Date.now() - parsed.ts < LEAD_CACHE_TTL_MS) {
          if (parsed.name) setName(parsed.name);
          if (parsed.email) setEmail(parsed.email);
          if (parsed.phone) setPhone(parsed.phone);
          if (parsed.country) setCountry(parsed.country);
          if (parsed.handle) setHandle(parsed.handle);
        }
      }
    } catch {}

    (async () => {
      // 1. Tentar carregar do Cache Local (Instantâneo, TTL 60s pra invalidar dado velho)
      const cacheKey = `bio-cache-${pathSlug || utm || "global"}`;
      const CACHE_TTL_MS = 60 * 1000;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed?.timestamp && Date.now() - parsed.timestamp < CACHE_TTL_MS && parsed.data) {
            setBioCfg(parsed.data);
          }
        } catch {} // cache corrompido ou formato antigo, ignora e busca fresh
      }

      // 2. Buscar atualização em segundo plano
      const slug = pathSlug || utm || "axtor-labs";
      // Usar RPC SECURITY DEFINER pra que anon consiga resolver tenant pelo slug
      // (RLS direta em tenants bloqueia leitura anônima)
      const { data: tenantRows } = await (supabase as any).rpc("resolve_tenant_by_slug", { _slug: slug });
      const t = Array.isArray(tenantRows) && tenantRows.length > 0 ? tenantRows[0] : null;

      if (t) {
        setTenant(t);
        applyTenantTheme(t.id); // lead vê a cor do dono do funil (igual o imersivo)
        const { data: bc } = await supabase
          .from("bio_config")
          .select("*")
          .eq("tenant_id", t.id)
          .maybeSingle();

        if (bc) {
          setBioCfg(bc);
          sessionStorage.setItem(cacheKey, JSON.stringify({ data: bc, timestamp: Date.now() }));
        }

        // Campos de conteúdo exclusivos da página de captura (fallback via bio_config se null)
        const { data: cc } = await (supabase as any)
          .from("tenant_capture_config")
          .select("capture_headline, capture_sub_headline, capture_tagline, capture_avatar_url")
          .eq("tenant_id", t.id)
          .maybeSingle();
        if (cc) setCaptureCfg(cc);

        // Resolve qual funil imersivo o lead deve cair ao clicar "Fazer Análise Completa".
        // Pega o mais recente publicado pro tenant carregado — antes era hardcoded pra Stefany.
        const { data: fnRows } = await supabase
          .from("deep_funnels")
          .select("slug")
          .eq("tenant_id", t.id)
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(1);
        if (fnRows && fnRows.length > 0) {
          setPrimaryFunnelSlug((fnRows[0] as any).slug);
        }
      }

      const partnerKey = pathSlug || utm;
      if (!partnerKey) return;
      const { data: rows } = await (supabase as any).rpc("get_landing_partner_ctas", { _utm_source: partnerKey });
      const row = Array.isArray(rows) ? rows[0] : null;
      if (row) setPartnerCtas(row as PartnerCtas);
    })();
  }, [pathSlug]);

  const handleSubmitHandle = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = handle.trim().replace(/^@+/, "").toLowerCase();
    // Instagram só permite letras, números, ponto e underline (1-30 chars)
    if (!/^[a-z0-9._]{1,30}$/.test(cleaned)) {
      toast.error("@ inválido. Use apenas letras, números, ponto e underline.");
      return;
    }
    setHandle(cleaned);
    trackFunnel("diag_handle_submit", { handle: cleaned });
    setStep("lead");
  };

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameCheck = validateName(name);
    if (!nameCheck.ok) {
      toast.error(nameCheck.error!);
      return;
    }
    const emailCheck = validateEmail(email);
    if (!emailCheck.ok) {
      toast.error(emailCheck.error!);
      return;
    }
    if (emailCheck.suggestion) {
      toast.error(`Quis dizer ${emailCheck.suggestion}?`);
      setEmail(emailCheck.suggestion);
      return;
    }
    const phoneCheck = validatePhone(phone, country);
    if (!phoneCheck.ok) {
      toast.error(phoneCheck.error!);
      return;
    }
    setStep("loading");
    trackFunnel("diag_lead_submit", { handle });

    // Salva o lead em localStorage pra reaproveitar no /d/funnel sem redigitar.
    try {
      localStorage.setItem(
        LEAD_CACHE_KEY,
        JSON.stringify({ name, email, phone, country, handle, ts: Date.now() }),
      );
    } catch {}

    // Anima as mensagens de loading
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % LOADING_STEPS.length;
      setLoadingMsg(LOADING_STEPS[i]);
    }, 2200);

    try {
      const dial = COUNTRIES.find((c) => c.code === country)!.dial;
      const fullPhone = `${dial} ${phone}`.trim();
      // Captura UTMs da URL pra atribuir o lead ao tenant parceiro correto
      const params = new URLSearchParams(window.location.search);
      const utm = {
        source: pathSlug || params.get("utm_source") || params.get("ref") || null,
        medium: params.get("utm_medium") || null,
        campaign: params.get("utm_campaign") || null,
      };
      const { data: result, error } = await supabase.functions.invoke("analyze-instagram", {
        body: {
          handle,
          email: email || null,
          phone: fullPhone,
          phone_country: country,
          full_name: name || null,
          utm,
        },
      });

      clearInterval(interval);

      if (error) throw error;
      if (!result) throw new Error("Sem resposta do servidor");

      setData(result);
      // Salva diagnostic_id da captura pra linkar com imersivo (parent_diagnostic_id)
      try {
        if (result?.diagnostic_id) {
          localStorage.setItem("axtor_last_diagnostic_id", String(result.diagnostic_id));
        }
      } catch {}

      if (result.status === "private_profile") {
        setStep("private");
        trackFunnel("diag_result_private", { handle, diagnostic_id: result.diagnostic_id ?? null });
      } else if (result.status === "rate_limited") {
        setStep("blocked");
      } else if (result.status === "completed") {
        // Se a IA não conseguiu pontuar (perfil vazio/inexistente), tratar como não encontrado
        const score = result?.diagnosis?.score_geral ?? 0;
        if (!result.profile?.username || score === 0) {
          setStep("not_found");
          trackFunnel("diag_result_failed", { handle, diagnostic_id: result.diagnostic_id ?? null });
        } else {
          setStep("result");
          trackFunnel("diag_result_view", { handle, diagnostic_id: result.diagnostic_id ?? null, meta: { score, cached: !!result.cached } });
        }
      } else if (result.status === "failed") {
        setStep("not_found");
        trackFunnel("diag_result_failed", { handle });
      } else {
        toast.error(result.error || "Não conseguimos analisar esse perfil agora.");
        setStep("handle");
      }
    } catch (err) {
      clearInterval(interval);
      toast.error(err instanceof Error ? err.message : "Erro ao gerar diagnóstico");
      setStep("lead");
    }
  };

  const reset = () => {
    setStep("handle");
    setData(null);
    setHandle("");
    setEmail("");
    setPhone("");
    setName("");
  };

  return (
    <div className="relative min-h-screen overflow-hidden grain">
      {/* Glow ambient */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <span className="font-display text-xl tracking-wide">Diagnóstico Premium</span>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-6 pb-24 pt-12 sm:pt-20 py-[40px]">
        {step === "handle" && <HandleStep handle={handle} setHandle={setHandle} onSubmit={handleSubmitHandle} bioCfg={bioCfg} captureCfg={captureCfg} tenant={tenant} partnerCtas={partnerCtas} />}
        {step === "lead" && (
          <LeadStep
            handle={handle}
            email={email} setEmail={setEmail}
            phone={phone} setPhone={setPhone}
            country={country} setCountry={setCountry}
            name={name} setName={setName}
            onSubmit={handleSubmitLead}
            onBack={() => setStep("handle")}
          />
        )}
        {step === "loading" && <LoadingStep message={loadingMsg} handle={handle} />}
        {step === "private" && data && <PrivateStep data={data} onRetry={reset} />}
        {step === "not_found" && <NotFoundStep handle={handle} onRetry={reset} />}
        {step === "blocked" && data && <BlockedStep data={data} />}
        {step === "result" && data && <ResultStep data={data} onRestart={reset} partnerCtas={partnerCtas} tenant={tenant} bioCfg={bioCfg} primaryFunnelSlug={primaryFunnelSlug} />}
      </main>

      <footer className="relative z-10 border-t border-gold/30 text-center text-xs uppercase tracking-[0.25em] text-muted-foreground py-[20px]">
        Diagnóstico Premium · feito para quem leva o digital a sério ·{" "}
        <Link to="/termos" className="transition-colors hover:text-primary">Termos</Link>
        {" "}·{" "}
        <Link to="/privacidade" className="transition-colors hover:text-primary">Privacidade</Link>
      </footer>
      <FeedbackWidget pagePath="/" />
    </div>
  );
};

/* ---------- STEPS ---------- */

const HandleStep = ({ handle, setHandle, onSubmit, bioCfg, captureCfg, tenant, partnerCtas }: any) => {
  const bioPhoto = captureCfg?.capture_avatar_url || bioCfg?.avatar_url || "";
  const bioName = bioCfg?.display_name || "";
  const headline = captureCfg?.capture_headline || bioCfg?.headline || "";
  const subHeadline = captureCfg?.capture_sub_headline || bioCfg?.sub_headline || "";
  const tagline =
    captureCfg?.capture_tagline ||
    "Para quem entendeu que presença digital não é sobre estar online.\nÉ sobre ser escolhido.";

  return (
    <div className="animate-fade-up text-center">
      <span className="sheen inline-flex items-center gap-2 rounded-full border border-gold bg-gradient-gold-soft px-5 py-2 text-xs uppercase tracking-[0.3em] text-primary backdrop-blur">
        <span>análise real · não é vitrine</span>
      </span>
      <h1 className="mt-8 font-display text-5xl leading-[1.05] sm:text-7xl">
        Descubra <span className="text-gold italic">exatamente</span><br />o que está travando<br />seu Instagram.
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
        Informe seu @ e nosso sistema te entregará um diagnóstico real do seu perfil, comparado com o seu nicho, em 30 segundos.
      </p>

      {/* Seção de Autoridade Dinâmica */}
      <div className="mt-16 mb-16 relative overflow-hidden rounded-[32px] bg-card/30 border border-gold/20 p-6 md:p-10 text-left">
        <div className="grid md:grid-cols-[280px_1fr] gap-8 items-center">
          <div className="relative flex justify-center">
            <div className="relative w-full aspect-[4/5] rounded-[32px] overflow-hidden shadow-2xl border border-gold/20">
              {bioPhoto ? (
                <img
                  src={bioPhoto}
                  alt={bioName}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-muted/60 to-muted/30 animate-pulse" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>
          </div>
          <div className="space-y-6">
            {bioCfg ? (
              <>
                <h3 className="font-display text-3xl leading-tight">
                  Quem é <span className="text-gold italic">{bioName}</span>?
                </h3>
                <div className="prose prose-invert prose-sm max-w-none">
                  <div className="space-y-4 text-sm leading-relaxed text-muted-foreground/90">
                    {headline ? (
                      <>
                        <p>
                          <span className="text-foreground font-medium">{bioName}</span> {headline}
                        </p>
                        {subHeadline.split(/\n\s*\n/).map((paragraph: string, i: number) => (
                          <p key={i}>{paragraph}</p>
                        ))}
                      </>
                    ) : (
                      <p className="text-muted-foreground">Nenhuma bio configurada.</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="h-8 bg-muted/50 rounded-lg animate-pulse w-48" />
                <div className="h-4 bg-muted/30 rounded animate-pulse w-full" />
                <div className="h-4 bg-muted/30 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-muted/30 rounded animate-pulse w-5/6" />
              </div>
            )}
            <div className="pt-2 border-t border-gold/10">
              <p className="text-xs font-medium italic text-foreground/80 leading-relaxed">
                "{tagline.split("\n").map((line: string, i: number, arr: string[]) => (
                  <span key={i}>
                    {i === arr.length - 1
                      ? <span className="text-gold">{line}</span>
                      : <>{line}<br /></>}
                  </span>
                ))}"
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mx-auto mt-12 max-w-xl">
        <div className="group relative flex items-center overflow-hidden rounded-full border-gold-gradient backdrop-blur transition-all focus-within:shadow-gold-lg">
          <span className="pl-5 text-2xl font-display text-primary">@</span>
          <Input
            value={handle}
            onChange={(e) =>
              setHandle(
                e.target.value
                  .replace(/^@+/, "")
                  .toLowerCase()
                  .replace(/[^a-z0-9._]/g, "")
                  .slice(0, 30),
              )
            }
            placeholder="seu_perfil"
            className="h-14 border-0 bg-transparent text-base font-light placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
            autoFocus
          />
          <Button type="submit" size="lg" className="btn-luxe m-1.5 h-11 shrink-0 gap-1.5 rounded-full px-4 text-xs font-semibold uppercase tracking-[0.1em] sm:px-6 sm:text-sm sm:tracking-[0.15em]">
            Analisar <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          100% gratuito · não pedimos sua senha · seu perfil precisa estar público
        </p>
      </form>

      <div className="mt-20 grid gap-6 sm:grid-cols-3">
        {[
          { icon: Target, title: "Posicionamento", desc: "Seu @ está atraindo o público certo?" },
          { icon: TrendingUp, title: "Conversão", desc: "Quanto você está deixando na mesa." },
          { icon: Zap, title: "Plano de ação", desc: "5 movimentos prioritários para você." },
        ].map((it) => (
          <div key={it.title} className="group rounded-[32px] border border-gold/20 bg-card/40 p-8 text-left backdrop-blur transition-all hover:-translate-y-1 hover:shadow-gold">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-gold-soft">
              <it.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="mt-6 font-display text-2xl text-card-foreground">{it.title}</h3>
            <p className="mt-2 text-sm font-light text-muted-foreground">{it.desc}</p>
          </div>
        ))}
      </div>

      {/* Ponte: do diagnóstico pro link-in-bio */}
      <div className="mt-12 rounded-[28px] border border-gold/20 bg-card/40 p-5 text-left backdrop-blur animate-gold-pulse sm:p-6">
        <span className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          {partnerCtas ? "Canais Oficiais" : "Bio fraca foi um dos pontos?"}
        </span>
        <h2 className="mt-2 font-display text-xl leading-tight sm:text-2xl">
          {partnerCtas
            ? <>Conecte-se com <span className="text-gold italic">{partnerCtas.display_name}</span></>
            : <>Crie uma bio <span className="text-gold italic">profissional</span> sem código.</>
          }
        </h2>
        <p className="mt-2 max-w-xl text-xs text-muted-foreground sm:text-sm">
          {partnerCtas
            ? "Acesse meus links oficiais, agende uma consultoria ou fale diretamente comigo pelo WhatsApp."
            : "Link-in-bio premium com analytics, campanhas com UTM e visual que converte. Comece grátis, suba pra Pro quando quiser desbloquear tudo."
          }
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {partnerCtas ? (
            <>
              {partnerCtas.bio_url && (
                <a
                  href={normalizeWhatsappUrl(partnerCtas.bio_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-luxe inline-flex h-11 items-center gap-2 rounded-full px-5 text-xs font-semibold uppercase tracking-[0.15em]"
                >
                  Ver meus links <ExternalLink className="h-4 w-4" />
                </a>
              )}
              {partnerCtas.whatsapp_number && (
                <a
                  href={normalizeWhatsappUrl(`https://wa.me/${partnerCtas.whatsapp_number}?text=${encodeURIComponent(partnerCtas.whatsapp_message || "")}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-gold bg-card/40 px-5 text-xs uppercase tracking-[0.15em] text-primary transition-all hover:shadow-gold"
                >
                  WhatsApp <MessageCircle className="h-4 w-4" />
                </a>
              )}
              {partnerCtas.secondary_cta_label && partnerCtas.secondary_cta_url && (
                <a
                  href={normalizeWhatsappUrl(partnerCtas.secondary_cta_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 text-xs uppercase tracking-[0.15em] text-foreground transition-all hover:bg-white/10"
                >
                  {partnerCtas.secondary_cta_label} <ArrowRight className="h-4 w-4" />
                </a>
              )}
            </>
          ) : (
            <>
              <Link
                to="/signup"
                className="btn-luxe inline-flex h-11 items-center gap-2 rounded-full px-5 text-xs font-semibold uppercase tracking-[0.15em]"
              >
                Criar minha bio grátis <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/joanderson"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-gold bg-card/40 px-5 text-xs uppercase tracking-[0.15em] text-primary transition-all hover:shadow-gold"
              >
                Ver exemplo real
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const LeadStep = ({ handle, email, setEmail, phone, setPhone, country, setCountry, name, setName, onSubmit, onBack }: any) => {
  const emailSuggestion = email ? suggestEmailDomain(email) : null;
  const selected = COUNTRIES.find((c) => c.code === country) ?? COUNTRIES[0];
  return (
  <div className="animate-fade-up mx-auto max-w-lg">
    <button onClick={onBack} className="mb-6 text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-primary">
      ← Voltar
    </button>
    <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-primary">
      <Instagram className="h-3 w-3" /> @{handle}
    </span>
    <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
      Onde você quer<br />receber seu <span className="text-gold italic">diagnóstico</span>?
    </h2>
    <p className="mt-4 text-muted-foreground">
      Vamos enviar o relatório completo e seu plano de ação. Sem spam, palavra.
    </p>

    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <div>
        <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">Nome completo</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value.replace(/[^a-zA-ZáàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ '-]/g, "").slice(0, 80))}
          placeholder="Nome e sobrenome"
          autoComplete="name"
          className="h-11 rounded-full border-gold bg-input font-light"
        />
      </div>
      <div>
        <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">Email</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value.replace(/\s/g, "").slice(0, 120))}
          placeholder="voce@exemplo.com"
          autoComplete="email"
          inputMode="email"
          className="h-11 rounded-full border-gold bg-input font-light"
        />
        {emailSuggestion && (
          <button
            type="button"
            onClick={() => setEmail(emailSuggestion)}
            className="mt-2 text-xs text-primary underline-offset-2 hover:underline"
          >
            Quis dizer <span className="font-medium">{emailSuggestion}</span>?
          </button>
        )}
      </div>
      <div>
        <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">WhatsApp</label>
        <div className="flex gap-2">
          <Select
            value={country}
            onValueChange={(v: CountryCode) => {
              setCountry(v);
              setPhone(maskPhone(phone, v));
            }}
          >
            <SelectTrigger className="h-11 w-[88px] shrink-0 rounded-full border-gold bg-input px-3 font-light">
              <SelectValue>
                <span className="flex items-center gap-1.5">
                  <span>{selected.flag}</span>
                  <span>{selected.dial}</span>
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  <span className="flex items-center gap-2">
                    <span>{c.flag}</span>
                    <span className="font-medium">{c.dial}</span>
                    <span className="text-muted-foreground">{c.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(maskPhone(e.target.value, country))}
            placeholder={country === "BR" ? "(11) 98765-4321" : "Número"}
            autoComplete="tel-national"
            inputMode="numeric"
            className="h-11 flex-1 rounded-full border-gold bg-input font-light"
          />
        </div>
      </div>

      <Button type="submit" size="lg" className="btn-luxe h-12 w-full gap-2 rounded-full text-sm font-semibold uppercase tracking-[0.15em] animate-gold-pulse">
        Gerar meu diagnóstico agora <ArrowRight className="h-4 w-4" />
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Ao continuar você concorda em receber seu relatório por email/WhatsApp.
      </p>
    </form>
  </div>
  );
};

const LoadingStep = ({ message, handle }: { message: string; handle: string }) => (
  <div className="animate-fade-up flex min-h-[60vh] flex-col items-center justify-center text-center">
    <div className="relative">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
      <div className="absolute inset-0 -z-10 rounded-full bg-primary/20 blur-2xl" />
    </div>
    <p className="mt-8 text-xs uppercase tracking-[0.3em] text-muted-foreground">Analisando @{handle}</p>
    <p className="mt-4 min-h-[2rem] font-display text-2xl text-gold transition-all sm:text-3xl">
      {message}
    </p>
    <div className="mt-8 h-[2px] w-64 overflow-hidden rounded-full bg-muted">
      <div className="h-full animate-shimmer" />
    </div>
  </div>
);

const PrivateStep = ({ data, onRetry }: { data: DiagnosisData; onRetry: () => void }) => (
  <div className="animate-fade-up mx-auto max-w-xl text-center">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold bg-card">
      <Lock className="h-7 w-7 text-primary" />
    </div>
    <h2 className="mt-6 font-display text-4xl">Seu perfil está <span className="text-gold italic">privado</span></h2>
    <p className="mt-4 text-muted-foreground">
      Já salvamos seus dados. Vamos te avisar assim que rodarmos a análise. Para gerar o diagnóstico real <strong>agora</strong>, abra seu perfil temporariamente:
    </p>
    <div className="mt-8 rounded-[32px] border-gold-gradient p-6 text-left text-sm font-light">
      <ol className="space-y-3 text-muted-foreground">
        <li><span className="text-primary">1.</span> Abra o app do Instagram → Configurações</li>
        <li><span className="text-primary">2.</span> Privacidade → desmarque "Conta privada"</li>
        <li><span className="text-primary">3.</span> Volte aqui e clique em <strong className="text-foreground">Tentar de novo</strong></li>
        <li><span className="text-primary">4.</span> Depois é só voltar para privado, se preferir</li>
      </ol>
    </div>
    <Button onClick={onRetry} size="lg" className="btn-luxe mt-8 h-12 gap-2 rounded-full px-8 text-sm font-semibold uppercase tracking-[0.15em]">
      Tentar de novo <ArrowRight className="h-4 w-4" />
    </Button>
  </div>
);

const NotFoundStep = ({ handle, onRetry }: { handle: string; onRetry: () => void }) => (
  <div className="animate-fade-up mx-auto max-w-xl text-center">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold bg-card">
      <SearchX className="h-7 w-7 text-primary" />
    </div>
    <h2 className="mt-6 font-display text-4xl">
      Não encontramos <span className="text-gold italic">@{handle}</span>
    </h2>
    <p className="mt-4 text-muted-foreground">
      Esse perfil não existe ou está indisponível no Instagram. Verifique se o @ está escrito corretamente, sem espaços, acentos ou caracteres especiais.
    </p>
    <div className="mt-8 rounded-[32px] border-gold-gradient p-6 text-left text-sm font-light">
      <ol className="space-y-3 text-muted-foreground">
        <li><span className="text-primary">1.</span> Abra o Instagram e copie seu @ exato</li>
        <li><span className="text-primary">2.</span> Confira se o perfil está público</li>
        <li><span className="text-primary">3.</span> Volte aqui e tente novamente</li>
      </ol>
    </div>
    <Button onClick={onRetry} size="lg" className="btn-luxe mt-8 h-12 gap-2 rounded-full px-8 text-sm font-semibold uppercase tracking-[0.15em]">
      Tentar de novo <ArrowRight className="h-4 w-4" />
    </Button>
  </div>
);

const BlockedStep = ({ data }: { data: DiagnosisData }) => {
  const unlocks = data.unlocks_at ? new Date(data.unlocks_at) : null;
  const fmt = unlocks
    ? unlocks.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" }) +
      " às " +
      unlocks.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : "em breve";
  return (
    <div className="animate-fade-up mx-auto max-w-xl text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold bg-card">
        <Clock className="h-7 w-7 text-primary" />
      </div>
      <h2 className="mt-6 font-display text-4xl">
        Esse perfil já foi <span className="text-gold italic">analisado 3x</span> essa semana
      </h2>
      <p className="mt-4 text-muted-foreground">
        {data.message ||
          "Pra manter a qualidade da análise (e não te dar o mesmo diagnóstico em loop), liberamos no máximo 3 análises por semana pelo mesmo @."}
      </p>
      <div className="mt-8 rounded-[32px] border-gold-gradient p-6 text-left text-sm font-light">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Próxima liberação</p>
        <p className="mt-2 font-display text-2xl text-gold">{fmt}</p>
      </div>
      <p className="mt-8 text-xs uppercase tracking-[0.25em] text-muted-foreground">
        enquanto isso, espalha pra rede
      </p>
      <div className="mt-4">
        <ShareButton handle={data.handle} />
      </div>
    </div>
  );
};

const ShareButton = ({
  diagnosticId,
  handle,
  score,
}: {
  diagnosticId?: string;
  handle?: string;
  score?: number;
}) => {
  const [copied, setCopied] = useState(false);
  const url = diagnosticId
    ? `${PUBLIC_BASE_URL}/d/${diagnosticId}`
    : PUBLIC_BASE_URL;
  const text = score
    ? `Acabei de descobrir que meu Instagram tá com nota ${score}/100 nesse diagnóstico. Faz o seu, é em 30 segundos:`
    : `Faz o diagnóstico do seu Instagram em 30 segundos:`;
  const waMsg = encodeURIComponent(`${text} ${url}`);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não consegui copiar");
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
      <a
        href={`https://wa.me/?text=${waMsg}`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-luxe inline-flex h-12 items-center gap-2 rounded-full px-6 text-xs font-semibold uppercase tracking-[0.15em]"
      >
        <Share2 className="h-4 w-4" /> Compartilhar no WhatsApp
      </a>
      <button
        onClick={copy}
        className="inline-flex h-12 items-center gap-2 rounded-full border border-gold bg-card/40 px-5 text-xs font-semibold uppercase tracking-[0.15em] text-primary transition-all hover:bg-gradient-gold-soft"
      >
        {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
        {copied ? "Copiado" : "Copiar link"}
      </button>
    </div>
  );
};

const ResultStep = ({ data, onRestart, partnerCtas, tenant, bioCfg, primaryFunnelSlug }: { data: DiagnosisData; onRestart: () => void; partnerCtas: PartnerCtas | null; tenant: any; bioCfg: any; primaryFunnelSlug: string | null }) => {
  const d = data.diagnosis!;
  const p = data.profile!;
  const score = d.score_geral ?? 0;

  // Resolve CTAs: parceiro > bio do tenant (sem defaults pessoais)
  const ORIGIN = PUBLIC_BASE_URL;

  // NOME: Parceiro > Bio Config > Tenant (sem fallback pessoal)
  const partnerName = partnerCtas?.display_name?.split(" ")[0]
    || bioCfg?.display_name?.split(" ")[0]
    || tenant?.name?.split(" ")[0]
    || "";

  const bioHref = partnerCtas
    ? (partnerCtas.bio_url || `${ORIGIN}/${partnerCtas.slug}`)
    : "/bio";

  const bioLabel = `Ver bio de ${partnerName}`;

  // INSTAGRAM: Parceiro > Bio Config (sem fallback pessoal). Sem handle = esconde o bloco.
  const igHandleRaw = partnerCtas?.instagram_handle || bioCfg?.instagram_handle || "";
  const igHandle = igHandleRaw.replace(/^@+/, "");
  const igHref = igHandle ? `https://instagram.com/${igHandle}` : null;
  const igOwnerLabel = partnerName ? `a ${partnerName}` : "a gente";

  // WHATSAPP: Parceiro > Tenant (sem fallback pessoal). Sem número = botão escondido.
  const waNumber = (partnerCtas?.whatsapp_number || tenant?.whatsapp_number || "").replace(/\D/g, "");
  const waMessage = partnerCtas?.whatsapp_message
    || bioCfg?.whatsapp_message
    || "Acabei de fazer o diagnóstico e quero estratégia personalizada";

  const waHref = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}` : null;

  const secondaryCta = partnerCtas?.secondary_cta_url
    ? { label: partnerCtas.secondary_cta_label || "Saiba mais", url: partnerCtas.secondary_cta_url }
    : null;

  const isPartner = !!partnerCtas;
  // Upsell do Axtor (criar a propria bio) aparece em contas FREE e na(s)
  // conta(s) de divulgacao do Axtor. Conta paga = funil white-label, sem upsell.
  const SHOWCASE_SLUGS = ["axtor-labs"];
  const isFreePlan =
    !tenant?.plan || tenant.plan === "free" || SHOWCASE_SLUGS.includes(tenant?.slug ?? "");

  return (
    <div className="animate-fade-up space-y-12">
      {/* Resultado — card principal (perfil + nota). Sub-notas flutuam abaixo. */}
      <div className="relative overflow-hidden rounded-[32px] border-gold-gradient p-6 text-center shadow-deep sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-gold-soft opacity-40" />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative space-y-8">

          {/* Perfil */}
          <div className="flex flex-col items-center gap-3">
            {p.profilePicUrl && (
              <div className="relative">
                <img
                  src={proxied(p.profilePicUrl)}
                  alt={p.username}
                  className="h-20 w-20 rounded-2xl border border-primary/40 object-cover"
                  onError={(e) => ((e.currentTarget.style.display = "none"))}
                />
                <div className="absolute -inset-1 -z-10 rounded-2xl bg-primary/20 blur-xl" />
              </div>
            )}
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">diagnóstico de</p>
              <h2 className="mt-1 break-all font-display text-2xl leading-none sm:text-3xl">@{p.username}</h2>
              {p.fullName && <p className="mt-1 text-sm text-muted-foreground">{p.fullName}</p>}
            </div>
            <div className="flex gap-10">
              <Stat label="Seguidores" value={fmt(p.followersCount)} />
              <Stat label="Posts" value={fmt(p.postsCount)} />
            </div>
          </div>

          {/* Nota geral */}
          <div className="border-t border-gold/15 pt-8">
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Seu resultado</p>
            <div className="mt-2 font-display text-7xl leading-none text-gold sm:text-8xl">{score}</div>
            <p className="text-sm text-muted-foreground">de 100</p>
            {d.veredicto && (
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-foreground/90 sm:text-lg">
                {d.veredicto}
              </p>
            )}
          </div>

        </div>
      </div>

      {/* Sub-notas flutuando — cards separados, fora do card principal */}
      {Object.keys(d.scores ?? {}).length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {Object.entries(d.scores ?? {}).map(([key, val]) => (
            <div
              key={key}
              className="rounded-2xl border border-gold/15 bg-card/40 p-3 text-center backdrop-blur sm:p-4"
            >
              <div className="font-display text-2xl leading-none text-gold sm:text-3xl">{val}</div>
              <p className="mt-1.5 text-[9px] uppercase leading-tight tracking-[0.1em] text-muted-foreground sm:text-[10px]">
                {labelFor(key)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Pontos fortes / gaps */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card title="O que está funcionando" icon={CheckCircle2} items={d.pontos_fortes} accent="text-primary" />
        <Card title="Onde você está perdendo dinheiro" icon={AlertTriangle} items={d.gaps_criticos} accent="text-destructive" />
      </div>

      {/* Plano de ação */}
      <div className="rounded-[32px] border border-gold/20 bg-card/30 p-8">
        <h3 className="font-display text-2xl">Seu plano de ação <span className="text-gold">priorizado</span></h3>
        <ol className="mt-6 space-y-4">
          {d.plano_acao?.map((step, i) => (
            <li key={i} className="flex gap-4 border-b border-border/50 pb-4 last:border-0">
              <span className="font-display text-3xl text-primary">{String(i + 1).padStart(2, "0")}</span>
              <p className="flex-1 pt-2 text-foreground/90">{step}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Bio Preview — upsell do Axtor: SO em contas free / divulgacao */}
      {isFreePlan && (
      <div className="relative overflow-hidden rounded-[32px] border border-gold/30 bg-card/40 backdrop-blur-xl p-8 sm:p-10">
        <div className="pointer-events-none absolute inset-0 bg-gradient-gold-soft opacity-20" />
        <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-start">

          {/* Mock de bio — mini celular realista (estilo do mockup da /vendas) */}
          <div className="mx-auto w-full max-w-[210px] shrink-0">
            <div className="relative aspect-[9/19] w-full rounded-[2rem] border border-primary/20 bg-black p-2 shadow-[0_30px_70px_-25px_rgba(0,0,0,0.9)]">
              <div className="absolute left-1/2 top-2 z-10 h-4 w-14 -translate-x-1/2 rounded-b-lg bg-black" />
              <div className="h-full w-full overflow-hidden rounded-[1.5rem] bg-[radial-gradient(ellipse_at_top,hsl(var(--card)),hsl(var(--background)))] px-4 pt-7">
                <div className="flex flex-col items-center gap-2.5 text-center">
                  <img
                    src="/mockup/leandro_av.webp"
                    alt="Leandro Hucman"
                    className="h-14 w-14 rounded-2xl border border-primary/40 object-cover"
                  />
                  <div>
                    <p className="font-display text-sm leading-tight text-foreground">Leandro Hucman</p>
                    <p className="text-[10px] text-muted-foreground">@leandrohucman</p>
                  </div>
                  <div className="mt-1 w-full space-y-2">
                    <div className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-primary-glow shadow-[0_6px_16px_-6px_hsl(var(--primary)/0.6)] animate-gold-pulse">
                      <MessageCircle className="h-3.5 w-3.5 text-primary-foreground" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-primary-foreground">Falar no WhatsApp</span>
                    </div>
                    <div className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-white/[0.03]">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[10px] uppercase tracking-[0.1em] text-foreground/75">Agendar agora</span>
                    </div>
                    <div className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-white/[0.03]">
                      <Zap className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[10px] uppercase tracking-[0.1em] text-foreground/75">Diagnóstico grátis</span>
                    </div>
                  </div>
                  <p className="mt-1 text-[8px] uppercase tracking-[0.2em] text-muted-foreground/40">axtor.space/leandrohucman</p>
                </div>
              </div>
            </div>
          </div>

          {/* Copy + CTAs */}
          <div className="flex flex-1 flex-col justify-center gap-5">
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">você também pode ter</span>
              <h3 className="mt-2 font-display text-3xl leading-tight">
                Seu próprio <span className="text-gold italic">diagnóstico de captura</span>, no seu link na bio.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Foi isso que você acabou de viver. Crie o seu: um link na bio que captura, qualifica e direciona cada visitante, no seu nicho.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm text-foreground/80">
                <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Publicado no seu domínio (axtor.space/@{p.username}) em segundos</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-foreground/80">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Um diagnóstico que conduz cada visitante ao próximo passo</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-foreground/80">
                <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Leads qualificados, com contexto, na sua mão</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/signup"
                className="btn-luxe inline-flex h-12 items-center justify-center gap-2 rounded-xl px-7 text-xs font-bold uppercase tracking-[0.15em]"
              >
                Criar o meu grátis <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/planos"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-gold/40 bg-transparent px-6 text-xs font-semibold uppercase tracking-[0.15em] text-gold transition-colors hover:bg-gold/5"
              >
                Ver planos
              </Link>
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50">
              grátis para começar · sem cartão de crédito
            </p>
          </div>
        </div>
      </div>
      )}

      {/* CTA final — Transição estratégica para o Funil Profundo */}
      <div className="relative overflow-hidden rounded-[32px] border border-gold/40 bg-card/40 p-6 text-center sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-gold-soft opacity-40" />
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/5 px-4 py-1.5 text-[10px] uppercase tracking-[0.3em] text-gold font-medium">
            <Sparkles className="h-3 w-3" /> Análise de Perfil Concluída
          </span>
          <h3 className="mt-4 font-display text-2xl leading-tight sm:text-3xl">
            A análise do seu perfil é apenas a <span className="text-gold italic">ponta do iceberg</span>.
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground leading-relaxed sm:text-base">
            Agora, leve apenas <span className="text-foreground font-bold">2 minutos</span> para fazer sua <span className="text-gold italic">Análise Estratégica Completa</span> e ter clareza dos próximos passos de escala.
          </p>

          <div className="mx-auto mt-6 flex max-w-md flex-col items-stretch gap-4">
            <Button
              size="lg"
              className="btn-luxe h-14 w-full gap-3 rounded-xl text-xs font-bold uppercase tracking-[0.2em] animate-gold-pulse"
              asChild
            >
              {primaryFunnelSlug ? (
                <Link to={`/d/funnel/${primaryFunnelSlug}`}>
                  Fazer Análise Completa (2 min) <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <a href={waHref ?? bioHref} target="_blank" rel="noopener noreferrer">
                  {partnerName ? `Falar com ${partnerName}` : "Falar agora"} <ArrowRight className="h-4 w-4" />
                </a>
              )}
            </Button>

            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">
              recomendado para quem busca escala e autoridade real
            </p>
          </div>

          {igHref && (
          <div className="mx-auto mt-6 flex max-w-md items-center gap-4 rounded-2xl border border-gold/20 bg-background/40 p-4 text-left">
            <Instagram className="h-5 w-5 shrink-0 text-gold" />
            <div className="flex-1 text-xs">
              <p className="font-medium text-foreground">Gostou desse primeiro diagnóstico?</p>
              <p className="font-light text-muted-foreground">Segue {igOwnerLabel} no Instagram para insights diários.</p>
            </div>
            <a
              href={igHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-gold/30 bg-gold/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gold transition-all hover:bg-gold/10"
            >
              Seguir
            </a>
          </div>
          )}

          <div className="mt-6 opacity-60 grayscale hover:grayscale-0 transition-all">
            <ShareButton diagnosticId={data.diagnostic_id} handle={p.username} score={score} />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- helpers ---------- */

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="font-display text-4xl font-light leading-none text-primary">{value}</div>
    <div className="mt-2 text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">{label}</div>
  </div>
);

const ScoreBar = ({ label, value }: { label: string; value: number }) => (
  <div>
    <div className="mb-1 flex justify-between text-sm">
      <span className="text-foreground/80">{label}</span>
      <span className="font-display text-primary">{value}/100</span>
    </div>
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div
        className="h-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-1000"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  </div>
);

const Card = ({ title, icon: Icon, items, accent }: any) => (
  <div className="rounded-[32px] border border-gold/20 bg-card/60 p-8">
    <div className="flex items-center gap-2">
      <Icon className={`h-5 w-5 ${accent}`} />
      <h3 className="font-display text-xl">{title}</h3>
    </div>
    <ul className="mt-4 space-y-3">
      {items?.map((it: string, i: number) => (
        <li key={i} className="flex gap-3 text-sm text-foreground/85">
          <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${accent.replace("text-", "bg-")}`} />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  </div>
);

const fmt = (n: number | undefined) => {
  if (!n && n !== 0) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
};

const labelFor = (key: string) => {
  const map: Record<string, string> = {
    posicionamento: "Posicionamento",
    bio_e_cta: "Bio e CTA",
    consistencia: "Consistência",
    engajamento: "Engajamento",
    conversao: "Conversão",
  };
  return map[key] ?? key;
};

export default Index;
