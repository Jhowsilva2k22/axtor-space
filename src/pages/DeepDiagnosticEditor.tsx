import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
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
                  <SwitchField
                    label="Travar opções até o vídeo/áudio terminar"
                    hint="Aplica-se a perguntas com mídia"
                    checked={!!funnel.lock_until_media_ends}
                    onCheckedChange={(v) => setFunnel({ ...funnel, lock_until_media_ends: v })}
                  />
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
                  <MediaUrlPicker
                    variant="plain"
                    urlValue={funnel.thankyou_media_url ?? ""}
                    onUrlChange={(v) => setFunnel({ ...funnel, thankyou_media_url: v })}
                    typeValue={funnel.thankyou_media_type ?? ""}
                    onTypeChange={(v) => setFunnel({ ...funnel, thankyou_media_type: v })}
                  />
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
                      <DeleteIconButton
                        onClick={() => deleteQuestion(idx)}
                        className="rounded-full hover:bg-destructive/10 hover:text-destructive"
                      />
                    </div>

                    <FieldWithHint
                      label="Texto da Pergunta"
                      hint="Este é o título principal que o lead verá no topo da tela."
                    >
                      <Textarea
                        value={q.question_text}
                        onChange={(e) => updateQuestion(idx, { question_text: e.target.value })}
                        rows={2}
                        className="rounded-xl border-gold/20 bg-background/40"
                      />
                    </FieldWithHint>

                    <FieldWithHint
                      label="Subtítulo / Orientação (Opcional)"
                      hint="Um texto menor para ajudar o lead a refletir sobre a resposta."
                    >
                      <Input
                        value={q.subtitle ?? ""}
                        onChange={(e) => updateQuestion(idx, { subtitle: e.target.value })}
                        className="h-12 rounded-xl border-gold/20 bg-background/40"
                      />
                    </FieldWithHint>

                    <MediaUrlPicker
                      className="grid gap-4 md:grid-cols-2"
                      urlLabel="Mídia de Apoio (URL)"
                      urlHint="Link da imagem ou vídeo que ilustra a pergunta."
                      typeLabel="Tipo de Mídia"
                      typeHint="Selecione o formato correto do arquivo acima."
                      inputPlaceholder="https://..."
                      inputClassName="h-11 rounded-xl border-gold/20 bg-background/40"
                      selectClassName="flex h-11 w-full rounded-xl border border-gold/20 bg-background/40 px-3 py-2 text-xs"
                      urlValue={q.media_url ?? ""}
                      onUrlChange={(v) => updateQuestion(idx, { media_url: v })}
                      typeValue={q.media_type ?? ""}
                      onTypeChange={(v) => updateQuestion(idx, { media_type: v })}
                    />

                    <SwitchField
                      label="Trava de Segurança"
                      hint="Impede que o lead responda antes de ver toda a mídia."
                      checked={!!q.lock_until_media_ends}
                      onCheckedChange={(v) => updateQuestion(idx, { lock_until_media_ends: v })}
                      className="rounded-2xl border-gold/10 bg-gold/5 p-4"
                      textWrapperClassName="space-y-0.5"
                      labelClassName="text-[10px] uppercase tracking-[0.2em] font-bold text-gold/80"
                      hintClassName="text-[10px] text-muted-foreground/60 italic"
                    />
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
                      <DeleteIconButton
                        onClick={() => deleteProduct(idx)}
                        ariaLabel="Excluir produto"
                        iconClassName="text-destructive"
                      />
                    </div>
                  </div>
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