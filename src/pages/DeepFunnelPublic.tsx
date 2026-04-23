import { useEffect, useState, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MessageCircle, Sparkles, ArrowRight } from "lucide-react";
import { getSessionId, captureUtm } from "@/lib/analytics";

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
      setTimeout(() => setCurrent(current + 1), 200);
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

  const whatsappUrl = useMemo(() => {
    if (!result?.product || !tenant?.whatsapp_number) return null;
    const tpl: string = result.product.whatsapp_template ?? "Olá!";
    const msg = tpl.replace(/\{\{nome\}\}/gi, lead.name || "");
    const number = (tenant.whatsapp_number ?? "").replace(/\D/g, "");
    if (!number) return null;
    return `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
  }, [result, tenant, lead]);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!funnel) return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Funil não encontrado.</p></div>;

  const q = questions[current];
  const mediaLocked = q?.media_url && (q.lock_until_media_ends || funnel.lock_until_media_ends) && !mediaEnded && skipCountdown > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-8">
        {step === "welcome" && (
          <Card className="space-y-6 p-8">
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs uppercase tracking-wider text-primary">
              <Sparkles className="h-3 w-3" /> Diagnóstico
            </div>
            <h1 className="font-display text-3xl leading-tight md:text-4xl">{funnel.name}</h1>
            {funnel.welcome_media_url && (
              <div className="overflow-hidden rounded-md border">
                {funnel.welcome_media_type === "video" && <video src={funnel.welcome_media_url} controls className="w-full" />}
                {funnel.welcome_media_type === "audio" && <audio src={funnel.welcome_media_url} controls className="w-full" />}
                {funnel.welcome_media_type === "image" && <img src={funnel.welcome_media_url} alt="" className="w-full" />}
              </div>
            )}
            <p className="whitespace-pre-line text-muted-foreground">{funnel.welcome_text}</p>
            <Button size="lg" className="gap-2" onClick={() => setStep("lead")}>
              Começar <ArrowRight className="h-4 w-4" />
            </Button>
          </Card>
        )}

        {step === "lead" && (
          <Card className="space-y-5 p-6 md:p-8">
            <h2 className="font-display text-2xl">Antes de começar, me conta:</h2>
            <div className="space-y-3">
              <div><Label>Seu nome</Label><Input value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} /></div>
              <div><Label>WhatsApp</Label><Input value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })} placeholder="(11) 99999-9999" /></div>
              <div><Label>@ do Instagram (opcional)</Label><Input value={lead.instagram_handle} onChange={(e) => setLead({ ...lead, instagram_handle: e.target.value })} placeholder="@seuhandle" /></div>
            </div>
            <Button size="lg" className="w-full gap-2" disabled={!lead.name || !lead.phone} onClick={() => setStep("quiz")}>
              Continuar <ArrowRight className="h-4 w-4" />
            </Button>
          </Card>
        )}

        {step === "quiz" && q && (
          <Card className="space-y-6 p-6 md:p-8">
            <div className="space-y-2">
              <Progress value={((current + 1) / questions.length) * 100} className="h-1" />
              <p className="text-xs text-muted-foreground">Pergunta {current + 1} de {questions.length}</p>
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-2xl leading-tight">{q.question_text}</h2>
              {q.subtitle && <p className="text-sm text-muted-foreground">{q.subtitle}</p>}
            </div>
            {q.media_url && (
              <div className="space-y-1">
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
              </div>
            )}
            <div className="space-y-2">
              {Array.isArray(q.options) && q.options.map((o: any, oi: number) => (
                <button
                  key={oi}
                  disabled={mediaLocked}
                  onClick={() => handleAnswer(q, oi)}
                  className="w-full rounded-md border border-border bg-card p-4 text-left text-sm transition-colors hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {o.label}
                </button>
              ))}
            </div>
          </Card>
        )}

        {step === "loading" && (
          <Card className="flex flex-col items-center justify-center gap-4 p-16 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <h2 className="font-display text-2xl">Analisando suas respostas...</h2>
            <p className="text-sm text-muted-foreground">A IA está cruzando seu perfil com o melhor caminho.</p>
          </Card>
        )}

        {step === "result" && (
          <div className="space-y-5">
            <Card className="space-y-4 border-primary/40 bg-gradient-to-br from-background to-primary/5 p-8">
              {funnel.result_intro && <p className="text-sm text-muted-foreground">{funnel.result_intro}</p>}
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs uppercase tracking-wider text-primary">
                Dor dominante: {result?.pain_detected ?? "—"}
              </div>
              {result?.product && (
                <>
                  <h2 className="font-display text-3xl leading-tight">{result.product.name}</h2>
                  <p className="text-muted-foreground">{result.product.description}</p>
                </>
              )}
              {result?.veredict && (
                <div className="rounded-md border border-border/60 bg-card/50 p-4">
                  <p className="whitespace-pre-line text-sm leading-relaxed">{result.veredict}</p>
                </div>
              )}
              {result?.product?.result_media_url && (
                <div className="overflow-hidden rounded-md border">
                  {result.product.result_media_type === "video" && <video src={result.product.result_media_url} controls className="w-full" />}
                  {result.product.result_media_type === "audio" && <audio src={result.product.result_media_url} controls className="w-full" />}
                  {result.product.result_media_type === "image" && <img src={result.product.result_media_url} alt="" className="w-full" />}
                </div>
              )}
            </Card>
            {whatsappUrl && (
              <Button size="lg" className="w-full gap-2" asChild>
                <a href={whatsappUrl} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-4 w-4" /> Continuar pelo WhatsApp
                </a>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}