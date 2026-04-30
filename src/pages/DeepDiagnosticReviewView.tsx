import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDeepDiagnostic } from "@/hooks/useDeepDiagnostic";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ReviewBoasVindasCard } from "@/components/imersivo/cards/ReviewBoasVindasCard";
import { ReviewQuestionsCard } from "@/components/imersivo/cards/ReviewQuestionsCard";
import { ReviewProductsCard } from "@/components/imersivo/cards/ReviewProductsCard";

type DeepDiagnosticReviewViewProps = {
  funnelId: string;
};

export function DeepDiagnosticReviewView({ funnelId }: DeepDiagnosticReviewViewProps) {
  const navigate = useNavigate();
  const { funnels, refresh, tenantId } = useDeepDiagnostic();
  const [activeFunnelId, setActiveFunnelId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [funnel, setFunnel] = useState<any>(null);
  const [saving, setSaving] = useState<false | "draft" | "publish">(false);

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

      if (tenantId && funnel.briefing?.use_global_bio && funnel.briefing?.bio_image_url) {
        await supabase.from("bio_config").update({
          avatar_url: funnel.briefing.bio_image_url,
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

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="gap-2">
            <Link to="/admin">
              <ArrowLeft className="h-4 w-4" /> Painel
            </Link>
          </Button>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Diagnóstico Profundo
          </div>
        </div>

        {!funnel && (
          <div className="flex min-h-[200px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

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
              <Button variant="ghost" onClick={() => navigate("/painel?tab=imersivo")}>
                ← Voltar pra lista
              </Button>
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

            <ReviewProductsCard
              products={products}
              funnelSlug={funnel?.slug}
              onUpdate={updateProduct}
              onAdd={addProduct}
              onDelete={deleteProduct}
            />

            <div className="sticky bottom-4 flex justify-end gap-2 rounded-md border border-border bg-card p-3 shadow-lg">
              <Button
                variant="outline"
                onClick={() => saveAll(false)}
                disabled={!!saving}
                className="gap-2"
              >
                {saving === "draft" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
                  </>
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
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Publicando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Publicar funil
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
