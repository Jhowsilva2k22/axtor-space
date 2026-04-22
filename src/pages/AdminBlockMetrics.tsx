import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ThemeToggle, useAdminLockedTheme } from "@/components/ThemeToggle";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Block = {
  id: string;
  label: string;
  url: string;
  kind: string;
};

type Analytics = {
  block_id: string;
  period_days: number;
  clicks_24h: number;
  clicks_7d: number;
  clicks_30d: number;
  clicks_period: number;
  bio_views_period: number;
  ctr: number;
  daily: Array<{ day: string; clicks: number }>;
  by_device: Array<{ device: string; clicks: number }>;
  by_utm_source: Array<{ source: string; clicks: number }>;
  by_utm_medium: Array<{ medium: string; clicks: number }>;
  by_utm_campaign: Array<{ campaign: string; clicks: number }>;
  by_referrer: Array<{ referrer: string; clicks: number }>;
};

const AdminBlockMetrics = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin, loading: authLoading } = useAuth();
  useAdminLockedTheme();
  const [block, setBlock] = useState<Block | null>(null);
  const [data, setData] = useState<Analytics | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user || !isAdmin || !id) return;

    setLoading(true);
    (async () => {
      try {
        const [{ data: b, error: blockError }, { data: a, error: analyticsError }] = await Promise.all([
          supabase.from("bio_blocks").select("id,label,url,kind").eq("id", id).maybeSingle(),
          supabase.rpc("get_block_analytics", { _block_id: id, _days: days }),
        ]);

        const error = blockError ?? analyticsError;
        if (error) throw error;

        setBlock((b as any) ?? null);
        setData((a as unknown as Analytics) ?? null);
      } catch (error: any) {
        toast.error(error?.message ?? "Não foi possível carregar as métricas");
        setBlock(null);
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, user, isAdmin, id, days]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center grain">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />;

  return (
    <div className="relative min-h-screen overflow-hidden grain">
      <div className="aurora-a" />
      <div className="aurora-b" />
      <header className="sticky top-0 z-30 border-b border-gold/30 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="inline-flex h-9 items-center gap-2 rounded-sm border border-border bg-card/40 px-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar
            </Link>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">métricas do bloco</p>
              <h1 className="font-display text-2xl">{block?.label ?? "..."}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger className="h-10 w-32 rounded-sm border-gold bg-card/40 text-[11px] uppercase tracking-[0.2em]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">24 horas</SelectItem>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="90">90 dias</SelectItem>
              </SelectContent>
            </Select>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {loading || !data ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <main className="mx-auto max-w-5xl space-y-10 px-6 py-10">
          <section className="grid gap-4 md:grid-cols-5">
            <Stat label="Cliques 24h" value={data.clicks_24h} />
            <Stat label="Cliques 7d" value={data.clicks_7d} />
            <Stat label="Cliques 30d" value={data.clicks_30d} />
            <Stat label={`Período (${days}d)`} value={data.clicks_period} />
            <Stat label="CTR" value={`${data.ctr}%`} hint={`${data.bio_views_period} views`} />
          </section>

          <section className="rounded-sm border-gold-gradient p-6">
            <h2 className="mb-4 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Cliques por dia</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.daily}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 2,
                      fontSize: 12,
                    }}
                  />
                  <Line type="monotone" dataKey="clicks" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <BreakdownTable title="Origem (utm_source)" rows={data.by_utm_source.map((r) => ({ k: r.source, v: r.clicks }))} />
            <BreakdownTable title="Mídia (utm_medium)" rows={data.by_utm_medium.map((r) => ({ k: r.medium, v: r.clicks }))} />
            <BreakdownTable title="Campanha (utm_campaign)" rows={data.by_utm_campaign.map((r) => ({ k: r.campaign, v: r.clicks }))} />
            <BreakdownTable title="Dispositivo" rows={data.by_device.map((r) => ({ k: r.device, v: r.clicks }))} />
            <BreakdownTable title="Referrer" rows={data.by_referrer.map((r) => ({ k: r.referrer, v: r.clicks }))} />
          </section>
        </main>
      )}
    </div>
  );
};

const Stat = ({ label, value, hint }: { label: string; value: number | string; hint?: string }) => (
  <div className="rounded-sm border-gold-gradient p-5">
    <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
    <p className="mt-2 font-display text-3xl text-foreground">{value}</p>
    {hint && <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p>}
  </div>
);

const BreakdownTable = ({ title, rows }: { title: string; rows: Array<{ k: string; v: number }> }) => {
  const total = rows.reduce((s, r) => s + r.v, 0);
  return (
    <div className="rounded-sm border-gold-gradient p-5">
      <h3 className="mb-3 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground/60">Sem dados no período.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.k} className="flex items-center justify-between gap-3 text-xs">
              <span className="truncate text-foreground">{r.k}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {r.v}
                {total > 0 && <span className="ml-2 text-[10px] text-primary">{Math.round((r.v / total) * 100)}%</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminBlockMetrics;