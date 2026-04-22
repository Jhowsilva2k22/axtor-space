import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Loader2,
  ArrowLeft,
  Eye,
  MousePointerClick,
  Users,
  CheckCircle2,
  Lock,
  XCircle,
  TrendingUp,
  DollarSign,
  RefreshCw,
} from "lucide-react";

type Range = 7 | 30 | 90;

type Summary = {
  period_days: number;
  page_views_total: number;
  unique_sessions: number;
  bio_clicks_total: number;
  leads_total: number;
  diagnostics_completed: number;
  diagnostics_failed: number;
  diagnostics_private: number;
  views_by_path: { path: string; views: number }[];
  top_blocks: { block_id: string | null; label: string | null; kind: string | null; clicks: number }[];
  funnel: Record<string, number>;
  top_handles: { handle: string; count: number }[];
  utm_sources: { source: string; views: number }[];
  daily_views: { day: string; views: number }[];
  recent_leads: {
    id: string;
    handle: string;
    email: string | null;
    phone: string | null;
    name: string | null;
    created_at: string;
    utm_source: string | null;
    completed: boolean;
    private: boolean;
  }[];
};

// Custos estimados (USD) — ajustar se Apify mudar preço
const APIFY_COST_PER_RUN_USD = 0.0023;
const AI_COST_PER_RUN_USD = 0.0008;
const USD_TO_BRL = 5;

const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const fmtUSD = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 4 }).format(v);
const fmtNum = (v: number) => new Intl.NumberFormat("pt-BR").format(v);

const AdminAnalytics = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [range, setRange] = useState<Range>(30);
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    setLoading(true);
    try {
      const { data: rpc, error } = await supabase.rpc("get_analytics_summary", { _days: range });
      if (error) throw error;
      setData((rpc as unknown as Summary) ?? null);
    } catch (error: any) {
      toast.error?.(error?.message ?? "Não foi possível carregar os analytics");
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      void load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, isAdmin, range]);

  const cost = useMemo(() => {
    if (!data) return null;
    const completed = data.diagnostics_completed;
    const usd = completed * (APIFY_COST_PER_RUN_USD + AI_COST_PER_RUN_USD);
    return { usd, brl: usd * USD_TO_BRL };
  }, [data]);

  const conv = useMemo(() => {
    if (!data) return null;
    const visits = data.funnel?.diag_landing_view ?? data.page_views_total ?? 0;
    const handles = data.funnel?.diag_handle_submit ?? 0;
    const leads = data.funnel?.diag_lead_submit ?? data.leads_total ?? 0;
    const results = data.funnel?.diag_result_view ?? 0;
    return {
      visits,
      handles,
      leads,
      results,
      pct_handle: visits ? (handles / visits) * 100 : 0,
      pct_lead: visits ? (leads / visits) * 100 : 0,
      pct_result: visits ? (results / visits) * 100 : 0,
    };
  }, [data]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center grain">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="relative min-h-screen overflow-hidden grain">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-3 w-3" /> Painel
          </Link>
          <span className="font-display text-2xl">Analytics</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-sm border border-gold/40 p-1">
            {([7, 30, 90] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-sm px-3 py-1 text-xs uppercase tracking-[0.2em] transition ${
                  range === r ? "bg-gradient-gold-soft text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}d
              </button>
            ))}
          </div>
          <Button variant="outline" size="icon" onClick={load} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl space-y-8 px-6 pb-24">
        {loading || !data ? (
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* KPIs principais */}
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Kpi icon={Eye} label="Visitas" value={fmtNum(data.page_views_total)} />
              <Kpi icon={Users} label="Sessões únicas" value={fmtNum(data.unique_sessions)} />
              <Kpi icon={MousePointerClick} label="Cliques na bio" value={fmtNum(data.bio_clicks_total)} />
              <Kpi icon={CheckCircle2} label="Leads capturados" value={fmtNum(data.leads_total)} />
            </section>

            {/* Custos */}
            <section className="rounded-sm border-gold-gradient p-6 backdrop-blur">
              <div className="mb-4 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <h2 className="text-xs uppercase tracking-[0.3em] text-primary">Custo estimado · {range}d</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-4">
                <CostCell label="Análises completas" value={fmtNum(data.diagnostics_completed)} />
                <CostCell label="Custo total (USD)" value={cost ? fmtUSD(cost.usd) : "—"} />
                <CostCell label="Custo total (BRL)" value={cost ? fmtBRL(cost.brl) : "—"} highlight />
                <CostCell label="Médio / análise" value={fmtBRL((APIFY_COST_PER_RUN_USD + AI_COST_PER_RUN_USD) * USD_TO_BRL)} />
              </div>
              <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
                Apify ${APIFY_COST_PER_RUN_USD}/run + Lovable AI ~${AI_COST_PER_RUN_USD}/run · USD→BRL {USD_TO_BRL}
              </p>
            </section>

            {/* Funil */}
            <section className="rounded-sm border-gold-gradient p-6 backdrop-blur">
              <h2 className="mb-6 text-xs uppercase tracking-[0.3em] text-primary">Funil do diagnóstico</h2>
              {conv && (
                <div className="space-y-3">
                  <FunnelBar label="Visitou /" value={conv.visits} max={conv.visits || 1} pct={100} />
                  <FunnelBar label="Digitou @" value={conv.handles} max={conv.visits || 1} pct={conv.pct_handle} />
                  <FunnelBar label="Enviou contato" value={conv.leads} max={conv.visits || 1} pct={conv.pct_lead} />
                  <FunnelBar label="Viu resultado" value={conv.results} max={conv.visits || 1} pct={conv.pct_result} />
                </div>
              )}
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Mini label="Completos" value={data.diagnostics_completed} icon={CheckCircle2} tone="ok" />
                <Mini label="Privados" value={data.diagnostics_private} icon={Lock} tone="warn" />
                <Mini label="Falhas" value={data.diagnostics_failed} icon={XCircle} tone="err" />
              </div>
            </section>

            {/* Top blocos + UTM */}
            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-sm border-gold-gradient p-6 backdrop-blur">
                <h2 className="mb-4 text-xs uppercase tracking-[0.3em] text-primary">Blocos mais clicados</h2>
                {data.top_blocks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem cliques no período.</p>
                ) : (
                  <ul className="space-y-2">
                    {data.top_blocks.slice(0, 10).map((b, i) => (
                      <li key={(b.block_id ?? "") + i} className="flex items-center justify-between gap-3 rounded-sm border border-gold/20 px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm">{b.label ?? "(sem label)"}</p>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{b.kind ?? "—"}</p>
                        </div>
                        <span className="font-display text-lg text-primary">{b.clicks}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-sm border-gold-gradient p-6 backdrop-blur">
                <h2 className="mb-4 text-xs uppercase tracking-[0.3em] text-primary">Origem do tráfego</h2>
                {data.utm_sources.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados.</p>
                ) : (
                  <ul className="space-y-2">
                    {data.utm_sources.slice(0, 10).map((u) => (
                      <li key={u.source} className="flex items-center justify-between rounded-sm border border-gold/20 px-3 py-2">
                        <span className="text-sm">{u.source}</span>
                        <span className="font-display text-lg text-primary">{u.views}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            {/* Top handles + Páginas */}
            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-sm border-gold-gradient p-6 backdrop-blur">
                <h2 className="mb-4 text-xs uppercase tracking-[0.3em] text-primary">@s mais analisados</h2>
                {data.top_handles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem análises ainda.</p>
                ) : (
                  <ul className="space-y-2">
                    {data.top_handles.slice(0, 10).map((h) => (
                      <li key={h.handle} className="flex items-center justify-between rounded-sm border border-gold/20 px-3 py-2">
                        <a href={`https://instagram.com/${h.handle}`} target="_blank" rel="noopener noreferrer" className="truncate text-sm hover:text-primary">@{h.handle}</a>
                        <span className="font-display text-lg text-primary">{h.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-sm border-gold-gradient p-6 backdrop-blur">
                <h2 className="mb-4 text-xs uppercase tracking-[0.3em] text-primary">Páginas mais vistas</h2>
                <ul className="space-y-2">
                  {data.views_by_path.slice(0, 10).map((p) => (
                    <li key={p.path} className="flex items-center justify-between rounded-sm border border-gold/20 px-3 py-2">
                      <span className="truncate text-sm">{p.path}</span>
                      <span className="font-display text-lg text-primary">{p.views}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Leads recentes */}
            <section className="rounded-sm border-gold-gradient p-6 backdrop-blur">
              <h2 className="mb-4 text-xs uppercase tracking-[0.3em] text-primary">Últimos leads</h2>
              {data.recent_leads.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum lead no período.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gold/20 text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        <th className="py-2 pr-4">Quando</th>
                        <th className="py-2 pr-4">@</th>
                        <th className="py-2 pr-4">Nome</th>
                        <th className="py-2 pr-4">Contato</th>
                        <th className="py-2 pr-4">Origem</th>
                        <th className="py-2 pr-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recent_leads.map((l) => (
                        <tr key={l.id} className="border-b border-gold/10">
                          <td className="py-2 pr-4 text-xs text-muted-foreground">
                            {new Date(l.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                          </td>
                          <td className="py-2 pr-4">@{l.handle}</td>
                          <td className="py-2 pr-4">{l.name ?? "—"}</td>
                          <td className="py-2 pr-4 text-xs">
                            {l.email && <div>{l.email}</div>}
                            {l.phone && <div className="text-muted-foreground">{l.phone}</div>}
                          </td>
                          <td className="py-2 pr-4 text-xs">{l.utm_source ?? "(direto)"}</td>
                          <td className="py-2 pr-4">
                            {l.completed ? (
                              <span className="inline-flex items-center gap-1 rounded-sm border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-emerald-500">
                                <CheckCircle2 className="h-3 w-3" /> Completo
                              </span>
                            ) : l.private ? (
                              <span className="inline-flex items-center gap-1 rounded-sm border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-amber-500">
                                <Lock className="h-3 w-3" /> Privado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-sm border border-muted-foreground/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                                Pendente
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

/* ---------- helpers ---------- */

const Kpi = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="rounded-sm border-gold-gradient p-5 backdrop-blur">
    <div className="flex items-center justify-between">
      <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</span>
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <p className="mt-3 font-display text-3xl text-foreground">{value}</p>
  </div>
);

const CostCell = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className={`rounded-sm border ${highlight ? "border-gold bg-gradient-gold-soft" : "border-gold/30"} p-4`}>
    <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
    <p className={`mt-2 font-display text-2xl ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
  </div>
);

const FunnelBar = ({ label, value, max, pct }: { label: string; value: number; max: number; pct: number }) => {
  const width = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-display text-foreground">
          {value} <span className="text-muted-foreground">· {pct.toFixed(1)}%</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-sm bg-muted/40">
        <div className="h-full bg-gradient-to-r from-primary to-primary-glow" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
};

const Mini = ({ label, value, icon: Icon, tone }: { label: string; value: number; icon: any; tone: "ok" | "warn" | "err" }) => {
  const cls =
    tone === "ok"
      ? "border-emerald-500/30 text-emerald-500"
      : tone === "warn"
        ? "border-amber-500/30 text-amber-500"
        : "border-rose-500/30 text-rose-500";
  return (
    <div className={`flex items-center justify-between rounded-sm border ${cls} bg-card/40 px-4 py-3`}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase tracking-[0.2em]">{label}</span>
      </div>
      <span className="font-display text-xl">{value}</span>
    </div>
  );
};

export default AdminAnalytics;