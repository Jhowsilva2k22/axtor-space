import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Loader2, ExternalLink, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDeepDiagnostic } from "@/hooks/useDeepDiagnostic";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

type Step = "list" | "briefing" | "generating" | "review";

const BRIEFING_FIELDS = [
  { key: "business_name", label: "Nome do seu negócio/marca", placeholder: "Ex: Stefany Mello Consultoria" },
  { key: "niche", label: "Nicho específico", placeholder: "Ex: Coach financeiro pra mães empreendedoras" },
  { key: "ideal_client", label: "Quem é seu cliente ideal? (perfil, idade, momento)", placeholder: "Ex: Mulheres 30-45, donas de pequeno negócio, faturando até 30k/mês" },
  { key: "main_pain", label: "Qual a maior dor que você resolve?", placeholder: "Ex: Caos financeiro pessoal sufocando o negócio" },
  { key: "transformation", label: "Que transformação você entrega?", placeholder: "Ex: De 0 organização para sistema financeiro automatizado em 60 dias" },
  { key: "tone_of_voice", label: "Tom de voz (3-5 adjetivos)", placeholder: "Ex: Direto, acolhedor, sem floreio, prático" },
  { key: "objections", label: "Top 3 objeções que você mais escuta", placeholder: "Ex: Não tenho tempo / Já tentei e não deu certo / É caro" },
  { key: "best_offer", label: "Sua oferta principal hoje (preço médio)", placeholder: "Ex: Mentoria 3 meses, R$ 3.500" },
  { key: "channels", label: "Por onde vendem hoje?", placeholder: "Ex: Instagram + WhatsApp + indicação" },
  { key: "competitors", label: "2-3 concorrentes que você admira", placeholder: "Ex: @fulano, @beltrano" },
  { key: "differentials", label: "O que te torna diferente?", placeholder: "Ex: Único método com IA + planilha pessoal" },
  { key: "results", label: "Maior resultado que entregou", placeholder: "Ex: Cliente saiu de R$ 5k para R$ 80k em 6 meses" },
  { key: "format", label: "Formato preferido de entrega", placeholder: "Ex: 1:1 + grupo + acesso ao app" },
  { key: "ai_use", label: "Você já usa IA no seu negócio? Como?", placeholder: "Ex: Uso ChatGPT pra roteiro de reels" },
  { key: "goal_3_months", label: "Sua meta nos próximos 3 meses", placeholder: "Ex: Bater R$ 100k/mês" },
];

export default function DeepDiagnosticEditor() {
  const navigate = useNavigate();
  const { hasAddon, funnels, loading, refresh, tenantId } = useDeepDiagnostic();
  const [step, setStep] = useState<Step>("list");
  const [briefing, setBriefing] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [activeFunnelId, setActiveFunnelId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [funnel, setFunnel] = useState<any>(null);

  useEffect(() => {
    if (!loading && hasAddon === false) {
      navigate("/admin/deep-diagnostic/demo", { replace: true });
    }
  }, [hasAddon, loading, navigate]);

  const loadFunnel = async (id: string) => {
    setActiveFunnelId(id);
    const [{ data: f }, { data: qs }, { data: ps }] = await Promise.all([
      supabase.from("deep_funnels").select("*").eq("id", id).maybeSingle(),
      supabase.from("deep_funnel_questions").select("*").eq("funnel_id", id).order("position"),
      supabase.from("deep_funnel_products").select("*").eq("funnel_id", id).order("position"),
    ]);
    setFunnel(f);
    setQuestions(qs ?? []);
    setProducts(ps ?? []);
    setStep("review");
  };

  const handleGenerate = async () => {
    if (!tenantId) return;
    const required = ["business_name", "niche", "ideal_client", "main_pain", "transformation"];
    const missing = required.filter((k) => !briefing[k]?.trim());
    if (missing.length) {
      toast({ title: "Preencha os campos essenciais", description: missing.join(", "), variant: "destructive" });
      return;
    }
    setStep("generating");
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-deep-funnel", {
        body: { tenant_id: tenantId, briefing },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: "Funil gerado!", description: "Revise as perguntas e produtos abaixo." });
      await refresh();
      await loadFunnel((data as any).funnel_id);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Erro ao gerar funil", description: e?.message ?? "Tente novamente", variant: "destructive" });
      setStep("briefing");
    } finally {
      setGenerating(false);
    }
  };

  const updateQuestion = (idx: number, patch: any) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };
  const updateProduct = (idx: number, patch: any) => {
    setProducts((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  };

  const saveAll = async (publish: boolean) => {
    if (!activeFunnelId) return;
    try {
      await supabase.from("deep_funnels").update({
        welcome_text: funnel?.welcome_text,
        result_intro: funnel?.result_intro,
        lock_until_media_ends: !!funnel?.lock_until_media_ends,
        allow_skip_after_seconds: funnel?.allow_skip_after_seconds ?? 5,
        is_published: publish,
      }).eq("id", activeFunnelId);

      for (const q of questions) {
        await supabase.from("deep_funnel_questions").update({
          question_text: q.question_text,
          subtitle: q.subtitle,
          options: q.options,
          media_url: q.media_url,
          media_type: q.media_type,
          media_caption: q.media_caption,
          lock_until_media_ends: q.lock_until_media_ends,
        }).eq("id", q.id);
      }
      for (const p of products) {
        await supabase.from("deep_funnel_products").update({
          name: p.name,
          description: p.description,
          whatsapp_template: p.whatsapp_template,
          price_hint: p.price_hint,
          result_media_url: p.result_media_url,
          result_media_type: p.result_media_type,
        }).eq("id", p.id);
      }
      toast({ title: publish ? "Funil publicado" : "Rascunho salvo" });
      await refresh();
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e?.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="gap-2">
            <Link to="/admin"><ArrowLeft className="h-4 w-4" /> Painel</Link>
          </Button>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Diagnóstico Profundo
          </div>
        </div>

        {step === "list" && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h1 className="font-display text-3xl">Seus funis</h1>
              <Button onClick={() => setStep("briefing")} className="gap-2">
                <Plus className="h-4 w-4" /> Novo funil
              </Button>
            </div>
            {funnels.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Você ainda não criou nenhum funil. Comece pelo briefing.</p>
                <Button className="mt-4" onClick={() => setStep("briefing")}>Criar meu primeiro funil</Button>
              </Card>
            )}
            {funnels.map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.04, duration: 0.25 }}
              >
              <Card className="flex items-center justify-between gap-4 p-5 transition-colors hover:border-primary/40">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-medium">{f.name}</h3>
                    {f.is_published ? (
                      <Badge variant="default">Publicado</Badge>
                    ) : (
                      <Badge variant="secondary">Rascunho</Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">/d/funnel/{f.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  {f.is_published && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/d/funnel/${f.slug}`} target="_blank" rel="noreferrer" className="gap-1">
                        <ExternalLink className="h-3 w-3" /> Ver
                      </a>
                    </Button>
                  )}
                  <Button size="sm" onClick={() => loadFunnel(f.id)}>Editar</Button>
                </div>
              </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {step === "briefing" && (
          <motion.div
            key="briefing"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
          <Card className="space-y-6 p-6 md:p-8">
            <div>
              <h1 className="font-display text-2xl">Briefing profundo</h1>
              <p className="text-sm text-muted-foreground">
                Quanto mais detalhe você der, mais sob medida o funil fica. Os 5 primeiros campos são obrigatórios.
              </p>
            </div>
            <div className="space-y-4">
              {BRIEFING_FIELDS.map((f, i) => (
                <motion.div
                  key={f.key}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.025, duration: 0.25 }}
                  className="space-y-1.5"
                >
                  <Label htmlFor={f.key}>
                    {f.label}
                    {i < 5 && <span className="text-destructive"> *</span>}
                  </Label>
                  <Textarea
                    id={f.key}
                    placeholder={f.placeholder}
                    value={briefing[f.key] ?? ""}
                    onChange={(e) => setBriefing({ ...briefing, [f.key]: e.target.value })}
                    rows={2}
                  />
                </motion.div>
              ))}
            </div>
            <div className="flex justify-between gap-3">
              <Button variant="ghost" onClick={() => setStep("list")}>Cancelar</Button>
              <Button onClick={handleGenerate} className="gap-2 transition-transform hover:scale-[1.02]">
                <Sparkles className="h-4 w-4" /> Gerar funil com IA
              </Button>
            </div>
          </Card>
          </motion.div>
        )}

        {step === "generating" && (
          <motion.div
            key="generating"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
          <Card className="flex flex-col items-center justify-center gap-4 p-16 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
            >
              <Sparkles className="h-10 w-10 text-primary" />
            </motion.div>
            <h2 className="font-display text-2xl">Gerando seu funil...</h2>
            <p className="text-sm text-muted-foreground">
              A IA está montando 12 perguntas e 5 produtos. Isso leva uns 30 segundos.
            </p>
          </Card>
          </motion.div>
        )}

        {step === "review" && funnel && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-2xl">{funnel.name}</h1>
                <p className="text-xs text-muted-foreground">Slug: /d/funnel/{funnel.slug}</p>
              </div>
              <Button variant="ghost" onClick={() => { setStep("list"); setActiveFunnelId(null); }}>← Voltar</Button>
            </div>

            <Card className="space-y-4 p-6">
              <h2 className="font-display text-lg">Boas-vindas e regras</h2>
              <div className="space-y-3">
                <div>
                  <Label>Texto de boas-vindas</Label>
                  <Textarea
                    value={funnel.welcome_text ?? ""}
                    onChange={(e) => setFunnel({ ...funnel, welcome_text: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Texto de introdução do resultado</Label>
                  <Textarea
                    value={funnel.result_intro ?? ""}
                    onChange={(e) => setFunnel({ ...funnel, result_intro: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">Travar opções até o vídeo/áudio terminar</p>
                    <p className="text-xs text-muted-foreground">Aplica-se a perguntas com mídia</p>
                  </div>
                  <Switch
                    checked={!!funnel.lock_until_media_ends}
                    onCheckedChange={(v) => setFunnel({ ...funnel, lock_until_media_ends: v })}
                  />
                </div>
                <div>
                  <Label>Permitir pular a mídia após (segundos)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={funnel.allow_skip_after_seconds ?? 5}
                    onChange={(e) => setFunnel({ ...funnel, allow_skip_after_seconds: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </Card>

            <Card className="space-y-4 p-6">
              <h2 className="font-display text-lg">Perguntas ({questions.length})</h2>
              {questions.map((q, idx) => (
                <div key={q.id} className="space-y-3 rounded-md border border-border/60 p-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Pergunta {idx + 1}</Badge>
                    <Badge variant="secondary">{q.question_type}</Badge>
                  </div>
                  <div>
                    <Label>Texto da pergunta</Label>
                    <Textarea
                      value={q.question_text}
                      onChange={(e) => updateQuestion(idx, { question_text: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Subtítulo (opcional)</Label>
                    <Input
                      value={q.subtitle ?? ""}
                      onChange={(e) => updateQuestion(idx, { subtitle: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Opções</Label>
                    {Array.isArray(q.options) && q.options.map((o: any, oi: number) => (
                      <div key={oi} className="flex gap-2">
                        <Input
                          value={o.label}
                          onChange={(e) => {
                            const newOpts = [...q.options];
                            newOpts[oi] = { ...o, label: e.target.value };
                            updateQuestion(idx, { options: newOpts });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label>URL de mídia (opcional)</Label>
                      <Input
                        placeholder="https://... ou /storage/..."
                        value={q.media_url ?? ""}
                        onChange={(e) => updateQuestion(idx, { media_url: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Tipo</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={q.media_type ?? ""}
                        onChange={(e) => updateQuestion(idx, { media_type: e.target.value })}
                      >
                        <option value="">Sem mídia</option>
                        <option value="image">Imagem</option>
                        <option value="video">Vídeo</option>
                        <option value="audio">Áudio</option>
                      </select>
                    </div>
                  </div>
                  {q.media_url && (
                    <div>
                      <Label>Legenda da mídia</Label>
                      <Input
                        value={q.media_caption ?? ""}
                        onChange={(e) => updateQuestion(idx, { media_caption: e.target.value })}
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between rounded-md border p-2">
                    <span className="text-xs">Travar opções até a mídia terminar</span>
                    <Switch
                      checked={!!q.lock_until_media_ends}
                      onCheckedChange={(v) => updateQuestion(idx, { lock_until_media_ends: v })}
                    />
                  </div>
                </div>
              ))}
            </Card>

            <Card className="space-y-4 p-6">
              <h2 className="font-display text-lg">Produtos ({products.length})</h2>
              {products.map((p, idx) => (
                <div key={p.id} className="space-y-3 rounded-md border border-border/60 p-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Produto {idx + 1}</Badge>
                    <Badge>{p.pain_tag}</Badge>
                  </div>
                  <div>
                    <Label>Nome</Label>
                    <Input value={p.name} onChange={(e) => updateProduct(idx, { name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Textarea value={p.description ?? ""} onChange={(e) => updateProduct(idx, { description: e.target.value })} rows={2} />
                  </div>
                  <div>
                    <Label>Preço (texto livre)</Label>
                    <Input value={p.price_hint ?? ""} onChange={(e) => updateProduct(idx, { price_hint: e.target.value })} />
                  </div>
                  <div>
                    <Label>Mensagem de WhatsApp pronta</Label>
                    <Textarea
                      value={p.whatsapp_template ?? ""}
                      onChange={(e) => updateProduct(idx, { whatsapp_template: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>URL de mídia de resultado (opcional)</Label>
                    <Input value={p.result_media_url ?? ""} onChange={(e) => updateProduct(idx, { result_media_url: e.target.value })} />
                  </div>
                </div>
              ))}
            </Card>

            <div className="sticky bottom-4 flex justify-end gap-2 rounded-md border border-border bg-card p-3 shadow-lg">
              <Button variant="outline" onClick={() => saveAll(false)}>Salvar rascunho</Button>
              <Button onClick={() => saveAll(true)} className="gap-2">
                <Sparkles className="h-4 w-4" /> Publicar funil
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}