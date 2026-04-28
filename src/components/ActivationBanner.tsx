import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, X } from "lucide-react";

/**
 * Onda 4 Fase 6 — Banner "Plano/Addon ativo desde agora".
 *
 * Aparece no topo do Painel quando a URL traz `?activated=true&type=...&slug=...`.
 * É a confirmação visual final do ciclo de compra:
 *  1. User comprou na Loja
 *  2. Pagou
 *  3. Webhook ativou
 *  4. Tela /bem-vindo
 *  5. Voltou pro painel **com este banner** mostrando o que tá ativo
 *
 * Comportamento:
 *  - FadeIn animado, dourado, com ícone de check
 *  - Botão "Ir agora →" leva direto pra aba/seção do produto comprado
 *  - Botão X pra fechar manual
 *  - Auto-fecha em 60s (não é eterno, mas dá tempo de ler)
 *  - Limpa os query params da URL após detectar (evita reaparecer ao recarregar)
 */

const COPY_BY_SLUG: Record<string, string> = {
  pro: "Plano Pro ativo. Aproveite todos os recursos avançados.",
  deep_diagnostic:
    "Diagnóstico Imersivo liberado. Configure e compartilhe com seus clientes.",
};

// Pra qual aba do Painel o botão "Ir agora →" leva, por slug comprado.
// Painel usa setActiveTab via callback — não navegação por rota.
const TAB_BY_SLUG: Record<string, string> = {
  pro: "bio", // Pro abre o editor da bio (onde ficam os recursos avançados)
  deep_diagnostic: "imersivo", // Diagnóstico vai pra aba Imersivo
};

const TAB_LABEL_BY_SLUG: Record<string, string> = {
  pro: "Ir pra minha bio",
  deep_diagnostic: "Configurar diagnóstico",
};

type ActivationBannerProps = {
  /**
   * Callback chamado quando user clica em "Ir agora →".
   * Recebe o slug do tab destino (ex: "bio", "imersivo").
   * Quem usa: Painel.tsx, que faz `setActiveTab(targetTab)`.
   */
  onAction?: (targetTab: string) => void;
};

export const ActivationBanner = ({ onAction }: ActivationBannerProps = {}) => {
  const [params, setParams] = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [info, setInfo] = useState<{
    type: string | null;
    slug: string;
  } | null>(null);

  useEffect(() => {
    if (params.get("activated") !== "true") return;
    const type = params.get("type");
    const slug = params.get("slug") ?? "";
    setInfo({ type, slug });
    setVisible(true);

    // Limpa os params da URL pra não reabrir o banner ao recarregar
    const next = new URLSearchParams(params);
    next.delete("activated");
    next.delete("type");
    next.delete("slug");
    setParams(next, { replace: true });

    // Auto-fecha em 60s
    const t = setTimeout(() => setVisible(false), 60_000);
    return () => clearTimeout(t);
  }, [params, setParams]);

  if (!info) return null;

  const message =
    COPY_BY_SLUG[info.slug] ??
    (info.type === "plan"
      ? `Plano ${info.slug.toUpperCase()} ativo no seu ecossistema.`
      : `${info.slug.replace(/_/g, " ")} liberado no seu ecossistema.`);

  const targetTab = TAB_BY_SLUG[info.slug];
  const actionLabel = TAB_LABEL_BY_SLUG[info.slug] ?? "Ir agora";
  const hasAction = !!targetTab && !!onAction;

  const handleAction = () => {
    if (!targetTab || !onAction) return;
    onAction(targetTab);
    // Some o banner depois de mandar pra aba — assim o user foca no destino
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-6 flex items-start gap-3 rounded-lg border border-gold/40 bg-gradient-gold-soft px-5 py-4 shadow-[0_0_24px_rgba(220,180,80,0.15)]"
        >
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/20 ring-1 ring-gold">
            <CheckCircle2 className="h-4 w-4 text-gold" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-medium uppercase tracking-widest text-gold">
              Ativado agora
            </p>
            <p className="mt-1 text-sm text-primary">{message}</p>
          </div>

          {hasAction && (
            <button
              type="button"
              onClick={handleAction}
              className="hidden shrink-0 items-center gap-1.5 self-center rounded-md border border-gold/60 bg-card/40 px-3 py-1.5 text-[11px] font-medium uppercase tracking-widest text-gold transition hover:bg-gold/15 hover:text-primary sm:inline-flex"
            >
              {actionLabel} <ArrowRight className="h-3 w-3" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setVisible(false)}
            className="self-start rounded-sm p-1 text-muted-foreground transition hover:bg-card/30 hover:text-primary"
            aria-label="Fechar aviso"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
