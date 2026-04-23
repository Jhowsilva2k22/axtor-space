import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Lock, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useDeepDiagnostic } from "@/hooks/useDeepDiagnostic";

export const DeepDiagnosticCard = () => {
  const { hasAddon, funnels, loading } = useDeepDiagnostic();

  if (loading) return null;

  const hasPublished = funnels.some((f) => f.is_published);

  return (
    <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="absolute right-0 top-0 h-40 w-40 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-display text-2xl tracking-tight">Diagnóstico Profundo</h2>
            {hasAddon && (
              <span className="ml-1 inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary">
                <CheckCircle2 className="h-3 w-3" /> Liberado
              </span>
            )}
            {!hasAddon && (
              <span className="ml-1 inline-flex items-center gap-1 rounded-full border border-muted-foreground/30 bg-muted/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                <Lock className="h-3 w-3" /> Upgrade
              </span>
            )}
          </div>
          <p className="max-w-xl text-sm text-muted-foreground">
            Transforme seu Instagram num funil que vende sozinho. Quiz inteligente que detecta a dor do
            lead e recomenda o produto certo, com mensagem de WhatsApp pronta.
          </p>
          {hasPublished && hasAddon && (
            <p className="text-xs text-primary">{funnels.length} funil(is) criado(s) — gerencie abaixo.</p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row md:flex-col lg:flex-row">
          {hasAddon ? (
            <Button asChild size="lg" className="gap-2">
              <Link to="/admin/deep-diagnostic">
                {funnels.length > 0 ? "Gerenciar funis" : "Criar meu funil"} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg" className="gap-2">
                <Link to="/admin/deep-diagnostic/demo">
                  Conhecer agora <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};