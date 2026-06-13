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
import { Sparkles, Plus, Trash2, ChevronLeft, ChevronRight, Target, Check } from "lucide-react";
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
  tipo: string;          // produto | aula | live | grupo
  is_principal: boolean;  // 1 principal + até 2 secundários
  imagem_url: string;     // capa opcional
};

// Objetivo do diagnóstico — enquadra a geração da IA.
const OBJETIVOS = [
  { key: "vender_produto", label: "Vender um produto", desc: "Levar o lead a comprar uma oferta sua." },
  { key: "aula", label: "Aula / aulão", desc: "Inscrever o lead numa aula ou aulão." },
  { key: "live", label: "Live", desc: "Levar o lead pra uma transmissão ao vivo." },
  { key: "grupo", label: "Grupo no WhatsApp", desc: "Entrar num grupo/comunidade." },
  { key: "agendar", label: "Agendar conversa", desc: "Marcar uma conversa ou diagnóstico 1:1." },
];

const NICHE_PRESETS = [
  "Coach / Mentor",
  "Criador de conteúdo",
  "Infoprodutor",
  "E-commerce",
  "Negócio local",
  "Prestador de serviço",
  "Saúde / bem-estar",
  "Educação / cursos",
];

const TIPOS_DESTINO = [
  { key: "produto", label: "Produto" },
  { key: "aula", label: "Aula" },
  { key: "live", label: "Live" },
  { key: "grupo", label: "Grupo" },
];

const QUANTIDADES = [5, 8, 12];

const CENARIOS = [
  { key: "educar", label: "Educar", desc: "Acolhedor, notas generosas, ensina o caminho." },
  { key: "equilibrado", label: "Equilibrado", desc: "Honesto e direto, notas calibradas. (padrão)" },
  { key: "conversao", label: "Conversão", desc: "Régua dura mas honesta, puxa urgência." },
];

// Campo essencial (passo Briefing). business_name e niche têm UI própria.
const ESSENTIAL_TEXTAREAS = [
  { key: "ideal_client", label: "Quem é seu cliente ideal? *", placeholder: "Ex: Faixa etária, profissão, momento de vida" },
  { key: "main_pain", label: "Qual a maior dor que você resolve? *", placeholder: "Ex: A principal frustração que ele sente hoje" },
  { key: "transformation", label: "Que transformação você entrega? *", placeholder: "Ex: De [estado atual] para [estado desejado]" },
];

const EXTRA_FIELDS = [
  { key: "tone_of_voice", label: "Tom de voz (3-5 adjetivos)", placeholder: "Ex: Direto, acolhedor, sem floreio" },
  { key: "objections", label: "Top 3 objeções que mais escuta", placeholder: "Ex: Não tenho tempo / Já tentei / É caro" },
  { key: "best_offer", label: "Sua oferta principal hoje", placeholder: "Ex: Produto + duração + faixa de preço" },
  { key: "channels", label: "Por onde vende hoje?", placeholder: "Ex: Instagram + WhatsApp + indicação" },
  { key: "differentials", label: "O que te torna diferente?", placeholder: "Ex: Método ou abordagem que só você tem" },
  { key: "results", label: "Maior resultado que entregou", placeholder: "Ex: Resultado concreto de um cliente real" },
  { key: "goal_3_months", label: "Sua meta nos próximos 3 meses", placeholder: "Ex: Faturamento, nº de clientes ou marco" },
  { key: "bio_text", label: "Bio / Sua história", placeholder: "Conta sua trajetória — aparece no funil antes da oferta.", min: 200, hint: "Quanto mais pessoal, maior a conexão com o lead." },
] as const;

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
  tipo: "produto",
  is_principal: false,
  imagem_url: "",
};

type BriefingWizardProps = {
  tenantId: string;
  onGenerated: (funnelId: string) => void;
  onCancel: () => void;
  initialBriefing?: Record<string, string>;
  initialProducts?: BriefingProduct[];
  initialFunnelId?: string;
};

const STEPS = ["Objetivo", "Briefing", "Destinos", "Configuração"];

export const BriefingWizard = ({ tenantId, onGenerated, onCancel, initialBriefing, initialProducts, initialFunnelId }: BriefingWizardProps) => {
  const isEditMode = !!(initialBriefing && Object.keys(initialBriefing).length > 0);
  const { refresh } = useDeepDiagnostic();
  const { credits } = useCredits();

  const [step, setStep] = useState(0);
  const [showCreditsBlock, setShowCreditsBlock] = useState(false);
  const [briefing, setBriefing] = useState<Record<string, string>>(initialBriefing ?? {});
  const [objetivo, setObjetivo] = useState<string>((initialBriefing?.objetivo as string) ?? "");
  const [numPerguntas, setNumPerguntas] = useState<number>(Number(initialBriefing?.num_perguntas) || 12);
  const [cenario, setCenario] = useState<string>((initialBriefing?.cenario as string) || "equilibrado");
  const [showExtra, setShowExtra] = useState(false);
  const [briefingProducts, setBriefingProducts] = useState<BriefingProduct[]>(() => {
    const base = initialProducts && initialProducts.length > 0
      ? initialProducts.map((p) => ({ ...EMPTY_PRODUCT, ...p }))
      : [{ ...EMPTY_PRODUCT, is_principal: true }];
    if (!base.some((p) => p.is_principal)) base[0].is_principal = true;
    return base.slice(0, 3);
  });
  const [generating, setGenerating] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [keepProducts, setKeepProducts] = useState<boolean | null>(null);
  const [productsConfirmed, setProductsConfirmed] = useState(false);
  const productsRef = useRef<HTMLDivElement>(null);

  const setProd = (idx: number, patch: Partial<BriefingProduct>) =>
    setBriefingProducts((prev) => prev.map((x, i) => (i === idx ? { ...x, ...patch } : x)));

  const setPrincipal = (idx: number) =>
    setBriefingProducts((prev) => prev.map((x, i) => ({ ...x, is_principal: i === idx })));

  const hasPrincipalName = briefingProducts.some((p) => p.is_principal && p.name.trim());
  const hasValidProduct = briefingProducts.some((p) => p.name.trim() && p.description.trim());

  const stepValid = (s: number): boolean => {
    if (s === 0) return !!objetivo;
    if (s === 1) return ["business_name", "niche", "ideal_client", "main_pain", "transformation"].every((k) => briefing[k]?.trim());
    if (s === 2) return hasPrincipalName;
    return true;
  };

  const next = () => {
    if (!stepValid(step)) {
      toast({ title: "Falta preencher esse passo", description: "Complete os campos obrigatórios pra avançar.", variant: "destructive" });
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleGenerate = async (keepProductsOverride?: boolean) => {
    if (!tenantId) return;
    if (!stepValid(0) || !stepValid(1) || !stepValid(2)) {
      toast({ title: "Briefing incompleto", description: "Revise objetivo, briefing e destino principal.", variant: "destructive" });
      return;
    }
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
          tipo: p.tipo || "produto",
          is_principal: !!p.is_principal,
          imagem_url: p.imagem_url.trim(),
        }))
        .filter((p) => p.name.length > 0);
      const effectiveKeepProducts = keepProductsOverride ?? keepProducts;
      const { data, error } = await supabase.functions.invoke("generate-deep-funnel", {
        body: {
          tenant_id: tenantId,
          objetivo,
          num_perguntas: numPerguntas,
          cenario,
          briefing: { ...briefing, objetivo, num_perguntas: numPerguntas, cenario, products: cleanProducts },
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
      if (e?.context?.status === 402) {
        setShowCreditsBlock(true);
        setGenerating(false);
        return;
      }
      console.error(e);
      toast({ title: "Erro ao gerar funil", description: e?.message ?? "Tente novamente", variant: "destructive" });
      setGenerating(false);
    }
  };

  const onGenerateClick = () => {
    if (isEditMode && keepProducts === null) {
      setShowProductDialog(true);
    } else {
      handleGenerate();
    }
  };

  if (generating) {
    return (
      <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <Card className="flex flex-col items-center justify-center gap-4 rounded-2xl border-gold/20 p-10 text-center sm:p-16">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}>
            <Sparkles className="h-10 w-10 text-primary" />
          </motion.div>
          <h2 className="font-display text-2xl">
            {keepProducts === true ? "Atualizando perguntas..." : "Gerando seu funil..."}
          </h2>
          <p className="text-sm text-muted-foreground">
            {keepProducts === true
              ? `A IA está remontando as ${numPerguntas} perguntas com base no briefing atualizado. Uns 20 segundos.`
              : `A IA está montando ${numPerguntas} perguntas e o roteamento pros seus destinos. Uns 30 segundos.`}
          </p>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div key="wizard" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-5">
      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border text-xs font-bold ${
                i < step
                  ? "border-gold/40 bg-gold/15 text-gold"
                  : i === step
                  ? "border-gold bg-gold text-background"
                  : "border-gold/20 text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={`hidden text-xs sm:inline ${i === step ? "font-medium text-foreground" : i < step ? "text-gold" : "text-muted-foreground"}`}>{label}</span>
            {i < STEPS.length - 1 && <div className={`h-px flex-1 ${i < step ? "bg-gold" : "bg-gold/15"}`} />}
          </div>
        ))}
      </div>

      <Card className="space-y-5 rounded-2xl border-gold/20 p-5 sm:p-6">
        {/* PASSO 1 — OBJETIVO */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl">Qual o objetivo deste diagnóstico?</h1>
              <p className="mt-1 text-sm text-muted-foreground">O que tem que acontecer no fim. Isso guia as perguntas e o resultado.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {OBJETIVOS.map((o) => {
                const active = objetivo === o.key;
                return (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setObjetivo(o.key)}
                    className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                      active ? "border-gold bg-gold/15" : "border-gold/20 hover:bg-gold/5"
                    }`}
                  >
                    <Target className={`mt-0.5 h-5 w-5 shrink-0 ${active ? "text-gold" : "text-muted-foreground"}`} />
                    <div>
                      <p className={`font-medium ${active ? "text-gold" : ""}`}>{o.label}</p>
                      <p className="text-xs text-muted-foreground">{o.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* PASSO 2 — BRIEFING ENXUTO */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl">{isEditMode ? "Ajuste o briefing" : "Conte o essencial"}</h1>
              <p className="mt-1 text-sm text-muted-foreground">Leva 5 minutos. A IA preenche o resto a partir disso.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="business_name">Nome do seu negócio/marca *</Label>
              <Input
                id="business_name"
                placeholder="Ex: Sua Marca Consultoria"
                maxLength={80}
                value={briefing.business_name ?? ""}
                onChange={(e) => setBriefing((p) => ({ ...p, business_name: e.target.value }))}
                className="rounded-2xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="niche">Nicho *</Label>
              <div className="flex flex-wrap gap-2">
                {NICHE_PRESETS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setBriefing((p) => ({ ...p, niche: n }))}
                    className={`rounded-xl border px-3 py-1.5 text-xs transition-all ${
                      briefing.niche === n ? "border-gold bg-gold/15 text-gold" : "border-gold/20 text-muted-foreground hover:bg-gold/5"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <Input
                id="niche"
                placeholder="Ou escreva o seu nicho específico"
                value={briefing.niche ?? ""}
                onChange={(e) => setBriefing((p) => ({ ...p, niche: e.target.value }))}
                className="rounded-2xl"
              />
            </div>

            {ESSENTIAL_TEXTAREAS.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label htmlFor={f.key}>{f.label}</Label>
                <Textarea
                  id={f.key}
                  placeholder={f.placeholder}
                  value={briefing[f.key] ?? ""}
                  onChange={(e) => setBriefing((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="min-h-[90px] rounded-2xl"
                />
              </div>
            ))}

            <div className="pt-1">
              <Button type="button" variant="outline" className="gap-2 rounded-xl border-gold/20" onClick={() => setShowExtra((v) => !v)}>
                {showExtra ? "Ocultar detalhes" : "Mais detalhes (opcional)"}
              </Button>
            </div>
            {showExtra && (
              <div className="space-y-4 border-t border-gold/15 pt-4">
                {EXTRA_FIELDS.map((f) => {
                  const value = briefing[f.key] ?? "";
                  const min = (f as any).min as number | undefined;
                  const insufficient = min ? value.length > 0 && value.length < min : false;
                  return (
                    <div key={f.key} className="space-y-1.5">
                      <Label htmlFor={f.key}>{f.label}</Label>
                      <Textarea
                        id={f.key}
                        placeholder={f.placeholder}
                        value={value}
                        onChange={(e) => setBriefing((p) => ({ ...p, [f.key]: e.target.value }))}
                        className="min-h-[80px] rounded-2xl"
                      />
                      {(f as any).hint && !insufficient && <p className="text-[11px] leading-snug text-muted-foreground/70">{(f as any).hint}</p>}
                      {insufficient && <p className="text-xs text-amber-500">Adicione mais {min! - value.length} caracteres.</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PASSO 3 — DESTINOS */}
        {step === 2 && (
          <div ref={productsRef} className="space-y-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl">Pra onde o lead vai?</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                1 destino principal (obrigatório) + até 2 secundários. A IA recomenda o que mais combina com cada lead — nunca inventa.
              </p>
            </div>

            {briefingProducts.map((p, idx) => (
              <Card key={idx} className="space-y-3 rounded-2xl border-gold/20 p-4">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setPrincipal(idx)}
                    className={`rounded-xl border px-3 py-1 text-xs font-medium transition-all ${
                      p.is_principal ? "border-gold bg-gold/15 text-gold" : "border-gold/20 text-muted-foreground hover:bg-gold/5"
                    }`}
                  >
                    {p.is_principal ? "★ Principal" : "Tornar principal"}
                  </button>
                  {briefingProducts.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => setBriefingProducts((prev) => {
                        const nextArr = prev.filter((_, i) => i !== idx);
                        if (!nextArr.some((x) => x.is_principal) && nextArr[0]) nextArr[0].is_principal = true;
                        return nextArr;
                      })}
                    >
                      <Trash2 className="h-3 w-3" /> Remover
                    </Button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {TIPOS_DESTINO.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setProd(idx, { tipo: t.key })}
                      className={`rounded-xl border px-3 py-1.5 text-xs transition-all ${
                        p.tipo === t.key ? "border-gold bg-gold/15 text-gold" : "border-gold/20 text-muted-foreground hover:bg-gold/5"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <Input
                  placeholder="Nome do destino (ex: Mentoria Quebre o Ciclo)"
                  className="rounded-2xl"
                  value={p.name}
                  onChange={(e) => setProd(idx, { name: e.target.value })}
                />
                <Textarea
                  placeholder="Descrição curta (o que entrega, pra quem)"
                  className="min-h-[70px] rounded-2xl"
                  value={p.description}
                  onChange={(e) => setProd(idx, { description: e.target.value })}
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    placeholder={p.tipo === "produto" ? "Preço (ex: R$ 497)" : "Preço (se houver)"}
                    className="rounded-2xl"
                    value={p.price_hint}
                    onChange={(e) => setProd(idx, { price_hint: e.target.value })}
                  />
                  <Input
                    placeholder="Link (checkout / Zoom / WhatsApp)"
                    className="rounded-2xl"
                    value={p.link}
                    onChange={(e) => setProd(idx, { link: e.target.value })}
                  />
                </div>
                <Input
                  placeholder="Capa do destino — URL da imagem (opcional)"
                  className="rounded-2xl"
                  value={p.imagem_url}
                  onChange={(e) => setProd(idx, { imagem_url: e.target.value })}
                />
                <p className="text-[10px] leading-snug text-muted-foreground/70">
                  Esses campos são SEUS — a IA nunca inventa preço, link nem duração.
                </p>
              </Card>
            ))}

            {briefingProducts.length < 3 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setBriefingProducts((prev) => [...prev, { ...EMPTY_PRODUCT }])}
                className="gap-2 rounded-xl border-gold/20 max-sm:w-full"
              >
                <Plus className="h-4 w-4" /> Adicionar destino secundário
              </Button>
            )}

            {isEditMode && keepProducts === false && (
              <div className="flex items-center gap-3 rounded-2xl border border-gold/20 bg-gold/5 p-3">
                <Checkbox id="products-confirmed" checked={productsConfirmed} onCheckedChange={(c) => setProductsConfirmed(c === true)} />
                <label htmlFor="products-confirmed" className="cursor-pointer select-none text-sm">Destinos atualizados ✓</label>
              </div>
            )}
          </div>
        )}

        {/* PASSO 4 — CONFIGURAÇÃO */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl">Configuração final</h1>
              <p className="mt-1 text-sm text-muted-foreground">Quantas perguntas e com qual tom a IA gera.</p>
            </div>

            <div className="space-y-2">
              <Label>Quantidade de perguntas</Label>
              <div className="flex gap-2">
                {QUANTIDADES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setNumPerguntas(q)}
                    className={`flex-1 rounded-2xl border py-3 text-center font-display text-xl transition-all ${
                      numPerguntas === q ? "border-gold bg-gold/15 text-gold" : "border-gold/20 text-muted-foreground hover:bg-gold/5"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cenário (tom e severidade)</Label>
              <div className="grid gap-3">
                {CENARIOS.map((c) => {
                  const active = cenario === c.key;
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setCenario(c.key)}
                      className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                        active ? "border-gold bg-gold/15" : "border-gold/20 hover:bg-gold/5"
                      }`}
                    >
                      <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${active ? "border-gold bg-gold" : "border-gold/30"}`}>
                        {active && <Check className="h-3 w-3 text-background" />}
                      </div>
                      <div>
                        <p className={`font-medium ${active ? "text-gold" : ""}`}>{c.label}</p>
                        <p className="text-xs text-muted-foreground">{c.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Navegação */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" className="gap-1 rounded-xl" onClick={step === 0 ? onCancel : back}>
          {step === 0 ? "Cancelar" : (<><ChevronLeft className="h-4 w-4" /> Voltar</>)}
        </Button>

        {step < STEPS.length - 1 ? (
          <Button onClick={next} disabled={!stepValid(step)} className="gap-1 rounded-xl">
            Avançar <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={onGenerateClick}
            disabled={!hasValidProduct || (isEditMode && keepProducts === false && !productsConfirmed)}
            className="gap-2 rounded-xl transition-transform hover:scale-[1.02]"
          >
            <Sparkles className="h-4 w-4" />
            {isEditMode ? "Atualizar funil" : "Gerar funil com IA"}
          </Button>
        )}
      </div>

      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deseja manter os destinos atuais?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Se os seus destinos não mudaram, a IA só refaz as perguntas. Se quiser atualizar, edite-os e confirme antes de gerar.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Button className="rounded-xl" onClick={() => { setKeepProducts(true); setShowProductDialog(false); handleGenerate(true); }}>
              Sim, manter os destinos atuais
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-gold/20"
              onClick={() => { setKeepProducts(false); setShowProductDialog(false); setStep(2); productsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
            >
              Vou atualizar os destinos
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CreditsBlockModal open={showCreditsBlock} onClose={() => setShowCreditsBlock(false)} />
    </motion.div>
  );
};
