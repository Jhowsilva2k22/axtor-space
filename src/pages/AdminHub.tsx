import { useEffect, useState, useCallback } from "react";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BGPattern } from "@/components/BGPattern";
import {
  LayoutDashboard,
  Users,
  Activity,
  BarChart3,
  ChevronRight,
  RefreshCw,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  CreditCard,
  Package,
  Zap,
} from "lucide-react";

// ─── tipos ───────────────────────────────────────────────────────────────────

type Tenant = {
  id: string;
  slug: string;
  display_name: string;
  plan: string;
  status: string;
  created_at: string;
  whatsapp_number: string | null;
};

type Subscription = {
  id: string;
  tenant_id: string;
  plan_slug: string;
  billing_cycle: string;
  status: string;
  final_price_brl: number | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  started_at: string;
  tenant?: { display_name: string; slug: string };
};

type Addon = {
  id: string;
  tenant_id: string;
  addon_slug: string;
  status: string;
  value_brl: number | null;
  purchased_at: string;
  expires_at: string | null;
  tenant?: { display_name: string; slug: string };
};

type Analytics = {
  leads_total: number;
  leads_7d: number;
  leads_prev7d: number;
  diagnostics_total: number;
  diagnostics_7d: number;
  diagnostics_prev7d: number;
  bio_clicks_total: number;
  bio_clicks_7d: number;
  bio_clicks_prev7d: number;
  page_views_total: number;
  page_views_7d: number;
  page_views_prev7d: number;
  active_subs: number;
};

type Module = "financeiro" | "tenants" | "monitoramento" | "analytics";

// ─── utils ───────────────────────────────────────────────────────────────────

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDate = (d: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
};

const daysUntil = (d: string | null) => {
  if (!d) return null;
  const diff = new Date(d).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
};

// ─── sub-componentes UI ───────────────────────────────────────────────────────

const KpiCard = ({
  label,
  value,
  sub,
  icon: Icon,
  color = "zinc",
  trend,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color?: "zinc" | "emerald" | "blue" | "amber" | "rose";
  trend?: number | null;
}) => {
  const accent = {
    zinc: "text-zinc-300",
    emerald: "text-emerald-400",
    blue: "text-blue-400",
    amber: "text-amber-400",
    rose: "text-rose-400",
  }[color];
  return (
    <div className="relative flex flex-col gap-3 overflow-hidden rounded-2xl border-gold-gradient bg-card/40 p-5 shadow-gold transition-all hover:shadow-gold-lg">
      <div className="pointer-events-none absolute inset-0 bg-gradient-gold-soft opacity-30" />
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
      <div className="relative flex items-center gap-2.5">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gradient-gold-soft">
          <Icon className={`w-4 h-4 ${accent}`} />
        </span>
        <span className="text-xs uppercase tracking-wide text-zinc-300">{label}</span>
      </div>
      <div className="relative flex items-end justify-between gap-2">
        <p className="text-2xl font-bold text-white">{value}</p>
        {trend != null && (
          <span className={`text-xs font-medium ${trend > 0 ? "text-emerald-400" : trend < 0 ? "text-rose-400" : "text-zinc-400"}`}>
            {trend > 0 ? "▲" : trend < 0 ? "▼" : "—"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      {sub && <p className="relative text-xs text-zinc-400">{sub}</p>}
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    active: "bg-emerald-900/60 text-emerald-300 border-emerald-700",
    trialing: "bg-blue-900/60 text-blue-300 border-blue-700",
    past_due: "bg-amber-900/60 text-amber-300 border-amber-700",
    canceled: "bg-zinc-700/60 text-zinc-300 border-gold/20",
    paused: "bg-zinc-700/60 text-zinc-300 border-gold/20",
    expired: "bg-zinc-700/60 text-zinc-300 border-gold/20",
    pending: "bg-blue-900/60 text-blue-300 border-blue-700",
  };
  const cls = map[status] ?? "bg-zinc-700/60 text-zinc-300 border-gold/20";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
};

const Section = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
  <div className="space-y-4">
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">{title}</h3>
      {hint && <p className="text-xs text-zinc-300 normal-case tracking-normal leading-snug max-w-2xl">{hint}</p>}
    </div>
    {children}
  </div>
);

// ─── módulo financeiro ────────────────────────────────────────────────────────

const ModuloFinanceiro = ({
  subs,
  addons,
}: {
  subs: Subscription[];
  addons: Addon[];
}) => {
  const activeSubs = subs.filter((s) => s.status === "active");
  const mrr =
    activeSubs
      .filter((s) => s.billing_cycle === "monthly")
      .reduce((acc, s) => acc + (s.final_price_brl ?? 0), 0) +
    activeSubs
      .filter((s) => s.billing_cycle === "annual")
      .reduce((acc, s) => acc + (s.final_price_brl ?? 0) / 12, 0);
  const arr = mrr * 12;
  const activeAddons = addons.filter((a) => a.status === "active");
  const addonRevenue = activeAddons.reduce((acc, a) => acc + (a.value_brl ?? 0), 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="MRR" value={fmtBRL(mrr)} icon={TrendingUp} color="emerald" sub="receita mensal recorrente" />
        <KpiCard label="ARR" value={fmtBRL(arr)} icon={TrendingUp} color="blue" sub="receita anual projetada" />
        <KpiCard label="Assinaturas ativas" value={activeSubs.length} icon={CreditCard} color="zinc" />
        <KpiCard label="Extras ativos" value={activeAddons.length} icon={Package} color="amber" sub={fmtBRL(addonRevenue) + " em extras"} />
      </div>

      <Section title="Assinaturas">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-400 text-xs uppercase border-b border-gold/20">
                <th className="text-left pb-2 pr-4">Conta</th>
                <th className="text-left pb-2 pr-4">Plano</th>
                <th className="text-left pb-2 pr-4">Ciclo</th>
                <th className="text-left pb-2 pr-4">Valor</th>
                <th className="text-left pb-2 pr-4">Status</th>
                <th className="text-left pb-2 pr-4">Renova</th>
                <th className="text-left pb-2">Cancela</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {subs.map((s) => (
                <tr key={s.id} className="text-zinc-300 hover:bg-zinc-800/40 transition-colors">
                  <td className="py-2 pr-4 font-medium text-white">{s.tenant?.display_name ?? s.tenant_id.slice(0, 8)}</td>
                  <td className="py-2 pr-4">{s.plan_slug}</td>
                  <td className="py-2 pr-4">{s.billing_cycle}</td>
                  <td className="py-2 pr-4">{s.final_price_brl != null ? fmtBRL(s.final_price_brl) : "—"}</td>
                  <td className="py-2 pr-4"><StatusBadge status={s.status} /></td>
                  <td className="py-2 pr-4">{fmtDate(s.current_period_end)}</td>
                  <td className="py-2">{s.cancel_at_period_end ? <span className="text-amber-400 text-xs">sim</span> : <span className="text-zinc-600 text-xs">não</span>}</td>
                </tr>
              ))}
              {subs.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center text-zinc-400">Nenhuma assinatura encontrada</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Extras">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-400 text-xs uppercase border-b border-gold/20">
                <th className="text-left pb-2 pr-4">Conta</th>
                <th className="text-left pb-2 pr-4">Extra</th>
                <th className="text-left pb-2 pr-4">Valor</th>
                <th className="text-left pb-2 pr-4">Status</th>
                <th className="text-left pb-2 pr-4">Comprado</th>
                <th className="text-left pb-2">Expira</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {addons.map((a) => (
                <tr key={a.id} className="text-zinc-300 hover:bg-zinc-800/40 transition-colors">
                  <td className="py-2 pr-4 font-medium text-white">{a.tenant?.display_name ?? a.tenant_id.slice(0, 8)}</td>
                  <td className="py-2 pr-4">{a.addon_slug}</td>
                  <td className="py-2 pr-4">{a.value_brl != null ? fmtBRL(a.value_brl) : "—"}</td>
                  <td className="py-2 pr-4"><StatusBadge status={a.status} /></td>
                  <td className="py-2 pr-4">{fmtDate(a.purchased_at)}</td>
                  <td className="py-2">{fmtDate(a.expires_at)}</td>
                </tr>
              ))}
              {addons.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-zinc-400">Nenhum extra encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
};

// ─── módulo tenants ───────────────────────────────────────────────────────────

const PLAN_OPTIONS = ["free", "pro", "partner", "tester", "enterprise"];

const ModuloTenants = ({
  tenants,
  onPlanSave,
}: {
  tenants: Tenant[];
  onPlanSave: (id: string, plan: string) => Promise<void>;
}) => {
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const byPlan = PLAN_OPTIONS.reduce<Record<string, number>>((acc, p) => {
    acc[p] = tenants.filter((t) => t.plan === p).length;
    return acc;
  }, {});

  const handleSave = async (id: string) => {
    const plan = editing[id];
    if (!plan) return;
    setSaving(id);
    try {
      await onPlanSave(id, plan);
      setEditing((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {PLAN_OPTIONS.map((p) => (
          <KpiCard key={p} label={p} value={byPlan[p] ?? 0} icon={Users} color="zinc" />
        ))}
      </div>

      <Section title={`Todos os clientes (${tenants.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-400 text-xs uppercase border-b border-gold/20">
                <th className="text-left pb-2 pr-4">Display name</th>
                <th className="text-left pb-2 pr-4">Slug</th>
                <th className="text-left pb-2 pr-4">Plano</th>
                <th className="text-left pb-2 pr-4">Status</th>
                <th className="text-left pb-2 pr-4">WhatsApp</th>
                <th className="text-left pb-2">Criado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {tenants.map((t) => (
                <tr key={t.id} className="text-zinc-300 hover:bg-zinc-800/40 transition-colors">
                  <td className="py-2 pr-4 font-medium text-white">{t.display_name}</td>
                  <td className="py-2 pr-4 text-zinc-300 font-mono text-xs">{t.slug}</td>
                  <td className="py-2 pr-4">
                    {editing[t.id] !== undefined ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={editing[t.id]}
                          onChange={(e) => setEditing((prev) => ({ ...prev, [t.id]: e.target.value }))}
                          className="bg-zinc-700 border border-gold/20 text-white text-xs rounded px-2 py-1"
                        >
                          {PLAN_OPTIONS.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleSave(t.id)}
                          disabled={saving === t.id}
                          className="text-emerald-400 hover:text-emerald-300 text-xs disabled:opacity-50"
                        >
                          {saving === t.id ? "..." : "salvar"}
                        </button>
                        <button
                          onClick={() => setEditing((prev) => { const next = { ...prev }; delete next[t.id]; return next; })}
                          className="text-zinc-400 hover:text-zinc-300 text-xs"
                        >
                          cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditing((prev) => ({ ...prev, [t.id]: t.plan }))}
                        className="flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors group"
                      >
                        <StatusBadge status={t.plan} />
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                      </button>
                    )}
                  </td>
                  <td className="py-2 pr-4"><StatusBadge status={t.status} /></td>
                  <td className="py-2 pr-4 text-zinc-300 font-mono text-xs">
                    {t.whatsapp_number
                      ? <a href={`https://wa.me/${t.whatsapp_number.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">{t.whatsapp_number}</a>
                      : "—"}
                  </td>
                  <td className="py-2 text-zinc-400 text-xs">{fmtDate(t.created_at)}</td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-zinc-400">Nenhum cliente encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
};

// ─── módulo monitoramento ─────────────────────────────────────────────────────

const EDGE_FUNCTIONS = [
  "asaas-create-payment",
  "asaas-webhook",
  "analyze-instagram",
  "analyze-deep",
  "send-email",
  "delete-account",
  "whatsapp-notify",
];

const ModuloMonitoramento = ({ subs }: { subs: Subscription[] }) => {
  const overdue = subs.filter(
    (s) => s.status === "past_due" || s.status === "overdue"
  );
  const cancelingSoon = subs.filter((s) => {
    if (!s.cancel_at_period_end) return false;
    const d = daysUntil(s.current_period_end);
    return d !== null && d >= 0 && d <= 7;
  });

  return (
    <div className="space-y-8">
      <Section title="Edge Functions (7 conhecidas)">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {EDGE_FUNCTIONS.map((fn) => (
            <div key={fn} className="bg-zinc-800 border border-gold/20 rounded-xl px-4 py-3 flex items-center gap-3">
              <Zap className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="text-zinc-200 text-sm font-mono">{fn}</span>
              <CheckCircle className="w-4 h-4 text-emerald-400 ml-auto shrink-0" />
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-400">Status derivado do deploy — verifique logs no Supabase Dashboard para detalhes de execução.</p>
      </Section>

      <Section title={`Pagamentos em atraso (${overdue.length})`}>
        {overdue.length === 0 ? (
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <CheckCircle className="w-4 h-4" />
            Nenhum pagamento em atraso
          </div>
        ) : (
          <div className="space-y-2">
            {overdue.map((s) => (
              <div key={s.id} className="bg-amber-950/40 border border-amber-800/50 rounded-xl px-4 py-3 flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">{s.tenant?.display_name ?? s.tenant_id.slice(0, 8)}</p>
                  <p className="text-amber-300/70 text-xs">{s.plan_slug} · {s.billing_cycle} · <StatusBadge status={s.status} /></p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-amber-300 text-sm font-medium">{s.final_price_brl != null ? fmtBRL(s.final_price_brl) : "—"}</p>
                  <p className="text-amber-400/60 text-xs">venceu {fmtDate(s.current_period_end)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title={`Cancelamentos iminentes — próximos 7 dias (${cancelingSoon.length})`}>
        {cancelingSoon.length === 0 ? (
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <CheckCircle className="w-4 h-4" />
            Nenhum cancelamento nos próximos 7 dias
          </div>
        ) : (
          <div className="space-y-2">
            {cancelingSoon.map((s) => {
              const days = daysUntil(s.current_period_end);
              return (
                <div key={s.id} className="bg-rose-950/40 border border-rose-800/50 rounded-xl px-4 py-3 flex items-center gap-3">
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <div>
                    <p className="text-white text-sm font-medium">{s.tenant?.display_name ?? s.tenant_id.slice(0, 8)}</p>
                    <p className="text-rose-300/70 text-xs">{s.plan_slug} · {s.billing_cycle}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-rose-300 text-sm font-medium">{days === 0 ? "hoje" : `em ${days}d`}</p>
                    <p className="text-rose-400/60 text-xs">{fmtDate(s.current_period_end)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
};

// ─── módulo analytics ─────────────────────────────────────────────────────────

const pctTrend = (curr: number, prev: number) =>
  prev > 0 ? Math.round(((curr - prev) / prev) * 100) : curr > 0 ? 100 : 0;

const FunnelStep = ({ label, value, conv, width }: { label: string; value: number; conv: number | null; width: number }) => (
  <div className="flex items-center gap-3">
    <div className="w-28 shrink-0 text-xs uppercase tracking-wide text-zinc-300">{label}</div>
    <div className="relative h-9 flex-1 overflow-hidden rounded-xl border border-gold/25 bg-background/50">
      <div
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/70 to-primary-glow/25 transition-all"
        style={{ width: `${Math.max(width, 8)}%` }}
      />
      <div className="relative flex h-full items-center px-3">
        <span className="text-sm font-semibold text-white">{value.toLocaleString("pt-BR")}</span>
      </div>
    </div>
    <div className="w-14 shrink-0 text-right text-sm font-semibold text-gold">{conv != null ? `${conv}%` : ""}</div>
  </div>
);

const ModuloAnalytics = ({ data }: { data: Analytics | null }) => {
  if (!data) return <p className="text-zinc-400 text-sm">Carregando analytics...</p>;

  const conv = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 100) : 0);

  return (
    <div className="space-y-8">
      <Section title="Visão geral cross-tenant" hint="Soma de todos os tenants. O número grande é o total acumulado; o menor embaixo é o que entrou nos últimos 7 dias.">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Leads total" value={data.leads_total} icon={Users} color="blue" sub={`${data.leads_7d} nos últimos 7d`} />
          <KpiCard label="Diagnósticos" value={data.diagnostics_total} icon={Activity} color="emerald" sub={`${data.diagnostics_7d} nos últimos 7d`} />
          <KpiCard label="Cliques bio" value={data.bio_clicks_total} icon={BarChart3} color="amber" sub={`${data.bio_clicks_7d} nos últimos 7d`} />
          <KpiCard label="Page views" value={data.page_views_total} icon={TrendingUp} color="zinc" sub={`${data.page_views_7d} nos últimos 7d`} />
        </div>
      </Section>

      <Section title="Últimos 7 dias — vs 7 dias anteriores" hint="Compara os últimos 7 dias com os 7 dias de antes. Verde (▲) = cresceu, vermelho (▼) = caiu. Embaixo, quanto foi no período anterior.">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Leads (7d)" value={data.leads_7d} icon={Users} color="blue" trend={pctTrend(data.leads_7d, data.leads_prev7d)} sub={`${data.leads_prev7d} no período anterior`} />
          <KpiCard label="Diagnósticos (7d)" value={data.diagnostics_7d} icon={Activity} color="emerald" trend={pctTrend(data.diagnostics_7d, data.diagnostics_prev7d)} sub={`${data.diagnostics_prev7d} no período anterior`} />
          <KpiCard label="Cliques (7d)" value={data.bio_clicks_7d} icon={BarChart3} color="amber" trend={pctTrend(data.bio_clicks_7d, data.bio_clicks_prev7d)} sub={`${data.bio_clicks_prev7d} no período anterior`} />
          <KpiCard label="Views (7d)" value={data.page_views_7d} icon={TrendingUp} color="zinc" trend={pctTrend(data.page_views_7d, data.page_views_prev7d)} sub={`${data.page_views_prev7d} no período anterior`} />
        </div>
      </Section>

      <Section title="Funil de conversão (total acumulado)" hint="Leia de cima pra baixo: de todo mundo que vê a página, quantos clicam na bio, viram lead, fazem o diagnóstico e assinam. A % de cada linha é quanto passou da etapa de cima pra ela — onde a % cai muito, é onde você está perdendo gente.">
        <div className="relative space-y-3 overflow-hidden rounded-2xl border-gold-gradient bg-card/40 p-5 shadow-gold">
          <div className="pointer-events-none absolute inset-0 bg-gradient-gold-soft opacity-20" />
          <div className="relative space-y-3">
            <FunnelStep label="Page views" value={data.page_views_total} conv={null} width={100} />
            <FunnelStep label="Cliques bio" value={data.bio_clicks_total} conv={conv(data.bio_clicks_total, data.page_views_total)} width={conv(data.bio_clicks_total, data.page_views_total)} />
            <FunnelStep label="Leads" value={data.leads_total} conv={conv(data.leads_total, data.bio_clicks_total)} width={conv(data.leads_total, data.page_views_total)} />
            <FunnelStep label="Diagnósticos" value={data.diagnostics_total} conv={conv(data.diagnostics_total, data.leads_total)} width={conv(data.diagnostics_total, data.page_views_total)} />
            <FunnelStep label="Assinaturas" value={data.active_subs} conv={conv(data.active_subs, data.diagnostics_total)} width={conv(data.active_subs, data.page_views_total)} />
            <p className="pt-1 text-[11px] text-zinc-400">% = conversão da etapa anterior. A barra mostra o tamanho de cada etapa vs o total de views.</p>
          </div>
        </div>
      </Section>
    </div>
  );
};

// ─── componente principal ─────────────────────────────────────────────────────

const MODULES: { id: Module; label: string; icon: React.ElementType }[] = [
  { id: "financeiro", label: "Financeiro", icon: CreditCard },
  { id: "tenants", label: "Clientes", icon: Users },
  { id: "monitoramento", label: "Monitoramento", icon: Activity },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

type HubData = {
  tenants: Tenant[];
  subs: Subscription[];
  addons: Addon[];
  analytics: Analytics;
};

export default function AdminHub() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [active, setActive] = useState<Module>(() => {
    const h = (typeof window !== "undefined" ? window.location.hash.replace("#", "") : "") as Module;
    return (["financeiro", "tenants", "monitoramento", "analytics"] as Module[]).includes(h) ? h : "financeiro";
  });
  const [data, setData] = useState<HubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Mantém a aba ativa na URL (#aba) pra não voltar pro Financeiro ao dar F5.
  useEffect(() => {
    if (typeof window !== "undefined") window.history.replaceState(null, "", `#${active}`);
  }, [active]);

  const load = useCallback(async () => {
    try {
      setError(null);
      const ago7d = new Date(Date.now() - 7 * 86_400_000).toISOString();
      const ago14d = new Date(Date.now() - 14 * 86_400_000).toISOString();

      const [
        tenantsRes,
        subsRes,
        addonsRes,
        leadsTotal,
        leads7d,
        diagTotal,
        diag7d,
        clicksTotal,
        clicks7d,
        viewsTotal,
        views7d,
        leadsPrev7d,
        diagPrev7d,
        clicksPrev7d,
        viewsPrev7d,
      ] = await Promise.all([
        supabase
          .from("tenants")
          .select("id,slug,display_name,plan,status,created_at,whatsapp_number")
          .order("created_at", { ascending: false }),
        supabase
          .from("tenant_subscriptions")
          .select("*"),
        supabase
          .from("tenant_addons")
          .select("*"),
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", ago7d),
        supabase.from("deep_diagnostics").select("id", { count: "exact", head: true }),
        supabase.from("deep_diagnostics").select("id", { count: "exact", head: true }).gte("created_at", ago7d),
        supabase.from("bio_clicks").select("id", { count: "exact", head: true }),
        supabase.from("bio_clicks").select("id", { count: "exact", head: true }).gte("created_at", ago7d),
        supabase.from("page_views").select("id", { count: "exact", head: true }),
        supabase.from("page_views").select("id", { count: "exact", head: true }).gte("created_at", ago7d),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", ago14d).lt("created_at", ago7d),
        supabase.from("deep_diagnostics").select("id", { count: "exact", head: true }).gte("created_at", ago14d).lt("created_at", ago7d),
        supabase.from("bio_clicks").select("id", { count: "exact", head: true }).gte("created_at", ago14d).lt("created_at", ago7d),
        supabase.from("page_views").select("id", { count: "exact", head: true }).gte("created_at", ago14d).lt("created_at", ago7d),
      ]);

      if (tenantsRes.error) throw tenantsRes.error;
      if (subsRes.error) throw subsRes.error;
      if (addonsRes.error) throw addonsRes.error;

      // resolve tenant pelo tenant_id usando os dados já carregados
      const tenantMap = new Map(
        (tenantsRes.data ?? []).map((t) => [t.id, { display_name: t.display_name, slug: t.slug }])
      );

      const normSubs = (subsRes.data ?? []).map((s: Record<string, unknown>) => ({
        ...s,
        tenant: tenantMap.get(s.tenant_id as string) ?? null,
      })) as Subscription[];

      const normAddons = (addonsRes.data ?? []).map((a: Record<string, unknown>) => ({
        ...a,
        tenant: tenantMap.get(a.tenant_id as string) ?? null,
      })) as Addon[];

      setData({
        tenants: (tenantsRes.data ?? []) as Tenant[],
        subs: normSubs,
        addons: normAddons,
        analytics: {
          leads_total: leadsTotal.count ?? 0,
          leads_7d: leads7d.count ?? 0,
          leads_prev7d: leadsPrev7d.count ?? 0,
          diagnostics_total: diagTotal.count ?? 0,
          diagnostics_7d: diag7d.count ?? 0,
          diagnostics_prev7d: diagPrev7d.count ?? 0,
          bio_clicks_total: clicksTotal.count ?? 0,
          bio_clicks_7d: clicks7d.count ?? 0,
          bio_clicks_prev7d: clicksPrev7d.count ?? 0,
          page_views_total: viewsTotal.count ?? 0,
          page_views_7d: views7d.count ?? 0,
          page_views_prev7d: viewsPrev7d.count ?? 0,
          active_subs: normSubs.filter((s) => s.status === "active").length,
        },
      });
    } catch (e) {
      console.error("[AdminHub] load error:", e);
      const msg =
        e instanceof Error
          ? e.message
          : (e as { message?: string })?.message ?? JSON.stringify(e);
      setError(msg || "Erro ao carregar dados");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAdmin) void load();
  }, [authLoading, isAdmin, load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
  };

  const handlePlanSave = async (tenantId: string, plan: string) => {
    const { error: err } = await supabase
      .from("tenants")
      .update({ plan })
      .eq("id", tenantId);
    if (err) throw err;
    setData((prev) =>
      prev
        ? {
            ...prev,
            tenants: prev.tenants.map((t) => (t.id === tenantId ? { ...t, plan } : t)),
          }
        : prev
    );
  };

  // ─── gates ────────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-gold/20 border-t-zinc-300 rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/admin" replace />;

  // ─── render ───────────────────────────────────────────────────────────────
  const ActiveModule = active;
  void ActiveModule; // satisfaz TS

  return (
    <div className="relative isolate min-h-screen bg-zinc-950 text-white flex flex-col">
      <BGPattern />
      {/* header */}
      <header className="border-b border-gold/10 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link to="/painel" className="flex items-center gap-1.5 text-zinc-300 hover:text-zinc-200 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Painel
          </Link>
          <span className="text-zinc-700">/</span>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-zinc-300" />
            <span className="text-zinc-200 font-medium text-sm">Hub</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {data && (
              <span className="text-zinc-600 text-xs hidden sm:block">
                {data.tenants.length} clientes · {data.subs.filter((s) => s.status === "active").length} assinaturas ativas
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-zinc-300 hover:text-zinc-200 transition-colors text-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Atualizar
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* sidebar desktop */}
        <aside className="hidden md:flex flex-col w-52 border-r border-gold/10 pt-6 pb-4 px-3 gap-1 shrink-0">
          {MODULES.map((m) => {
            const Icon = m.icon;
            const isActive = active === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setActive(m.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left border ${
                  isActive
                    ? "border-gold/40 bg-gold/10 text-gold"
                    : "border-transparent text-zinc-300 hover:bg-gold/5 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {m.label}
              </button>
            );
          })}
        </aside>

        {/* tabs mobile */}
        <div className="md:hidden flex border-b border-gold/10 overflow-x-auto sticky top-14 bg-zinc-950 z-10 w-full shrink-0">
          {MODULES.map((m) => {
            const Icon = m.icon;
            const isActive = active === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setActive(m.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? "border-gold text-gold"
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {m.label}
              </button>
            );
          })}
        </div>

        {/* conteúdo */}
        <main className="flex-1 p-6 md:p-8 min-w-0">
          {loading ? (
            <div className="flex flex-col items-center gap-3 pt-16">
              <div className="w-6 h-6 border-2 border-gold/20 border-t-zinc-300 rounded-full animate-spin" />
              <p className="text-zinc-400 text-sm">Carregando dados reais...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 pt-16">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
              <p className="text-rose-400 text-sm">{error}</p>
              <button
                onClick={handleRefresh}
                className="text-zinc-300 hover:text-zinc-200 text-xs underline"
              >
                Tentar novamente
              </button>
            </div>
          ) : data ? (
            <>
              {active === "financeiro" && (
                <ModuloFinanceiro subs={data.subs} addons={data.addons} />
              )}
              {active === "tenants" && (
                <ModuloTenants tenants={data.tenants} onPlanSave={handlePlanSave} />
              )}
              {active === "monitoramento" && (
                <ModuloMonitoramento subs={data.subs} />
              )}
              {active === "analytics" && (
                <ModuloAnalytics data={data.analytics} />
              )}
            </>
          ) : null}
        </main>
      </div>

      {/* footer */}
      <footer className="border-t border-gold/10 py-3 px-6">
        <p className="text-zinc-700 text-xs text-center">
          Admin Hub · dados ao vivo do Supabase
          {data && (
            <span className="ml-2">
              · <Clock className="w-3 h-3 inline" /> atualizado agora
            </span>
          )}
        </p>
      </footer>
    </div>
  );
}
