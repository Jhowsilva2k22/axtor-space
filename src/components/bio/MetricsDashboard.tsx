import { useState } from "react";
import {
  BarChart3,
  Users,
  ClipboardCheck,
  Target,
  MousePointerClick,
  Eye,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMetrics, type MetricsPeriod } from "@/hooks/useMetrics";

/**
 * Onda 3 v2 Fase 6 (Aba 5) — dashboard de métricas do tenant.
 *
 * MVP minimalista com números-chave (total leads, diagnósticos, cliques bio,
 * page views, clientes estimados). Funil etapa-por-etapa fica pra v2 do produto.
 */
const PERIODS: { value: MetricsPeriod; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "year", label: "Ano" },
];

export const MetricsDashboard = ({ tenantId }: { tenantId: string }) => {
  const [period, setPeriod] = useState<MetricsPeriod>("30d");
  const { metrics, loading, refetching, refetch } = useMetrics(tenantId, period);

  return (
    <Card className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl">
            <BarChart3 className="mr-2 inline-block h-5 w-5 text-primary" />
            Métricas
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Visão geral do funil. Versão MVP — funil etapa-por-etapa entra na próxima onda.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-sm border border-gold/30 bg-card/40 p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPeriod(p.value)}
                className={`rounded-sm px-3 py-1.5 text-[10px] uppercase tracking-widest transition ${
                  period === p.value
                    ? "bg-gradient-gold-soft text-primary"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={loading || refetching}
            aria-label="Atualizar métricas"
          >
            {refetching || loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            icon={<Users className="h-4 w-4" />}
            label="Leads capturados"
            value={metrics.total_leads}
            hint="Quem deixou contato no diagnóstico inicial"
          />
          <MetricCard
            icon={<ClipboardCheck className="h-4 w-4" />}
            label="Diagnósticos concluídos"
            value={metrics.total_diagnostics}
            hint="Funil simples completo"
          />
          <MetricCard
            icon={<Target className="h-4 w-4" />}
            label="Diagnóstico Imersivo"
            value={metrics.total_deep_diagnostics}
            hint="Funil profundo concluído"
            highlight
          />
          <MetricCard
            icon={<MousePointerClick className="h-4 w-4" />}
            label="Cliques na bio"
            value={metrics.total_bio_clicks}
            hint="Cliques nos blocos do link-in-bio"
          />
          <MetricCard
            icon={<Eye className="h-4 w-4" />}
            label="Page views"
            value={metrics.total_page_views}
            hint="Visitas a páginas do tenant"
          />
          <MetricCard
            icon={<Users className="h-4 w-4" />}
            label="Total de clientes"
            value={metrics.total_clientes}
            hint="Soma de leads + diagnóstico imersivo"
          />
        </div>
      )}

      <p className="mt-6 text-[10px] uppercase tracking-widest text-muted-foreground/60">
        Estrutura agora · funil etapa-por-etapa na próxima onda
      </p>
    </Card>
  );
};

const MetricCard = ({
  icon,
  label,
  value,
  hint,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint?: string;
  highlight?: boolean;
}) => (
  <div
    className={`rounded-sm border p-4 ${
      highlight ? "border-gold bg-gradient-gold-soft" : "border-border bg-card/30"
    }`}
  >
    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
      <span className={highlight ? "text-primary" : "text-gold"}>{icon}</span>
      <span className="truncate">{label}</span>
    </div>
    <p
      className={`mt-2 font-display text-3xl ${
        highlight ? "text-primary" : "text-foreground"
      }`}
    >
      {value.toLocaleString("pt-BR")}
    </p>
    {hint && (
      <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p>
    )}
  </div>
);
