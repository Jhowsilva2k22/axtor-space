import { useEffect, useState, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MessageCircle, Sparkles, ArrowRight, Check, Clock, Users, Cog, Star, ShieldCheck } from "lucide-react";
import { getSessionId, captureUtm } from "@/lib/analytics";
import { applyTenantTheme } from "@/lib/applyTenantTheme";
import { motion, AnimatePresence } from "framer-motion";
import { COUNTRIES, maskPhone, type CountryCode, suggestEmailDomain } from "@/lib/validators";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Funnel = any;
type Question = any;

export default function DeepFunnelPublic() {
  const { slug } = useParams();
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"welcome" | "lead" | "quiz" | "loading" | "result">("welcome");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [scores, setScores] = useState<Record<string, number>>({ marketing: 0, gestao: 0, vendas: 0, ia: 0, estrutura: 0 });
  const [lead, setLead] = useState({ name: "", email: "", phone: "", instagram_handle: "" });
  const [country, setCountry] = useState<CountryCode>("BR");
  const [result, setResult] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [mediaEnded, setMediaEnded] = useState(false);
  const [skipCountdown, setSkipCountdown] = useState(0);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);

  useEffect(() => {
    (async () => {
      if (!slug) return;
      const { data: f } = await supabase.from("deep_funnels").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
      if (!f) { setLoading(false); return; }
      const [{ data: qs }, { data: t }, { data: bioCfg }] = await Promise.all([
        supabase.from("deep_funnel_questions").select("*").eq("funnel_id", f.id).order("position"),
        supabase.from("tenants").select("display_name, whatsapp_number").eq("id", f.tenant_id).maybeSingle(),
        supabase.from("bio_config").select("avatar_url").eq("tenant_id", f.tenant_id).maybeSingle(),
      ]);
      setFunnel(f);
      setQuestions(qs ?? []);
      setTenant({ ...t, global_avatar_url: bioCfg?.avatar_url });
      setLoading(false);
      // Herda tema da bio do dono — funil fica visualmente coerente com a marca
      void applyTenantTheme(f.tenant_id);
    })();
  }, [slug]);

  // Reset media lock when question changes
  useEffect(() => {
    setMediaEnded(false);
    setSkipCountdown(0);
    const q = questions[current];
    if (q?.media_url && (q.lock_until_media_ends || funnel?.lock_until_media_ends)) {
      const skipAfter = q.allow_skip_after_seconds ?? funnel?.allow_skip_after_seconds ?? 5;
      if (skipAfter > 0) {
        setSkipCountdown(skipAfter);
        const interval = setInterval(() => {
          setSkipCountdown((s) => {
            if (s <= 1) { clearInterval(interval); return 0; }
            return s - 1;
          });
        }, 1000);
        return () => clearInterval(interval);
      }
    }
  }, [current, step, questions, funnel]);

  const handleAnswer = (q: Question, optionIdx: number | number[]) => {
    const newScores = { ...scores };
    const idxs = Array.isArray(optionIdx) ? optionIdx : [optionIdx];
    idxs.forEach((i) => {
      const opt = q.options[i];
      if (opt?.pain_weights) {
        for (const [k, v] of Object.entries(opt.pain_weights as Record<string, number>)) {
          newScores[k] = (newScores[k] ?? 0) + (v as number);
        }
      }
    });
    setScores(newScores);
    setAnswers({ ...answers, [q.id]: { option_indexes: idxs, label: idxs.map((i) => q.options[i]?.label) } });

    if (current < questions.length - 1) {
      setTimeout(() => setCurrent(current + 1), 280);
    } else {
      void submit(newScores, { ...answers, [q.id]: { option_indexes: idxs } });
    }
  };

  const submit = async (finalScores: Record<string, number>, finalAnswers: Record<string, any>) => {
    setStep("loading");
    const utm = captureUtm();
    try {
      const { data, error } = await supabase.functions.invoke("analyze-deep", {
        body: {
          funnel_id: funnel.id,
          answers: finalAnswers,
          pain_scores: finalScores,
          session_id: getSessionId(),
          ...lead,
          ...utm,
        },
      });
      if (error) throw error;
      setResult(data);
      setStep("result");
    } catch (e) {
      console.error(e);
      setStep("result");
      setResult({ error: true });
    }
  };

  // Helpers per-produto (suportam result.products array, com fallback pro result.product antigo)
  const productList: any[] = useMemo(() => {
    if (Array.isArray(result?.products) && result.products.length > 0) return result.products;
    if (result?.product) return [result.product];
    return [];
  }, [result]);

  const buildWhatsappUrl = (product: any) => {
    if (!product || !tenant?.whatsapp_number) return null;
    const tpl: string = product.whatsapp_template || `Olá! Sou o(a) {{nome}} e acabei de finalizar o diagnóstico. Quero entender melhor como funciona o ${product.name}.`;
    const firstName = lead.name.split(' ')[0] || "";
    const msg = tpl.replace(/\{\{nome\}\}/gi, firstName);
    const number = (tenant.whatsapp_number ?? "").replace(/\D/g, "");
    if (!number) return null;
    return `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
  };

  const buildCheckoutUrl = (product: any) => {
    if (!product?.checkout_url) return null;
    try {
      const url = new URL(product.checkout_url);
      if (lead.email) url.searchParams.set("email", lead.email);
      if (lead.name) url.searchParams.set("name", lead.name);
      if (lead.phone) url.searchParams.set("phone", lead.phone);
      if (result?.diagnostic_id) url.searchParams.set("diag", result.diagnostic_id);
      return url.toString();
    } catch {
      return product.checkout_url;
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!funnel) return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Funil não encontrado.</p></div>;

  const q = questions[current];
  const mediaLocked = q?.media_url && (q.lock_until_media_ends || funnel.lock_until_media_ends) && !mediaEnded && skipCountdown > 0;

  return (
    <div className="relative min-h-screen grain overflow-x-hidden">
      <div className="aurora-a opacity-40" />
      <div className="aurora-b opacity-40" />

      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-8">
        {step === "welcome" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col gap-6">
            <Card className="relative space-y-6 overflow-hidden rounded-[32px] border-gold/20 bg-card/40 p-10 shadow-2xl backdrop-blur-xl">
              <div className="inline-flex items-center gap-2 self-start rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-[10px] uppercase tracking-wider text-gold">
                <Sparkles className="h-3 w-3" /> Diagnóstico Profissional
              </div>
              <h1 className="font-display text-4xl leading-tight md:text-5xl">{funnel.name}</h1>
              {funnel.welcome_media_url && (
                <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15, duration: 0.4 }} className="overflow-hidden rounded-[24px] border border-gold/10 shadow-lg">
                  {funnel.welcome_media_type === "video" && <video src={funnel.welcome_media_url} controls className="w-full" />}
                  {funnel.welcome_media_type === "audio" && <audio src={funnel.welcome_media_url} controls className="w-full" />}
                  {funnel.welcome_media_type === "image" && <img src={funnel.welcome_media_url} alt="" className="w-full" />}
                </motion.div>
              )}
              <p className="whitespace-pre-line text-lg leading-relaxed text-muted-foreground/80">{funnel.welcome_text}</p>
              <Button size="lg" className="btn-luxe h-14 rounded-full px-10 text-xs font-bold uppercase tracking-[0.2em] transition-transform hover:scale-[1.02] animate-gold-pulse" onClick={() => setStep("lead")}>
                Começar agora <ArrowRight className="h-4 w-4" />
              </Button>
            </Card>
          </motion.div>
        )}

        {step === "lead" && (
          <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}>
            <Card className="relative space-y-8 rounded-[32px] border border-gold/20 bg-card/40 p-8 shadow-2xl backdrop-blur-xl md:p-12">
              <div className="space-y-3">
                <h2 className="font-display text-4xl leading-tight sm:text-5xl">
                  Onde enviamos seu <span className="text-gold italic text-shadow-gold">diagnóstico</span>?
                </h2>
                <p className="text-muted-foreground/80">
                  Relatório completo e plano de ação detalhado para o seu negócio.
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/80">Nome completo</label>
                  <Input
                    value={lead.name}
                    onChange={(e) => setLead({ ...lead, name: e.target.value.replace(/[^a-zA-ZáàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ '-]/g, "").slice(0, 80) })}
                    placeholder="Stefany Mello"
                    className="h-11 rounded-full border-gold/20 bg-card/30 px-5 font-light transition-all focus:border-gold/50 focus:shadow-gold/10"
                  />
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/80">Email profissional</label>
                    <Input
                      type="email"
                      value={lead.email}
                      onChange={(e) => setLead({ ...lead, email: e.target.value.toLowerCase() })}
                      placeholder="voce@exemplo.com"
                      className="h-11 rounded-full border-gold/20 bg-card/30 px-5 font-light transition-all focus:border-gold/50 focus:shadow-gold/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/80">WhatsApp</label>
                    <div className="flex gap-2">
                      <Select value={country} onValueChange={(v: CountryCode) => setCountry(v)}>
                        <SelectTrigger className="h-11 w-[88px] rounded-full border-gold/20 bg-card/30 px-3 transition-all focus:border-gold/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-gold/20 bg-card/90 backdrop-blur-xl">
                          {COUNTRIES.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              {c.flag} {c.dial}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="tel"
                        value={lead.phone}
                        onChange={(e) => setLead({ ...lead, phone: maskPhone(e.target.value, country) })}
                        placeholder="(00) 00000-0000"
                        className="h-11 flex-1 rounded-full border-gold/20 bg-card/30 px-5 font-light transition-all focus:border-gold/50 focus:shadow-gold/10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/80">Instagram @ (Opcional)</label>
                  <Input
                    value={lead.instagram_handle}
                    onChange={(e) => setLead({ ...lead, instagram_handle: e.target.value.replace(/[^a-zA-Z0-9._]/g, "").slice(0, 30) })}
                    placeholder="@seu.perfil"
                    className="h-11 rounded-full border-gold/20 bg-card/30 px-5 font-light transition-all focus:border-gold/50 focus:shadow-gold/10"
                  />
                </div>
              </div>

              <Button
                size="lg"
                className="btn-luxe h-14 w-full rounded-full text-xs font-bold uppercase tracking-[0.2em] transition-transform hover:scale-[1.02] animate-gold-pulse"
                onClick={() => {
                  if (!lead.name?.trim()) {
                    toast.error("Preencha seu nome antes de continuar.");
                    return;
                  }
                  if (!lead.email.includes("@")) {
                    toast.error("Digite um email válido.");
                    return;
                  }
                  if (lead.phone.replace(/\D/g, "").length < 10) {
                    toast.error("Confira o número do WhatsApp.");
                    return;
                  }
                  setStep("quiz");
                }}
              >
                Continuar para o diagnóstico <ArrowRight className="h-4 w-4" />
              </Button>
            </Card>
          </motion.div>
        )}

        {step === "quiz" && q && (
          <Card className="space-y-6 p-6 md:p-8 overflow-hidden">
            <div className="space-y-2">
              <Progress value={((current + 1) / questions.length) * 100} className="h-1" />
              <p className="text-xs text-muted-foreground">Pergunta {current + 1} de {questions.length}</p>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <h2 className="font-display text-2xl leading-tight">{q.question_text}</h2>
                  {q.subtitle && <p className="text-sm text-muted-foreground">{q.subtitle}</p>}
                </div>
                {q.media_url && (
                  <motion.div
                    initial={{ scale: 0.97, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.35 }}
                    className="space-y-1"
                  >
                    {q.media_caption && <p className="text-xs text-muted-foreground">{q.media_caption}</p>}
                    <div className="overflow-hidden rounded-2xl border">
                      {q.media_type === "video" && (
                        <video ref={mediaRef as any} src={q.media_url} controls autoPlay className="w-full" onEnded={() => setMediaEnded(true)} />
                      )}
                      {q.media_type === "audio" && (
                        <audio ref={mediaRef as any} src={q.media_url} controls autoPlay className="w-full" onEnded={() => setMediaEnded(true)} />
                      )}
                      {q.media_type === "image" && <img src={q.media_url} alt="" className="w-full" />}
                    </div>
                    {mediaLocked && skipCountdown > 0 && (
                      <p className="text-xs text-muted-foreground">Opções liberam em {skipCountdown}s ou ao fim da mídia…</p>
                    )}
                  </motion.div>
                )}
                <div className="space-y-3">
                  {Array.isArray(q.options) && q.options.map((o: any, oi: number) => (
                    <motion.button
                      key={oi}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + oi * 0.06, duration: 0.25 }}
                      whileHover={{ scale: mediaLocked ? 1 : 1.01 }}
                      whileTap={{ scale: mediaLocked ? 1 : 0.98 }}
                      disabled={mediaLocked}
                      onClick={() => handleAnswer(q, oi)}
                      className="w-full rounded-full border border-gold/20 bg-card/30 px-6 py-4 text-left text-sm font-light transition-all hover:border-gold/50 hover:bg-gold/5 hover:shadow-gold/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold/30 text-[10px] text-gold/60">
                          {String.fromCharCode(65 + oi)}
                        </div>
                        <span className="flex-1">{o.label}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </Card>
        )}

        {step === "loading" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <Card className="flex flex-col items-center justify-center gap-6 rounded-[32px] border border-gold/20 bg-card/40 p-16 text-center backdrop-blur-xl">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-gold/20" />
                <Loader2 className="relative h-12 w-12 animate-spin text-gold" />
              </div>
              <div className="space-y-2">
                <h2 className="font-display text-3xl">Estamos preparando seu diagnóstico...</h2>
                <p className="text-sm text-muted-foreground/80">Cruzando seu perfil com o melhor caminho estratégico.</p>
              </div>
            </Card>
          </motion.div>
        )}

        {step === "result" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-8 relative">
            {/* Fundo orgânico pulsante (Fios de Ouro / Fibra ótica dourada) */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden flex items-center justify-center opacity-30">
              <div className="absolute w-[600px] h-[600px] border-[1px] border-gold/20 rounded-full blur-[2px] animate-[spin_30s_linear_infinite]" />
              <div className="absolute w-[800px] h-[800px] border-[1px] border-gold/10 rounded-full blur-[4px] animate-[spin_40s_linear_infinite_reverse]" />
              <div className="absolute w-[1000px] h-[1000px] border-[1px] border-primary/5 rounded-full blur-[8px] animate-[pulse_10s_ease-in-out_infinite]" />
            </div>

            {/* Bloco do veredicto + dor dominante */}
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="relative z-10">
              <div className="relative overflow-hidden rounded-3xl border border-gold/20 bg-card/40 p-8 text-center backdrop-blur-md md:p-12 shadow-2xl">
                <div className="pointer-events-none absolute left-1/2 top-0 h-32 w-full -translate-x-1/2 -translate-y-1/2 bg-primary/20 blur-[80px]" />
                
                <p className="text-[10px] uppercase tracking-[0.4em] text-gold">diagnóstico concluído</p>
                <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
                  Olá, <span className="text-gold italic">{lead.name.split(' ')[0]}</span>.
                </h2>
                
                {funnel.result_intro ? (
                  <p className="mt-4 text-muted-foreground mx-auto max-w-2xl">
                    {funnel.result_intro.replace(/\{\{nome\}\}/gi, lead.name.split(' ')[0] || '')}
                  </p>
                ) : (
                  <p className="mt-4 text-muted-foreground mx-auto max-w-2xl">
                    Analisamos cuidadosamente suas respostas. Este é um momento de clareza para o seu negócio. Abaixo você encontra o veredicto do seu posicionamento e a estratégia desenhada para o seu próximo nível.
                  </p>
                )}

                <div className="mt-8 flex justify-center">
                  <div className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-[#4a3705] shadow-gold animate-pulse-soft" style={{
                    background: 'linear-gradient(110deg, #8B6E28 0%, #D4AF37 30%, #FFF2CC 50%, #D4AF37 70%, #8B6E28 100%)',
                    backgroundSize: '200% auto',
                    animation: 'gold-bar-shine 3s linear infinite'
                  }}>
                    <Sparkles className="h-3.5 w-3.5" /> Dor Principal: {result?.pain_detected ?? "Não identificada"}
                  </div>
                </div>

                {result?.veredict && (
                  <div className="mt-8 rounded-2xl bg-background/50 p-6 border border-border/50 text-left">
                    <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90 italic">
                      "{result.veredict.replace(/\{\{nome\}\}/gi, lead.name.split(' ')[0] || '')}"
                    </p>
                  </div>
                )}

                {/* Storytelling Bridge / Gancho Condutivo */}
                <div className="mt-12 space-y-6 text-left border-t border-border/30 pt-8">
                  <h3 className="font-display text-2xl text-gold">O caminho para o seu próximo nível</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Baseado no seu momento atual, identificamos que o seu maior gargalo não é apenas técnico, mas sim de <strong>posicionamento estratégico</strong>. Você tem o conhecimento, mas a forma como o mercado te enxerga ainda não reflete o valor real do que você entrega.
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Para mudar isso, desenhamos uma estratégia que une autoridade imediata com uma estrutura de vendas intencional. Não se trata de "postar mais", mas de ser <strong>escolhido</strong> pelos clientes que não questionam o seu preço.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Cards de produto: principal + alternativas */}
            {productList.map((product, idx) => {
              const isPrimary = idx === 0;
              const ctaMode: "whatsapp" | "checkout" | "both" = product.cta_mode ?? "whatsapp";
              const wppUrl = buildWhatsappUrl(product);
              const chkUrl = buildCheckoutUrl(product);
              const ctaLabel = product.cta_label ?? "Quero esse";
              const secondaryLabel = product.cta_secondary_label ?? (ctaMode === "both" ? "Tirar dúvida no WhatsApp" : "Falar no WhatsApp");
              
              // Nova estrutura de benefícios (objeto) vs legada (array)
              const rawBenefits = product.benefits;
              const isObj = typeof rawBenefits === 'object' && rawBenefits !== null && !Array.isArray(rawBenefits);
              const benefits: string[] = isObj ? ((rawBenefits as any).items || []) : (Array.isArray(rawBenefits) ? rawBenefits : []);
              
              // Lógica de Oferta Exclusiva (Prioriza o que vier do banco, fallback para isPrimary)
              const isExclusive = isObj ? (rawBenefits as any).is_exclusive : isPrimary;
              let originalPrice = isObj ? (rawBenefits as any).original_price : "";
              
              const currentPriceHint = product.price_hint?.toLowerCase() || "";
              if (currentPriceHint.includes("a partir") || currentPriceHint.includes("consulta")) {
                originalPrice = "";
              }
              const guaranteeDays = isObj ? ((rawBenefits as any).guarantee_days || 7) : 7;
              const bioImage = funnel?.briefing?.bio_image_url || "https://axtor.space/wp-content/uploads/2024/04/stefany-perfil.jpg";
              
              return (
                <motion.div
                  key={product.id ?? idx}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + idx * 0.15, duration: 0.45 }}
                  className="relative z-10"
                >
                  <div
                    className={
                      isExclusive
                        ? "relative overflow-hidden space-y-8 rounded-[32px] border border-gold/50 bg-gradient-to-br from-background via-background to-primary/10 p-8 transition-all duration-500 hover:border-gold hover:shadow-[0_0_40px_-10px_rgba(212,175,55,0.3)] shadow-2xl"
                        : "space-y-6 rounded-[24px] border border-border/60 bg-card/40 p-8 transition-all duration-500 hover:border-primary/40 hover:bg-card/60"
                    }
                  >
                    {isExclusive && (
                      <>
                        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-gold/10 blur-[80px]" />
                        <div className="absolute top-0 right-0 p-4">
                          <div className="rounded-full border border-gold/40 bg-background/60 backdrop-blur-sm px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gold shadow-lg">
                            Oferta Exclusiva
                          </div>
                        </div>
                      </>
                    )}

                    <div
                      className={
                        isExclusive
                          ? "inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-gold/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold"
                          : "inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
                      }
                    >
                      {isExclusive ? <><Star className="h-3 w-3 fill-current" /> Recomendado pra você</> : <>Você também pode gostar</>}
                    </div>

                    <div className="space-y-2 relative z-10">
                      <h2 className={isExclusive ? "font-display text-4xl leading-tight" : "font-display text-2xl leading-tight"}>
                        {product.name}
                      </h2>
                      {product.description && (
                        <p className="text-muted-foreground leading-relaxed">{product.description}</p>
                      )}
                    </div>

                    {benefits.length > 0 && (
                      <div className="space-y-4 pt-2 relative z-10">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold/80">O que você recebe:</p>
                        <ul className="space-y-3">
                          {benefits.map((b, bi) => (
                            <li key={bi} className="flex items-start gap-3 text-sm group text-left">
                              <div className="mt-0.5 rounded-full bg-gold/20 p-1 group-hover:bg-gold/40 transition-colors">
                                <Check className="h-3 w-3 text-gold" />
                              </div>
                              <span className="text-foreground/90 font-medium">{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {isExclusive && (
                      <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/30">
                        <div className="text-center border-r border-border/30">
                          <p className="text-2xl font-display text-gold">+28%</p>
                          <p className="text-[10px] uppercase tracking-tighter text-muted-foreground">Percepção de Autoridade</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-display text-gold">+22%</p>
                          <p className="text-[10px] uppercase tracking-tighter text-muted-foreground">Retenção de Audiência</p>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 space-y-4 relative z-10">
                      {isExclusive && (
                        <div className="flex flex-col items-center gap-1">
                          {originalPrice && (
                            <span className="text-xs text-muted-foreground line-through opacity-60">Valor Total: {originalPrice}</span>
                          )}
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-bold uppercase text-gold">Por apenas:</span>
                            <span className="text-4xl font-display text-foreground">{product.price_hint}</span>
                          </div>
                          {originalPrice && (
                            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest animate-pulse">Economia Real Detectada</span>
                          )}
                        </div>
                      )}
                      
                      {!isExclusive && product.price_hint && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground uppercase tracking-widest">Investimento:</span>
                          <span className="text-lg font-semibold text-foreground">{product.price_hint}</span>
                        </div>
                      )}

                      <div className="space-y-3">
                        {(ctaMode === "checkout" || ctaMode === "both") && chkUrl && (
                          <Button
                            size="lg"
                            className={isExclusive ? "btn-luxe w-full gap-2 h-14 uppercase tracking-widest text-xs font-bold" : "w-full gap-2 h-12"}
                            asChild
                          >
                            <a href={chkUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center">
                              {ctaLabel} <ArrowRight className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {(ctaMode === "whatsapp" || ctaMode === "both") && wppUrl && (
                          <Button
                            size="lg"
                            variant={isExclusive ? "default" : "outline"}
                            className={isExclusive ? "btn-luxe w-full gap-2 h-14 uppercase tracking-widest text-xs font-bold rounded-full" : "w-full gap-2 h-12 rounded-full"}
                            asChild
                          >
                            <a
                              href={wppUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-center"
                            >
                              <MessageCircle className="h-4 w-4" />
                              {ctaMode === "whatsapp" ? ctaLabel : secondaryLabel}
                            </a>
                          </Button>
                        )}
                      </div>

                      {isExclusive && (
                        <div className="mt-6 rounded-2xl bg-green-500/5 border border-green-500/20 p-4 flex gap-4 items-center text-left">
                          <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="h-6 w-6 text-green-500" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-foreground">Garantia Incondicional de {guaranteeDays} Dias</p>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                              Se não gostar, devolvemos 100% do seu dinheiro. Sem perguntas.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Seção de Autoridade: Quem é Stefany Mello */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mt-20 relative overflow-hidden rounded-[32px] bg-card/30 border border-border/40 p-8 md:p-12 text-left"
            >
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6 order-2 md:order-1">
                  <h3 className="font-display text-4xl leading-tight">
                    Quem é <span className="text-gold italic">{funnel?.tenant?.display_name || "Stefany Mello"}</span>?
                  </h3>
                  <div className="space-y-4 text-sm leading-relaxed text-muted-foreground/90 whitespace-pre-line">
                    {funnel?.briefing?.bio_text ? (
                      funnel.briefing.bio_text
                    ) : (
                      <>
                        <p>
                          {funnel?.tenant?.display_name || "Stefany Mello"} é estrategista de posicionamento e gestão digital para negócios premium.
                        </p>
                        <p>
                          Com visão estratégica e execução orientada a resultado, desenvolve e gerencia estratégias digitais que transformam a presença online de negócios em um ativo comercial real capaz de gerar autoridade, atrair o cliente certo e justificar o preço cobrado.
                        </p>
                        <p>
                          Sua metodologia une posicionamento estratégico, gestão de conteúdo e inteligência editorial para construir uma presença digital consistente, intencional e alinhada ao nível do negócio que representa.
                        </p>
                      </>
                    )}
                    <p className="text-foreground font-medium italic pt-2">
                      "Para quem entendeu que presença digital não é sobre estar online. É sobre ser escolhido."
                    </p>
                  </div>
                  <div className="pt-4">
                    <div className="inline-flex items-center gap-3 rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-[10px] uppercase tracking-widest text-gold font-bold">
                      Diretora Axtor • Estrategista Premium
                    </div>
                  </div>
                </div>
                
                <div className="relative order-1 md:order-2 flex justify-center">
                  <div className="relative w-full aspect-[4/5] max-w-[320px] rounded-[32px] overflow-hidden shadow-2xl border border-gold/20">
                    <img 
                      src={(funnel?.briefing?.use_global_bio ? tenant?.global_avatar_url : funnel?.briefing?.bio_image_url) || "https://axtor.space/wp-content/uploads/2024/04/stefany-perfil.jpg"} 
                      alt={tenant?.display_name || "Stefany Mello"} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>
                  {/* Elementos decorativos */}
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gold/10 blur-3xl rounded-full" />
                  <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/10 blur-3xl rounded-full" />
                </div>
              </div>
            </motion.div>

            {/* Seção Estratégica: Você viveu o funil */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-20 relative overflow-hidden rounded-[32px] border border-gold/30 bg-gold/5 p-10 text-center backdrop-blur-xl"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-gold-soft opacity-30" />
              <div className="relative z-10 space-y-6">
                <span className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-background/40 px-4 py-1.5 text-[10px] uppercase tracking-[0.4em] text-gold font-bold">
                  Consciência de Funil
                </span>
                
                <h3 className="font-display text-3xl leading-tight sm:text-4xl">
                  O caminho que você acabou de fazer é <span className="text-gold italic">o mesmo funil</span> que entrego para os meus clientes.
                </h3>
                
                <p className="mx-auto max-w-xl text-muted-foreground leading-relaxed">
                  Você acaba de experimentar na pele a jornada de alta conversão da <span className="text-foreground font-bold">Axtor</span>. Do topo ao fundo de funil, de forma automática e persuasiva.
                </p>

                <div className="pt-4">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-gold/60 font-bold">
                    DO TOPO AO FUNDO DE FUNIL · VOCÊ ACABOU DE VIVER
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                  <Button
                    variant="outline"
                    className="h-12 rounded-full border-gold/40 hover:bg-gold/10 text-xs uppercase tracking-widest px-8"
                    asChild
                  >
                    <a href={`/${tenant?.slug || "stefany-mello"}`} target="_blank" rel="noreferrer">
                      Ver rodando na minha Bio
                    </a>
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}