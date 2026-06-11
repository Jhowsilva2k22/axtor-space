import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useDeepDiagnostic } from "@/hooks/useDeepDiagnostic";
import { useCredits, FUNNEL_COST } from "@/hooks/useCredits";
import { toast } from "@/hooks/use-toast";
import { CreditsBlockModal } from "@/components/CreditsBlockModal";

export type BriefingProduct = {
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

type BriefingField = {
  key: string;
  label: string;
  placeholder: string;
  inputType?: "input";
  maxLength?: number;
  minLength?: number;
  hint?: string;
};

const BRIEFING_FIELDS: BriefingField[] = [
  {
    key: "business_name",
    label: "Nome do seu negócio/marca *",
    placeholder: "Ex: Sua Marca Consultoria",
    inputType: "input",
    maxLength: 80,
  },
  { key: "niche", label: "Nicho específico *", placeholder: "Ex: Mentoria pra um público específico que você atende" },
  { key: "ideal_client", label: "Quem é seu cliente ideal? (perfil, idade, momento) *", placeholder: "Ex: Faixa etária, profissão, momento de vida e faturamento médio" },
  { key: "main_pain", label: "Qual a maior dor que você resolve? *", placeholder: "Ex: A principal frustração que seu cliente sente hoje" },
  { key: "transformation", label: "Que transformação você entrega? *", placeholder: "Ex: De [estado atual] para [estado desejado] em [prazo]" },
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
  {
    key: "bio_text",
    label: "Bio / Sua história",
    placeholder: 'Ex: Sou coach de finanças pessoais há 8 anos. Comecei do zero após perder meu emprego em 2016 e hoje já ajudei mais de 500 pessoas a sair do vermelho e construir reservas reais. Meu método combina planilhas simples com mudança de mentalidade — sem enrolação.',
    minLength: 200,
    hint: "Aparece no funil antes da oferta principal. Quanto mais pessoal e específica, maior a conexão com o lead.",
  },
];

const EMPTY_PRODUCT: BriefingProduct = {
  name: "",
  description: "",
  price_hint: "",
  session_duration: "",
  plan_duration: "",
  link: "",
  tipo_entrega: "",
  publico_alvo: "",
  diferencial: "",
  bonus_garantia: "",
};

type BriefingWizardProps = {
  tenantId: string;
  onGenerated: (funnelId: string) => void;
  onCancel: () => void;
  initialBriefing?: Record<string, string>;
  initialProducts?: BriefingProduct[];
  initialFunnelId?: string;
};

export const BriefingWizard = ({ tenantId, onGenerated, onCancel, initialBriefing, initialProducts, initialFunnelId }: BriefingWizardProps) => {
  const isEditMode = !!(initialBriefing && Object.keys(initialBriefing).length > 0);
  const { refresh } = useDeepDiagnostic();
  const { credits } = useCredits();
  const [showCreditsBlock, setShowCreditsBlock] = useState(false);
  const [briefing, setBriefing] = useState<Record<string, string>>(initialBriefing ?? {});
  const [briefingProducts, setBriefingProducts] = useState<BriefingProduct[]>(
    initialProducts && initialProducts.length > 0 ? initialProducts : [{ ...EMPTY_PRODUCT }]
  );
  const [generating, setGenerating] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [keepProducts, setKeepProducts] = useState<boolean | null>(null);
  const [productsConfirmed, setProductsConfirmed] = useState(false);
  const productsRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async (keepProductsOverride?: boolean) => {
    if (!tenantId) return;
    const required = ["business_name", "niche", "ideal_client", "main_pain", "transformation"];
    const missing = required.filter((k) => !briefing[k]?.trim());
    if (missing.length) {
      toast({
        title: "Preencha os campos essenciais",
        description: missing.join(", "),
        variant: "destructive",
      });
      return;
    }
    // Sem os créditos pra gerar (a função cobra FUNNEL_COST)? Abre o modal e
    // nem chama a IA. O backend ainda é a trava autoritativa (retorna 402).
    if (credits && credits.total < FUNNEL_COST) {
      setShowCreditsBlock(true);
      return;
    }
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
          tipo_entrega: p.tipo_entrega.trim(),
          publico_alvo: p.publico_alvo.trim(),
          diferencial: p.diferencial.trim(),
          bonus_garantia: p.bonus_garantia.trim(),
        }))
        .filter((p) => p.name.length > 0);
      const effectiveKeepProducts = keepProductsOverride ?? keepProducts;
      const { data, error } = await supabase.functions.invoke("generate-deep-funnel", {
        body: {
          tenant_id: tenantId,
          briefing: { ...briefing, products: cleanProducts },
          ...(isEditMode && initialFunnelId ? { funnel_id: initialFunnelId } : {}),
          ...(effectiveKeepProducts === true ? { keep_products: true } : {}),
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: "Funil gerado!", description: "Abrindo editor pra revisar." });
      await refresh();
      onGenerated((data as any).funnel_id);
    } catch (e: any) {
      // 402 = a função recusou por falta de crédito (backstop do proativo).
      if (e?.context?.status === 402) {
        setShowCreditsBlock(true);
        setGenerating(false);
        return;
      }
      console.error(e);
      toast({
        title: "Erro ao gerar funil",
        description: e?.message ?? "Tente novamente",
        variant: "destructive",
      });
      setGenerating(false);
    }
  };

  const hasValidProduct = briefingProducts.some(
    (p) => p.name.trim() && p.description.trim()
  );

  if (generating) {
    return (
      <motion.div
        key="generating"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="flex flex-col items-center justify-center gap-4 p-16 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
          >
            <Sparkles className="h-10 w-10 text-primary" />
          </motion.div>
          <h2 className="font-display text-2xl">
            {keepProducts === true ? "Atualizando perguntas..." : "Gerando seu funil..."}
          </h2>
          <p className="text-sm text-muted-foreground">
            {keepProducts === true
              ? "A IA está remontando as 12 perguntas com base no briefing atualizado. Uns 20 segundos."
              : "A IA está montando 12 perguntas e os produtos. Isso leva uns 30 segundos."}
          </p>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="briefing"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card className="space-y-4 p-6">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl">
            {isEditMode ? "Refazer briefing" : "Briefing profundo"}
          </h1>
          {isEditMode && (
            <span className="text-[11px] uppercase tracking-widest font-medium px-2.5 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20">
              Editando
            </span>
          )}
        </div>
        {isEditMode ? (
          <p className="text-sm text-muted-foreground">
            Os dados do briefing anterior já estão preenchidos. Ajuste o que quiser e gere um novo funil.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Quanto mais detalhe você der, mais sob medida o funil fica. Os 5 primeiros campos são obrigatórios.
          </p>
        )}

        {BRIEFING_FIELDS.map((field) => {
          const value = briefing[field.key] ?? "";
          const len = value.length;

          if (field.inputType === "input" && field.maxLength) {
            const atLimit = len >= field.maxLength;
            return (
              <div key={field.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <span className={`text-xs tabular-nums ${atLimit ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                    {len}/{field.maxLength}
                  </span>
                </div>
                <Input
                  id={field.key}
                  placeholder={field.placeholder}
                  value={value}
                  maxLength={field.maxLength}
                  onChange={(e) => setBriefing((prev) => ({ ...prev, [field.key]: e.target.value }))}
                />
                {atLimit && (
                  <p className="text-xs text-destructive">
                    Limite de {field.maxLength} caracteres atingido — nomes longos quebram o layout do funil.
                  </p>
                )}
              </div>
            );
          }

          if (field.minLength) {
            const hasContent = len > 0;
            const insufficient = hasContent && len < field.minLength;
            const sufficient = len >= field.minLength;
            return (
              <div key={field.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <span className={`text-xs tabular-nums ${insufficient ? "text-amber-500" : sufficient ? "text-emerald-500" : "text-muted-foreground"}`}>
                    {len}/{field.minLength} mín.
                  </span>
                </div>
                <Textarea
                  id={field.key}
                  placeholder={field.placeholder}
                  value={value}
                  onChange={(e) => setBriefing((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  className="min-h-[120px]"
                />
                {field.hint && !insufficient && (
                  <p className="text-xs text-muted-foreground">{field.hint}</p>
                )}
                {insufficient && (
                  <p className="text-xs text-amber-500">
                    Adicione mais {field.minLength - len} caracteres — bio curta reduz a personalização do funil.
                  </p>
                )}
              </div>
            );
          }

          return (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>{field.label}</Label>
              <Textarea
                id={field.key}
                placeholder={field.placeholder}
                value={value}
                onChange={(e) => setBriefing((prev) => ({ ...prev, [field.key]: e.target.value }))}
                className="min-h-[80px]"
              />
            </div>
          );
        })}

        <div ref={productsRef} className="space-y-3 pt-4">
          <div>
            <h2 className="font-display text-xl">Seus produtos / serviços principais</h2>
            <p className="text-xs text-muted-foreground">
              Liste os produtos que você de fato vende. A IA vai usar exatamente esses como solução pra cada dor que diagnosticar — não inventa nada.
            </p>
          </div>

          {briefingProducts.map((p, idx) => (
            <Card key={idx} className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  Produto {idx + 1}
                </span>
                {briefingProducts.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
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
                    prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x))
                  )
                }
              />
              <Textarea
                placeholder="Descrição curta (o que entrega, pra quem)"
                value={p.description}
                onChange={(e) =>
                  setBriefingProducts((prev) =>
                    prev.map((x, i) => (i === idx ? { ...x, description: e.target.value } : x))
                  )
                }
                className="min-h-[70px]"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  placeholder="Preço (ex: R$ 497)"
                  value={p.price_hint}
                  onChange={(e) =>
                    setBriefingProducts((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, price_hint: e.target.value } : x))
                    )
                  }
                />
                <Input
                  placeholder="Link de checkout (opcional)"
                  value={p.link}
                  onChange={(e) =>
                    setBriefingProducts((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, link: e.target.value } : x))
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
                      prev.map((x, i) =>
                        i === idx ? { ...x, session_duration: e.target.value } : x
                      )
                    )
                  }
                />
                <Input
                  placeholder="Duração do plano (ex: 30 dias)"
                  value={p.plan_duration}
                  onChange={(e) =>
                    setBriefingProducts((prev) =>
                      prev.map((x, i) =>
                        i === idx ? { ...x, plan_duration: e.target.value } : x
                      )
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
                      prev.map((x, i) =>
                        i === idx ? { ...x, tipo_entrega: e.target.value } : x
                      )
                    )
                  }
                />
                <Input
                  placeholder="Público-alvo deste produto"
                  value={p.publico_alvo}
                  onChange={(e) =>
                    setBriefingProducts((prev) =>
                      prev.map((x, i) =>
                        i === idx ? { ...x, publico_alvo: e.target.value } : x
                      )
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
                    prev.map((x, i) =>
                      i === idx ? { ...x, diferencial: e.target.value } : x
                    )
                  )
                }
              />
              <Textarea
                placeholder="Bônus / garantia incluídos (opcional)"
                rows={2}
                value={p.bonus_garantia}
                onChange={(e) =>
                  setBriefingProducts((prev) =>
                    prev.map((x, i) =>
                      i === idx ? { ...x, bonus_garantia: e.target.value } : x
                    )
                  )
                }
              />
              <p className="text-[10px] text-muted-foreground">
                Esses campos são SEUS — a IA nunca inventa duração nem valor.
              </p>
            </Card>
          ))}

          {briefingProducts.length < 5 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setBriefingProducts((prev) => [...prev, { ...EMPTY_PRODUCT }])}
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> Adicionar produto
            </Button>
          )}

          {isEditMode && keepProducts === false && (
            <div className="flex items-center gap-3 rounded-lg border border-gold/20 bg-gold/5 p-3">
              <Checkbox
                id="products-confirmed"
                checked={productsConfirmed}
                onCheckedChange={(checked) => setProductsConfirmed(checked === true)}
              />
              <label htmlFor="products-confirmed" className="text-sm cursor-pointer select-none">
                Produtos atualizados ✓
              </label>
            </div>
          )}
        </div>
      </Card>

      <div className="flex justify-between gap-3">
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          onClick={() => {
            if (isEditMode && keepProducts === null) {
              setShowProductDialog(true);
            } else {
              handleGenerate();
            }
          }}
          disabled={!hasValidProduct || (isEditMode && keepProducts === false && !productsConfirmed)}
          className="gap-2 transition-transform hover:scale-[1.02]"
        >
          <Sparkles className="h-4 w-4" />
          {isEditMode ? "Atualizar Funil" : "Gerar funil com IA"}
        </Button>
      </div>

      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deseja manter os produtos atuais?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Se os seus produtos não mudaram, a IA só refaz as perguntas do quiz. Se quiser atualizar os produtos, edite-os no formulário e confirme antes de gerar.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={() => {
                setKeepProducts(true);
                setShowProductDialog(false);
                handleGenerate(true);
              }}
            >
              Sim, manter os produtos atuais
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setKeepProducts(false);
                setShowProductDialog(false);
                productsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              Vou atualizar os produtos
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CreditsBlockModal
        open={showCreditsBlock}
        onClose={() => setShowCreditsBlock(false)}
      />
    </motion.div>
  );
};
