import { useEffect, useState, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MessageCircle, Sparkles, ArrowRight, Check, Clock, Users, Cog, Star } from "lucide-react";
import { getSessionId, captureUtm } from "@/lib/analytics";
import { applyTenantTheme } from "@/lib/applyTenantTheme";
import { motion, AnimatePresence } from "framer-motion";

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
      const [{ data: qs }, { data: t }] = await Promise.all([
        supabase.from("deep_funnel_questions").select("*").eq("funnel_id", f.id).order("position"),
        supabase.from("tenants").select("display_name, whatsapp_number").eq("id", f.tenant_id).maybeSingle(),
      ]);
      setFunnel(f);
      setQuestions(qs ?? []);
      setTenant(t);
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
    const tpl: string = product.whatsapp_template ?? "Olá!";
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
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-8">
        {step === "welcome" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="space-y-6 p-8">
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs uppercase tracking-wider text-primary">
              <Sparkles className="h-3 w-3" /> Diagnóstico
            </div>
            <h1 className="font-display text-3xl leading-tight md:text-4xl">{funnel.name}</h1>
            {funnel.welcome_media_url && (
              <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15, duration: 0.4 }} className="overflow-hidden rounded-md border">
                {funnel.welcome_media_type === "video" && <video src={funnel.welcome_media_url} controls className="w-full" />}
                {funnel.welcome_media_type === "audio" && <audio src={funnel.welcome_media_url} controls className="w-full" />}
                {funnel.welcome_media_type === "image" && <img src={funnel.welcome_media_url} alt="" className="w-full" />}
              </motion.div>
            )}
            <p className="whitespace-pre-line text-muted-foreground">{funnel.welcome_text}</p>
            <Button size="lg" className="gap-2 transition-transform hover:scale-[1.02]" onClick={() => setStep("lead")}>
              Começar <ArrowRight className="h-4 w-4" />
            </Button>
          </Card>
          </motion.div>
        )}

        {step === "lead" && (
          <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}>
          <Card className="space-y-5 p-6 md:p-8">
            <h2 className="font-display text-2xl">Antes de começar, me conta:</h2>
            <div className="space-y-3">
              <div>
                <Label>Seu nome completo</Label>
                <Input
                  value={lead.name}
                  onChange={(e) => setLead({ ...lead, name: e.target.value })}
                  placeholder="Ex: Joanderson Silva"
                />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input
                  value={lead.phone}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (val.length > 11) val = val.slice(0, 11);
                    let formatted = val;
                    if (val.length > 2) formatted = `(${val.slice(0, 2)}) ${val.slice(2)}`;
                    if (val.length > 7) formatted = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
                    setLead({ ...lead, phone: formatted });
                  }}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <Label>@ do Instagram (opcional)</Label>
                <Input
                  value={lead.instagram_handle}
                  onChange={(e) => {
                    let val = e.target.value.trim();
                    if (val.length > 0 && !val.startsWith('@')) val = '@' + val;
                    setLead({ ...lead, instagram_handle: val });
                  }}
                  placeholder="@seuhandle"
                />
              </div>
            </div>
            <Button
              size="lg"
              className="w-full gap-2"
              disabled={
                lead.name.trim().split(/\s+/).length < 2 || 
                lead.name.trim().length < 5 || 
                lead.phone.replace(/\D/g, "").length < 10
              }
              onClick={() => setStep("quiz")}
            >
              Continuar <ArrowRight className="h-4 w-4" />
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
                    <div className="overflow-hidden rounded-md border">
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
                <div className="space-y-2">
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
                      className="w-full rounded-md border border-border bg-card p-4 text-left text-sm transition-colors hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {o.label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </Card>
        )}

        {step === "loading" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <Card className="flex flex-col items-center justify-center gap-4 p-16 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <h2 className="font-display text-2xl">Analisando suas respostas...</h2>
            <p className="text-sm text-muted-foreground">A IA está cruzando seu perfil com o melhor caminho.</p>
          </Card>
          </motion.div>
        )}

        {step === "result" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-5">
            {/* Bloco do veredicto + dor dominante */}
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <Card className="space-y-4 border-primary/40 bg-gradient-to-br from-background to-primary/5 p-6 md:p-8">
                {funnel.result_intro && (
                  <p className="text-sm text-muted-foreground">
                    {funnel.result_intro.replace(/\{\{nome\}\}/gi, lead.name.split(' ')[0] || '')}
                  </p>
                )}
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs uppercase tracking-wider text-primary">
                  Dor dominante: {result?.pain_detected ?? "—"}
                </div>
                {result?.veredict && (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                    {result.veredict.replace(/\{\{nome\}\}/gi, lead.name.split(' ')[0] || '')}
                  </p>
                )}
              </Card>
            </motion.div>

            {/* Cards de produto: principal + alternativas */}
            {productList.map((product, idx) => {
              const isPrimary = idx === 0;
              const ctaMode: "whatsapp" | "checkout" | "both" = product.cta_mode ?? "whatsapp";
              const wppUrl = buildWhatsappUrl(product);
              const chkUrl = buildCheckoutUrl(product);
              const ctaLabel = product.cta_label ?? "Quero esse";
              const secondaryLabel = product.cta_secondary_label ?? (ctaMode === "both" ? "Tirar dúvida no WhatsApp" : "Falar no WhatsApp");
              const benefits: string[] = Array.isArray(product.benefits) ? product.benefits : [];
              return (
                <motion.div
                  key={product.id ?? idx}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + idx * 0.15, duration: 0.45 }}
                >
                  <Card
                    className={
                      isPrimary
                        ? "space-y-5 border-primary/50 bg-gradient-to-br from-background via-background to-primary/10 p-6 md:p-8"
                        : "space-y-5 border-border/60 bg-card/40 p-6 md:p-8"
                    }
                  >
                    <div
                      className={
                        isPrimary
                          ? "inline-flex items-center gap-1.5 rounded-full border border-primary/50 bg-primary/15 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-primary"
                          : "inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
                      }
                    >
                      {isPrimary ? <><Star className="h-3 w-3 fill-current" /> Recomendado pra você</> : <>Você também pode gostar</>}
                    </div>

                    <div className="space-y-2">
                      <h2 className={isPrimary ? "font-display text-3xl leading-tight md:text-4xl" : "font-display text-2xl leading-tight"}>
                        {product.name}
                      </h2>
                      {product.description && (
                        <p className="text-muted-foreground">{product.description}</p>
                      )}
                    </div>

                    {product.result_media_url && isPrimary && (
                      <div className="overflow-hidden rounded-md border">
                        {product.result_media_type === "video" && <video src={product.result_media_url} controls className="w-full" />}
                        {product.result_media_type === "audio" && <audio src={product.result_media_url} controls className="w-full" />}
                        {product.result_media_type === "image" && <img src={product.result_media_url} alt="" className="w-full" />}
                      </div>
                    )}

                    {product.who_for && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-primary/80">
                          <Users className="h-3 w-3" /> Pra quem é
                        </div>
                        <p className="text-sm leading-relaxed text-foreground/85">{product.who_for}</p>
                      </div>
                    )}

                    {product.how_it_works && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-primary/80">
                          <Cog className="h-3 w-3" /> Como funciona
                        </div>
                        <p className="text-sm leading-relaxed text-foreground/85">{product.how_it_works}</p>
                        {(product.session_duration || product.plan_duration) && (
                          <div className="flex flex-wrap gap-3 pt-1 text-xs text-foreground/70">
                            {product.session_duration && (
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3 text-primary" /> Sessão: <strong className="text-foreground">{product.session_duration}</strong>
                              </span>
                            )}
                            {product.plan_duration && (
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3 text-primary" /> Plano: <strong className="text-foreground">{product.plan_duration}</strong>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {benefits.length > 0 && (
                      <ul className="space-y-1.5">
                        {benefits.map((b, bi) => (
                          <li key={bi} className="flex items-start gap-2 text-sm">
                            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                            <span className="text-foreground/85">{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {product.price_hint && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Investimento: </span>
                        <span className="font-medium text-foreground">{product.price_hint}</span>
                      </div>
                    )}

                    {product.urgency_text && (
                      <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-xs text-foreground/85">
                        <Clock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                        <span>{product.urgency_text}</span>
                      </div>
                    )}

                    <div className="space-y-2 pt-1">
                      {(ctaMode === "checkout" || ctaMode === "both") && chkUrl && (
                        <Button
                          size="lg"
                          className={`w-full gap-2 transition-transform hover:scale-[1.01] ${isPrimary ? "animate-[pulse_2.5s_ease-in-out_infinite]" : ""}`}
                          asChild
                        >
                          <a href={chkUrl} target="_blank" rel="noreferrer">
                            {ctaLabel} <ArrowRight className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {(ctaMode === "whatsapp" || ctaMode === "both") && wppUrl && (
                        <Button
                          size="lg"
                          variant={ctaMode === "both" ? "outline" : "default"}
                          className={`w-full gap-2 transition-transform hover:scale-[1.01] ${isPrimary && ctaMode === "whatsapp" ? "animate-[pulse_2.5s_ease-in-out_infinite]" : ""}`}
                          asChild
                        >
                          <a href={wppUrl} target="_blank" rel="noreferrer">
                            <MessageCircle className="h-4 w-4" />
                            {ctaMode === "whatsapp" ? ctaLabel : secondaryLabel}
                          </a>
                        </Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}