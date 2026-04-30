import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Sparkles, Loader2, ExternalLink, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDeepDiagnostic } from "@/hooks/useDeepDiagnostic";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ImageUploadWithCrop } from "@/components/ImageUploadWithCrop";
import { FieldWithHint } from "@/components/imersivo/atomic/FieldWithHint";
import { SwitchField } from "@/components/imersivo/atomic/SwitchField";
import { MediaUrlPicker } from "@/components/imersivo/atomic/MediaUrlPicker";
import { DeleteIconButton } from "@/components/imersivo/atomic/DeleteIconButton";
import { ReviewSectionCard } from "@/components/imersivo/atomic/ReviewSectionCard";
import { ReviewBoasVindasCard } from "@/components/imersivo/cards/ReviewBoasVindasCard";
import { ReviewQuestionsCard } from "@/components/imersivo/cards/ReviewQuestionsCard";
import { ProductCardHeader } from "@/components/imersivo/cards/ProductCardHeader";

export default function DeepDiagnosticEditor() {
  const navigate = useNavigate();
  const { hasAddon, funnels, loading, refresh, tenantId } = useDeepDiagnostic();
  const [activeFunnelId, setActiveFunnelId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [funnel, setFunnel] = useState<any>(null);
  const [saving, setSaving] = useState<false | "draft" | "publish">(false);

  const [searchParams] = useSearchParams();
  const funnelId = searchParams.get("funnelId");

  useEffect(() => {
    if (!loading && hasAddon === false) {
      navigate("/admin/deep-diagnostic/demo", { replace: true });
    }
  }, [hasAddon, loading, navigate]);

  useEffect(() => {
    if (funnelId && funnels.length > 0 && activeFunnelId !== funnelId) {
      loadFunnel(funnelId);
    }
  }, [funnelId, funnels, activeFunnelId]);

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
    setSaving(publish ? "publish" : "draft");
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
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!funnelId) return <Navigate to="/painel?tab=imersivo" replace />;

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

        {funnel && (
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
              <Button variant="ghost" onClick={() => navigate("/painel?tab=imersivo")}>← Voltar</Button>
            </div>

            <ReviewBoasVindasCard
              funnel={funnel}
              onFunnelChange={(patch) => setFunnel((prev: any) => ({ ...prev, ...patch }))}
              activeFunnelId={activeFunnelId}
            />

            <ReviewQuestionsCard
              questions={questions}
              onUpdate={(idx, patch) => updateQuestion(idx, patch)}
              onDelete={(idx) => deleteQuestion(idx)}
            />

            <ReviewSectionCard title={`Produtos (${products.length})`}>
              {products.map((p, idx) => (
                <div
                  key={p.id}
                  className={`space-y-3 rounded-md border p-4 transition-opacity ${
                    p.is_active === false ? "border-border/40 bg-muted/30 opacity-70" : "border-border/60"
                  }`}
                >
                  <ProductCardHeader
                    index={idx}
                    painTag={p.pain_tag}
                    isActive={p.is_active !== false}
                    name={p.name}
                    onActiveChange={(v) => updateProduct(idx, { is_active: v })}
                    onDelete={() => deleteProduct(idx)}
                  />
                  {p.is_active !== false && (
                  <>
                  <FieldWithHint
                    label="Nome do Produto"
                    hint="Este nome aparecerá para o lead na tela de resultado."
                    className="space-y-1"
                  >
                    <Input value={p.name} onChange={(e) => updateProduct(idx, { name: e.target.value })} className="h-12 rounded-xl border-gold/20 bg-background/40" />
                  </FieldWithHint>
                  <FieldWithHint
                    label="Descrição / Pitch de Vendas"
                    hint="Convença o lead de que este é o produto ideal para ele agora."
                    className="space-y-1"
                  >
                    <Textarea value={p.description ?? ""} onChange={(e) => updateProduct(idx, { description: e.target.value })} rows={3} className="rounded-xl border-gold/20 bg-background/40" />
                  </FieldWithHint>
                  <FieldWithHint
                    label="Preço ou Condição Especial"
                    hint="Ex: R$ 497 à vista ou 12x de R$ 49,70."
                    className="space-y-1"
                  >
                    <Input value={p.price_hint ?? ""} onChange={(e) => updateProduct(idx, { price_hint: e.target.value })} className="h-12 rounded-xl border-gold/20 bg-background/40" />
                  </FieldWithHint>
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
                  <FieldWithHint
                    label="Mensagem de WhatsApp (Contexto do Produto)"
                    hint="Esta mensagem aparecerá pronta para o lead enviar quando for qualificado para este produto. Use {{nome}} para o primeiro nome dele."
                    className="space-y-0"
                    hintClassName="mb-1.5"
                  >
                    <Textarea
                      value={p.whatsapp_template ?? ""}
                      onChange={(e) => updateProduct(idx, { whatsapp_template: e.target.value })}
                      rows={3}
                      placeholder="Ex: Olá! Acabei de fazer o diagnóstico e quero saber mais sobre a mentoria..."
                    />
                  </FieldWithHint>
                  <div>
                    <Label>URL de mídia de resultado (opcional)</Label>
                    <Input value={p.result_media_url ?? ""} onChange={(e) => updateProduct(idx, { result_media_url: e.target.value })} />
                  </div>

                  <div className="rounded-md border border-gold/30 bg-gold/5 p-4 space-y-4">
                    <SwitchField
                      label="Modo: Oferta Exclusiva do Diagnóstico"
                      hint="Ativa o layout de alta conversão (âncora + bônus + garantia)"
                      checked={p.benefits?.is_exclusive === true}
                      onCheckedChange={(v) => {
                        const b = typeof p.benefits === 'object' && !Array.isArray(p.benefits) ? p.benefits : { items: Array.isArray(p.benefits) ? p.benefits : [] };
                        updateProduct(idx, { benefits: { ...b, is_exclusive: v } });
                      }}
                      className="rounded-none border-0 p-0"
                      textWrapperClassName="space-y-0.5"
                      labelClassName="text-gold"
                      hintClassName="text-[10px] text-muted-foreground"
                    />

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
                            <DeleteIconButton
                              onClick={() => {
                                const currentItems = Array.isArray(p.benefits?.items) ? [...p.benefits.items] : (Array.isArray(p.benefits) ? [...p.benefits] : []);
                                const filtered = currentItems.filter((_, i) => i !== ii);
                                const b = typeof p.benefits === 'object' && !Array.isArray(p.benefits) ? p.benefits : { items: [] };
                                updateProduct(idx, { benefits: { ...b, items: filtered } });
                              }}
                              iconClassName="h-3 w-3"
                            />
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
                    <FieldWithHint
                      label="Modo de Chamada para Ação (CTA)"
                      hint="Escolha como o lead deve finalizar a compra."
                      className="space-y-1"
                      labelClassName="text-primary/80"
                      hintClassName="text-primary/60"
                    >
                      <select
                        className="flex h-11 w-full rounded-xl border border-primary/20 bg-background/40 px-3 py-2 text-sm"
                        value={p.cta_mode ?? "whatsapp"}
                        onChange={(e) => updateProduct(idx, { cta_mode: e.target.value })}
                      >
                        <option value="whatsapp">Só WhatsApp (atendimento manual)</option>
                        <option value="checkout">Só checkout (Venda direta automática)</option>
                        <option value="both">Híbrido (Comprar + Tirar dúvida)</option>
                      </select>
                    </FieldWithHint>
                    {(p.cta_mode === "checkout" || p.cta_mode === "both") && (
                      <FieldWithHint
                        label="URL do checkout (Link de Pagamento)"
                        hint="Seu link da Kiwify, Greenn, Hotmart, etc."
                        className="space-y-1"
                        labelClassName="text-primary/80"
                        hintClassName="text-primary/60"
                      >
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
                      </FieldWithHint>
                    )}
                    <FieldWithHint
                      label="Texto da tela de obrigado (opcional)"
                      hint="Sobrescreve o texto padrão da tela de agradecimento. Use {{nome}} para personalizar."
                      className="space-y-1"
                    >
                      <Textarea
                        placeholder="Sobrescreve o fallback do funil. Use {{nome}} pra personalizar."
                        value={p.thankyou_text ?? ""}
                        onChange={(e) => updateProduct(idx, { thankyou_text: e.target.value })}
                        rows={3}
                        className="rounded-xl border-gold/20 bg-background/40"
                      />
                    </FieldWithHint>
                    <MediaUrlPicker
                      urlLabel="Mídia de obrigado (URL)"
                      urlHint="Vídeo ou imagem de parabéns após a compra."
                      typeLabel="Tipo de Mídia"
                      typeHint="Formato da mídia acima."
                      fieldClassName="space-y-1"
                      urlValue={p.thankyou_media_url ?? ""}
                      onUrlChange={(v) => updateProduct(idx, { thankyou_media_url: v })}
                      typeValue={p.thankyou_media_type ?? ""}
                      onTypeChange={(v) => updateProduct(idx, { thankyou_media_type: v })}
                    />
                    <FieldWithHint
                      label="Mensagem WhatsApp pós-compra (opcional)"
                      hint="Mensagem que o lead envia após finalizar o checkout."
                      className="space-y-1"
                    >
                      <Textarea
                        placeholder="Ex: Oi! Acabei de comprar X, qual o próximo passo?"
                        value={p.thankyou_whatsapp_template ?? ""}
                        onChange={(e) => updateProduct(idx, { thankyou_whatsapp_template: e.target.value })}
                        rows={2}
                        className="rounded-xl border-gold/20 bg-background/40"
                      />
                    </FieldWithHint>
                  </div>
                  </>
                  )}
                </div>
              ))}
              <Button variant="outline" onClick={addProduct} className="w-full gap-2">
                <Plus className="h-4 w-4" /> Adicionar produto
              </Button>
            </ReviewSectionCard>

            <div className="sticky bottom-4 flex justify-end gap-2 rounded-md border border-border bg-card p-3 shadow-lg">
              <Button
                variant="outline"
                onClick={() => saveAll(false)}
                disabled={!!saving}
                className="gap-2"
              >
                {saving === "draft" ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
                ) : (
                  "Salvar rascunho"
                )}
              </Button>
              <Button
                onClick={() => saveAll(true)}
                disabled={!!saving}
                className="gap-2"
              >
                {saving === "publish" ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Publicando...</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Publicar funil</>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}