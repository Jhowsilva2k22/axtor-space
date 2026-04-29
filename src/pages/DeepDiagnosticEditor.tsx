import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Sparkles, Loader2, ExternalLink, Trash2, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDeepDiagnostic } from "@/hooks/useDeepDiagnostic";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ImageUploadWithCrop } from "@/components/ImageUploadWithCrop";

type Step = "list" | "briefing" | "generating" | "review";

type BriefingProduct = {
  name: string;
  description: string;
  price_hint: string;
  session_duration: string;
  plan_duration: string;
  link: string;
  tipo_entrega: string;
  publico_alvo: string;
  diferencial: string;
  bonus_garantia: string;
};

const BRIEFING_FIELDS = [
  { key: "business_name", label: "Nome do seu negócio/marca", placeholder: "Ex: Sua Marca Consultoria" },
  { key: "niche", label: "Nicho específico", placeholder: "Ex: Mentoria pra um público específico que você atende" },
  { key: "ideal_client", label: "Quem é seu cliente ideal? (perfil, idade, momento)", placeholder: "Ex: Faixa etária, profissão, momento de vida e faturamento médio" },
  { key: "main_pain", label: "Qual a maior dor que você resolve?", placeholder: "Ex: A principal frustração que seu cliente sente hoje" },
  { key: "transformation", label: "Que transformação você entrega?", placeholder: "Ex: De [estado atual] para [estado desejado] em [prazo]" },
  { key: "tone_of_voice", label: "Tom de voz (3-5 adjetivos)", placeholder: "Ex: Direto, acolhedor, sem floreio, prático" },
  { key: "objections", label: "Top 3 objeções que você mais escuta", placeholder: "Ex: Não tenho tempo / Já tentei e não deu certo / É caro" },
  { key: "best_offer", label: "Sua oferta principal hoje (preço médio)", placeholder: "Ex: Nome do produto/serviço + duração + faixa de preço" },
  { key: "channels", label: "Por onde vendem hoje?", placeholder: "Ex: Instagram + WhatsApp + indicação" },
  { key: "competitors", label: "2-3 concorrentes que você admira", placeholder: "Ex: @perfil1, @perfil2" },
  { key: "differentials", label: "O que te torna diferente?", placeholder: "Ex: Método, ferramenta ou abordagem que só você tem" },
  { key: "results", label: "Maior resultado que entregou", placeholder: "Ex: Resultado concreto e mensurável de um cliente real" },
  { key: "format", label: "Formato preferido de entrega", placeholder: "Ex: 1:1, grupo, app, presencial — combine como preferir" },
  { key: "ai_use", label: "Você já usa IA no seu negócio? Como?", placeholder: "Ex: Pra roteiros, atendimento, planejamento — ou ainda não uso" },
  { key: "goal_3_months", label: "Sua meta nos próximos 3 meses", placeholder: "Ex: Faturamento, número de clientes ou marco que quer bater" },
];

export default function DeepDiagnosticEditor() {
  const navigate = useNavigate();
  const { hasAddon, funnels, loading, refresh, tenantId } = useDeepDiagnostic();
  const [step, setStep] = useState<Step>("list");
  const [briefing, setBriefing] = useState<Record<string, string>>({});
  const [briefingProducts, setBriefingProducts] = useState<BriefingProduct[]>([
    { name: "", description: "", price_hint: "", session_duration: "", plan_duration: "", link: "", tipo_entrega: "", publico_alvo: "", diferencial: "", bonus_garantia: "" },
  ]);
  const [generating, setGenerating] = useState(false);
  const [activeFunnelId, setActiveFunnelId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [funnel, setFunnel] = useState<any>(null);

  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!loading && hasAddon === false) {
      navigate("/admin/deep-diagnostic/demo", { replace: true });
    }
  }, [hasAddon, loading, navigate]);

  // Monitora alterações para evitar recarregamento automático
  useEffect(() => {
    const hasBriefingData = Object.values(briefing).some(v => v.trim().length > 0);
    const hasProductData = briefingProducts.some(p => p.name.trim().length > 0);
    if (hasBriefingData || hasProductData) {
      setIsDirty(true);
    }
  }, [briefing, briefingProducts]);

  const [searchParams] = useSearchParams();
  useEffect(() => {
    const fid = searchParams.get("funnelId");
    if (fid && funnels.length > 0 && activeFunnelId !== fid) {
      loadFunnel(fid);
    }
  }, [searchParams, funnels, activeFunnelId]);

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
      const cleanProducts = briefingProducts
        .map((p) => ({
          name: p.name.trim(),
          description: p.description.trim(),
          price_hint: p.price_hint.trim(),
          session_duration: p.session_duration.trim(),
          plan_duration: p.plan_duration.trim(),
          link: p.link.trim(),
        }))
        .filter((p) => p.name.length > 0);
      const { data, error } = await supabase.functions.invoke("generate-deep-funnel", {
        body: {
          tenant_id: tenantId,
          briefing: { ...briefing, products: cleanProducts },
        },
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

  const addProduct = async () => {
    if (!activeFunnelId) return;
    const nextPos = products.length;
    const { data, error } = await supabase
      .from("deep_funnel_products")
      .insert({
        funnel_id: activeFunnelId,
        position: nextPos,
        name: "Novo produto",
        description: "",
        pain_tag: "vendas",
        price_hint: "",
        whatsapp_template: "",
        cta_mode: "whatsapp",
        is_active: true,
        benefits: { items: [], is_exclusive: false, original_price: "", guarantee_days: 7, metrics: [] },
      })
      .select("*")
      .single();
    if (error) {
      toast({ title: "Erro ao adicionar produto", description: error.message, variant: "destructive" });
      return;
    }
    setProducts((prev) => [...prev, data]);
    toast({ title: "Produto adicionado", description: "Preencha os campos abaixo." });
  };

  const deleteProduct = async (idx: number) => {
    const p = products[idx];
    if (!p?.id) return;
    if (!confirm(`Excluir o produto "${p.name}"? Essa ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from("deep_funnel_products").delete().eq("id", p.id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    setProducts((prev) => prev.filter((_, i) => i !== idx));
    toast({ title: "Produto removido" });
  };

  const deleteQuestion = async (idx: number) => {
    const q = questions[idx];
    if (!q?.id) return;
    if (!confirm("Excluir essa pergunta? Essa ação não pode ser desfeita.")) return;
    const { error } = await supabase.from("deep_funnel_questions").delete().eq("id", q.id);
    if (error) {
      toast({ title: "Erro ao excluir pergunta", description: error.message, variant: "destructive" });
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
    toast({ title: "Pergunta removida" });
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
        thankyou_text: funnel?.thankyou_text,
        thankyou_media_url: funnel?.thankyou_media_url,
        thankyou_media_type: funnel?.thankyou_media_type,
        thankyou_media_caption: funnel?.thankyou_media_caption,
        briefing: funnel?.briefing,
      }).eq("id", activeFunnelId);

      // Sincronização Global: Atualizar bio_config do Tenant apenas se a chave estiver ligada
      if (tenantId && funnel.briefing?.use_global_bio && funnel.briefing?.bio_image_url) {
        await supabase.from("bio_config").update({
          avatar_url: funnel.briefing.bio_image_url
        }).eq("tenant_id", tenantId);
      }

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
          session_duration: p.session_duration,
          plan_duration: p.plan_duration,
          result_media_url: p.result_media_url,
          result_media_type: p.result_media_type,
          checkout_url: p.checkout_url,
          cta_mode: p.cta_mode ?? "whatsapp",
          who_for: p.who_for,
          how_it_works: p.how_it_works,
          benefits: Array.isArray(p.benefits) ? p.benefits : [],
          urgency_text: p.urgency_text,
          cta_label: p.cta_label,
          cta_secondary_label: p.cta_secondary_label,
          thankyou_text: p.thankyou_text,
          thankyou_media_url: p.thankyou_media_url,
          thankyou_media_type: p.thankyou_media_type,
          thankyou_media_caption: p.thankyou_media_caption,
          thankyou_whatsapp_template: p.thankyou_whatsapp_template,
          is_active: p.is_active !== false,
          pain_tag: p.pain_tag ?? "vendas",
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
            <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
              <div>
                <h2 className="font-display text-lg">Seus produtos / serviços principais</h2>
                <p className="text-xs text-muted-foreground">
                  Liste os produtos que você de fato vende. A IA vai usar exatamente esses como solução pra cada dor que diagnosticar — não inventa nada.
                </p>
              </div>
              <div className="space-y-3">
                {briefingProducts.map((p, idx) => (
                  <div key={idx} className="space-y-2 rounded-md border border-border/40 bg-background/40 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Produto {idx + 1}
                      </span>
                      {briefingProducts.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-destructive hover:text-destructive"
                          onClick={() =>
                            setBriefingProducts((prev) => prev.filter((_, i) => i !== idx))
                          }
                        >
                          <Trash2 className="h-3 w-3" /> Remover
                        </Button>
                      )}
                    </div>
                    <Input
                      placeholder="Nome do produto/serviço"
                      value={p.name}
                      onChange={(e) =>
                        setBriefingProducts((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)),
                        )
                      }
                    />
                    <Textarea
                      placeholder="Descrição curta (o que entrega, pra quem)"
                      rows={2}
                      value={p.description}
                      onChange={(e) =>
                        setBriefingProducts((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, description: e.target.value } : x)),
                        )
                      }
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        placeholder="Preço (ex: R$ 497)"
                        value={p.price_hint}
                        onChange={(e) =>
                          setBriefingProducts((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, price_hint: e.target.value } : x)),
                          )
                        }
                      />
                      <Input
                        placeholder="Link de checkout (opcional)"
                        value={p.link}
                        onChange={(e) =>
                          setBriefingProducts((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, link: e.target.value } : x)),
                          )
                        }
                      />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        placeholder="Duração da sessão (ex: 1 hora)"
                        value={p.session_duration}
                        onChange={(e) =>
                          setBriefingProducts((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, session_duration: e.target.value } : x)),
                          )
                        }
                      />
                      <Input
                        placeholder="Duração do plano (ex: 30 dias)"
                        value={p.plan_duration}
                        onChange={(e) =>
                          setBriefingProducts((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, plan_duration: e.target.value } : x)),
                          )
                        }
                      />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        placeholder="Tipo de entrega (ex: 1:1, grupo, app, presencial)"
                        value={p.tipo_entrega}
                        onChange={(e) =>
                          setBriefingProducts((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, tipo_entrega: e.target.value } : x)),
                          )
                        }
                      />
                      <Input
                        placeholder="Público-alvo deste produto"
                        value={p.publico_alvo}
                        onChange={(e) =>
                          setBriefingProducts((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, publico_alvo: e.target.value } : x)),
                          )
                        }
                      />
                    </div>
                    <Textarea
                      placeholder="Diferencial deste produto (o que só ele entrega)"
                      rows={2}
                      value={p.diferencial}
                      onChange={(e) =>
                        setBriefingProducts((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, diferencial: e.target.value } : x)),
                        )
                      }
                    />
                    <Textarea
                      placeholder="Bônus / garantia incluídos (opcional)"
                      rows={2}
                      value={p.bonus_garantia}
                      onChange={(e) =>
                        setBriefingProducts((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, bonus_garantia: e.target.value } : x)),
                        )
                      }
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Esses campos são SEUS — a IA nunca inventa duração nem valor.
                    </p>
                  </div>
                ))}
              </div>
              {briefingProducts.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() =>
                    setBriefingProducts((prev) => [
                      ...prev,
                      { name: "", description: "", price_hint: "", session_duration: "", plan_duration: "", link: "", tipo_entrega: "", publico_alvo: "", diferencial: "", bonus_garantia: "" },
                    ])
                  }
                >
                  <Plus className="h-3 w-3" /> Adicionar produto
                </Button>
              )}
            </div>
            <div className="flex justify-between gap-3">
              <Button variant="ghost" onClick={() => setStep("list")}>Cancelar</Button>
              <Button
                onClick={handleGenerate}
                disabled={!briefingProducts.some((p) => p.name.trim() && p.description.trim())}
                className="gap-2 transition-transform hover:scale-[1.02]"
              >
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
                    <Label>Permitir pular após (segundos)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={funnel.allow_skip_after_seconds ?? 5}
                      onChange={(e) => setFunnel({ ...funnel, allow_skip_after_seconds: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="rounded-md border border-gold/30 bg-gold/5 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-gold">Identidade de Autoridade</p>
                      <p className="text-[10px] text-gold/60">Configurações para o funil: <span className="font-bold">{funnel.name}</span></p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-[10px] uppercase tracking-wider">Sincronizar Global</Label>
                        <Switch
                          checked={!!funnel.briefing?.use_global_bio}
                          onCheckedChange={(v) => setFunnel({ 
                            ...funnel, 
                            briefing: { ...funnel.briefing, use_global_bio: v } 
                          })}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4 pt-2 border-t border-gold/10">
                    {funnel.briefing?.use_global_bio ? (
                      <div className="rounded bg-gold/10 p-3 text-center">
                        <p className="text-xs text-gold/80 italic">
                          ✨ Sincronização Ativa: Este funil está usando a foto e os dados da sua marca global (Bio).
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-gold/20 border border-gold/30 p-2.5 rounded-md mb-2">
                          <p className="text-[10px] text-gold font-bold uppercase tracking-wider flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
                            Modo Exclusivo Ativo
                          </p>
                          <p className="text-[9px] text-gold/80 mt-1 leading-relaxed">
                            As alterações abaixo afetam <strong>apenas este diagnóstico</strong>. Para usar uma foto diferente em outro funil, basta abrir o editor dele e repetir este processo.
                          </p>
                        </div>
                        <div>
                          <Label className="mb-2 block font-medium">Foto de Autoridade Exclusiva</Label>
                          <ImageUploadWithCrop
                            value={funnel.briefing?.bio_image_url ?? ""}
                            onChange={(url) => setFunnel({ 
                              ...funnel, 
                              briefing: { ...funnel.briefing, bio_image_url: url } 
                            })}
                            folder={`funnels/${activeFunnelId}`}
                          />
                        </div>
                      </div>
                    )}
                    <div className="mt-4 border-t border-gold/5 pt-4">
                      <div className="flex items-center justify-between mb-1">
                        <Label>Texto da Bio (Quem é você...)</Label>
                        <span className="text-[9px] uppercase bg-gold/10 px-2 py-0.5 rounded text-gold/80">Exclusivo deste Funil</span>
                      </div>
                      <Textarea
                        placeholder="Stefany Mello é estrategista de posicionamento..."
                        value={funnel.briefing?.bio_text ?? ""}
                        onChange={(e) => setFunnel({ 
                          ...funnel, 
                          briefing: { ...funnel.briefing, bio_text: e.target.value } 
                        })}
                        rows={5}
                        className="mt-1"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">Este conteúdo aparece na seção de autoridade antes da oferta principal.</p>
                  </div>
                </div>

                <div className="rounded-md border border-primary/30 bg-primary/5 p-3 space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-primary">Tela de obrigado (fallback global)</p>
                  <p className="text-xs text-muted-foreground">Usado quando um produto não tem tela de obrigado própria.</p>
                  <div>
                    <Label>Texto</Label>
                    <Textarea
                      placeholder="Ex: Compra confirmada! Em alguns minutos você recebe o acesso por e-mail."
                      value={funnel.thankyou_text ?? ""}
                      onChange={(e) => setFunnel({ ...funnel, thankyou_text: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label>Mídia (URL)</Label>
                      <Input
                        value={funnel.thankyou_media_url ?? ""}
                        onChange={(e) => setFunnel({ ...funnel, thankyou_media_url: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Tipo</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={funnel.thankyou_media_type ?? ""}
                        onChange={(e) => setFunnel({ ...funnel, thankyou_media_type: e.target.value })}
                      >
                        <option value="">Sem mídia</option>
                        <option value="image">Imagem</option>
                        <option value="video">Vídeo</option>
                        <option value="audio">Áudio</option>
                      </select>
                    </div>
                  </div>
                </div>
            </Card>

            <Card className="space-y-4 p-6">
              <h2 className="font-display text-lg">Perguntas ({questions.length})</h2>
              {questions.map((q, idx) => (
                  <motion.div
                    key={q.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-6 rounded-[24px] border border-gold/20 bg-card/30 p-6 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-gold/10 pb-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="rounded-full border-gold/30 text-gold bg-gold/5">Pergunta {idx + 1}</Badge>
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold">Configuração da Etapa</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteQuestion(idx)}
                        className="rounded-full hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60">Texto da Pergunta</label>
                      <p className="text-[10px] text-gold/60 italic font-light">Este é o título principal que o lead verá no topo da tela.</p>
                      <Textarea
                        value={q.question_text}
                        onChange={(e) => updateQuestion(idx, { question_text: e.target.value })}
                        rows={2}
                        className="rounded-xl border-gold/20 bg-background/40"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60">Subtítulo / Orientação (Opcional)</label>
                      <p className="text-[10px] text-gold/60 italic font-light">Um texto menor para ajudar o lead a refletir sobre a resposta.</p>
                      <Input
                        value={q.subtitle ?? ""}
                        onChange={(e) => updateQuestion(idx, { subtitle: e.target.value })}
                        className="h-12 rounded-xl border-gold/20 bg-background/40"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60">Mídia de Apoio (URL)</label>
                        <p className="text-[10px] text-gold/60 italic font-light">Link da imagem ou vídeo que ilustra a pergunta.</p>
                        <Input
                          placeholder="https://..."
                          value={q.media_url ?? ""}
                          onChange={(e) => updateQuestion(idx, { media_url: e.target.value })}
                          className="h-11 rounded-xl border-gold/20 bg-background/40"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60">Tipo de Mídia</label>
                        <p className="text-[10px] text-gold/60 italic font-light">Selecione o formato correto do arquivo acima.</p>
                        <select
                          className="flex h-11 w-full rounded-xl border border-gold/20 bg-background/40 px-3 py-2 text-xs"
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

                    <div className="flex items-center justify-between rounded-2xl border border-gold/10 bg-gold/5 p-4">
                      <div className="space-y-0.5">
                        <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gold/80">Trava de Segurança</label>
                        <p className="text-[10px] text-muted-foreground/60 italic">Impede que o lead responda antes de ver toda a mídia.</p>
                      </div>
                      <Switch
                        checked={!!q.lock_until_media_ends}
                        onCheckedChange={(v) => updateQuestion(idx, { lock_until_media_ends: v })}
                      />
                    </div>
                  </motion.div>
                ))}
            </Card>

            <Card className="space-y-4 p-6">
              <h2 className="font-display text-lg">Produtos ({products.length})</h2>
              {products.map((p, idx) => (
                <div
                  key={p.id}
                  className={`space-y-3 rounded-md border p-4 transition-opacity ${
                    p.is_active === false ? "border-border/40 bg-muted/30 opacity-70" : "border-border/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <Badge variant="outline">Produto {idx + 1}</Badge>
                      <Badge variant={p.is_active === false ? "secondary" : "default"}>{p.pain_tag}</Badge>
                      {p.is_active === false && (
                        <span className="truncate text-sm text-muted-foreground">— {p.name || "(sem nome)"} (desativado)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Ativo</span>
                        <Switch
                          checked={p.is_active !== false}
                          onCheckedChange={(v) => updateProduct(idx, { is_active: v })}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteProduct(idx)}
                        aria-label="Excluir produto"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {p.is_active !== false && (
                  <>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60">Nome do Produto</label>
                    <p className="text-[10px] text-gold/60 italic font-light">Este nome aparecerá para o lead na tela de resultado.</p>
                    <Input value={p.name} onChange={(e) => updateProduct(idx, { name: e.target.value })} className="h-12 rounded-xl border-gold/20 bg-background/40" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60">Descrição / Pitch de Vendas</label>
                    <p className="text-[10px] text-gold/60 italic font-light">Convença o lead de que este é o produto ideal para ele agora.</p>
                    <Textarea value={p.description ?? ""} onChange={(e) => updateProduct(idx, { description: e.target.value })} rows={3} className="rounded-xl border-gold/20 bg-background/40" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60">Preço ou Condição Especial</label>
                    <p className="text-[10px] text-gold/60 italic font-light">Ex: R$ 497 à vista ou 12x de R$ 49,70.</p>
                    <Input value={p.price_hint ?? ""} onChange={(e) => updateProduct(idx, { price_hint: e.target.value })} className="h-12 rounded-xl border-gold/20 bg-background/40" />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label>Duração da sessão</Label>
                      <Input
                        placeholder="Ex: 1 hora"
                        value={p.session_duration ?? ""}
                        onChange={(e) => updateProduct(idx, { session_duration: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Duração do plano</Label>
                      <Input
                        placeholder="Ex: 30 dias"
                        value={p.plan_duration ?? ""}
                        onChange={(e) => updateProduct(idx, { plan_duration: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60">Mensagem de WhatsApp (Contexto do Produto)</label>
                    <p className="text-[10px] text-gold/60 italic font-light mb-1.5">Esta mensagem aparecerá pronta para o lead enviar quando for qualificado para este produto. Use {"{{nome}}"} para o primeiro nome dele.</p>
                    <Textarea
                      value={p.whatsapp_template ?? ""}
                      onChange={(e) => updateProduct(idx, { whatsapp_template: e.target.value })}
                      rows={3}
                      placeholder="Ex: Olá! Acabei de fazer o diagnóstico e quero saber mais sobre a mentoria..."
                    />
                  </div>
                  <div>
                    <Label>URL de mídia de resultado (opcional)</Label>
                    <Input value={p.result_media_url ?? ""} onChange={(e) => updateProduct(idx, { result_media_url: e.target.value })} />
                  </div>

                  <div className="rounded-md border border-gold/30 bg-gold/5 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-gold">Modo: Oferta Exclusiva do Diagnóstico</Label>
                        <p className="text-[10px] text-muted-foreground">Ativa o layout de alta conversão (âncora + bônus + garantia)</p>
                      </div>
                      <Switch
                        checked={p.benefits?.is_exclusive === true}
                        onCheckedChange={(v) => {
                          const b = typeof p.benefits === 'object' && !Array.isArray(p.benefits) ? p.benefits : { items: Array.isArray(p.benefits) ? p.benefits : [] };
                          updateProduct(idx, { benefits: { ...b, is_exclusive: v } });
                        }}
                      />
                    </div>

                    {p.benefits?.is_exclusive && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <Label className="text-xs">Preço Original (Âncora)</Label>
                          <Input 
                            placeholder="Ex: R$ 694" 
                            value={p.benefits?.original_price ?? ""} 
                            onChange={(e) => {
                              const b = typeof p.benefits === 'object' && !Array.isArray(p.benefits) ? p.benefits : { items: [] };
                              updateProduct(idx, { benefits: { ...b, original_price: e.target.value } });
                            }}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Dias de Garantia</Label>
                          <Input 
                            type="number"
                            value={p.benefits?.guarantee_days ?? 7} 
                            onChange={(e) => {
                              const b = typeof p.benefits === 'object' && !Array.isArray(p.benefits) ? p.benefits : { items: [] };
                              updateProduct(idx, { benefits: { ...b, guarantee_days: parseInt(e.target.value) || 7 } });
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <Label className="text-xs uppercase tracking-widest opacity-70">O que você recebe (Checklist)</Label>
                      <div className="mt-2 space-y-2">
                        {(Array.isArray(p.benefits?.items) ? p.benefits.items : (Array.isArray(p.benefits) ? p.benefits : [])).map((item: string, ii: number) => (
                          <div key={ii} className="flex gap-2">
                            <Input 
                              value={item} 
                              onChange={(e) => {
                                const currentItems = Array.isArray(p.benefits?.items) ? [...p.benefits.items] : (Array.isArray(p.benefits) ? [...p.benefits] : []);
                                currentItems[ii] = e.target.value;
                                const b = typeof p.benefits === 'object' && !Array.isArray(p.benefits) ? p.benefits : { items: [] };
                                updateProduct(idx, { benefits: { ...b, items: currentItems } });
                              }}
                            />
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => {
                                const currentItems = Array.isArray(p.benefits?.items) ? [...p.benefits.items] : (Array.isArray(p.benefits) ? [...p.benefits] : []);
                                const filtered = currentItems.filter((_, i) => i !== ii);
                                const b = typeof p.benefits === 'object' && !Array.isArray(p.benefits) ? p.benefits : { items: [] };
                                updateProduct(idx, { benefits: { ...b, items: filtered } });
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full h-8 text-[10px] border-dashed"
                          onClick={() => {
                            const currentItems = Array.isArray(p.benefits?.items) ? [...p.benefits.items] : (Array.isArray(p.benefits) ? [...p.benefits] : []);
                            const newList = [...currentItems, ""];
                            const b = typeof p.benefits === 'object' && !Array.isArray(p.benefits) ? p.benefits : { items: [] };
                            updateProduct(idx, { benefits: { ...b, items: newList } });
                          }}
                        >
                          + Adicionar item à oferta
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md border border-primary/30 bg-primary/5 p-3 space-y-3">
                    <p className="text-xs font-medium uppercase tracking-wider text-primary">Checkout & Pós-venda</p>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary/80">Modo de Chamada para Ação (CTA)</label>
                      <p className="text-[10px] text-primary/60 italic font-light">Escolha como o lead deve finalizar a compra.</p>
                      <select
                        className="flex h-11 w-full rounded-xl border border-primary/20 bg-background/40 px-3 py-2 text-sm"
                        value={p.cta_mode ?? "whatsapp"}
                        onChange={(e) => updateProduct(idx, { cta_mode: e.target.value })}
                      >
                        <option value="whatsapp">Só WhatsApp (atendimento manual)</option>
                        <option value="checkout">Só checkout (Venda direta automática)</option>
                        <option value="both">Híbrido (Comprar + Tirar dúvida)</option>
                      </select>
                    </div>
                    {(p.cta_mode === "checkout" || p.cta_mode === "both") && (
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary/80">URL do checkout (Link de Pagamento)</label>
                        <p className="text-[10px] text-primary/60 italic font-light">Seu link da Kiwify, Greenn, Hotmart, etc.</p>
                        <Input
                          placeholder="https://pay..."
                          value={p.checkout_url ?? ""}
                          onChange={(e) => updateProduct(idx, { checkout_url: e.target.value })}
                          className="h-11 rounded-xl border-primary/20 bg-background/40"
                        />
                        <p className="mt-1 text-[9px] text-muted-foreground leading-tight italic">
                          DICA: Configure o <strong>Pós-venda</strong> na sua plataforma para este link:{" "}
                          <code className="rounded bg-primary/10 px-1 font-mono">https://axtor.space/obrigado/{funnel?.slug}?p={p.id}</code>
                        </p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60">Texto da tela de obrigado (opcional)</label>
                      <p className="text-[10px] text-gold/60 italic font-light">Sobrescreve o texto padrão da tela de agradecimento. Use {"{{nome}}"} para personalizar.</p>
                      <Textarea
                        placeholder="Sobrescreve o fallback do funil. Use {{nome}} pra personalizar."
                        value={p.thankyou_text ?? ""}
                        onChange={(e) => updateProduct(idx, { thankyou_text: e.target.value })}
                        rows={3}
                        className="rounded-xl border-gold/20 bg-background/40"
                      />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60">Mídia de obrigado (URL)</label>
                        <p className="text-[10px] text-gold/60 italic font-light">Vídeo ou imagem de parabéns após a compra.</p>
                        <Input
                          value={p.thankyou_media_url ?? ""}
                          onChange={(e) => updateProduct(idx, { thankyou_media_url: e.target.value })}
                          className="rounded-xl border-gold/20 bg-background/40"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60">Tipo de Mídia</label>
                        <p className="text-[10px] text-gold/60 italic font-light">Formato da mídia acima.</p>
                        <select
                          className="flex h-10 w-full rounded-xl border border-gold/20 bg-background/40 px-3 py-2 text-xs"
                          value={p.thankyou_media_type ?? ""}
                          onChange={(e) => updateProduct(idx, { thankyou_media_type: e.target.value })}
                        >
                          <option value="">Sem mídia</option>
                          <option value="image">Imagem</option>
                          <option value="video">Vídeo</option>
                          <option value="audio">Áudio</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60">Mensagem WhatsApp pós-compra (opcional)</label>
                      <p className="text-[10px] text-gold/60 italic font-light">Mensagem que o lead envia após finalizar o checkout.</p>
                      <Textarea
                        placeholder="Ex: Oi! Acabei de comprar X, qual o próximo passo?"
                        value={p.thankyou_whatsapp_template ?? ""}
                        onChange={(e) => updateProduct(idx, { thankyou_whatsapp_template: e.target.value })}
                        rows={2}
                        className="rounded-xl border-gold/20 bg-background/40"
                      />
                    </div>
                  </div>
                  </>
                  )}
                </div>
              ))}
              <Button variant="outline" onClick={addProduct} className="w-full gap-2">
                <Plus className="h-4 w-4" /> Adicionar produto
              </Button>
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