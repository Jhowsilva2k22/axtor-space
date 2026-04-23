import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Loader2, ChevronRight } from "lucide-react";

type Summary = {
  clicks_24h: number;
  clicks_7d: number;
  clicks_30d: number;
  ctr: number;
};

export const BlockMetricsBadge = ({ blockId }: { blockId: string }) => {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data: res, error } = await supabase.rpc("get_block_analytics", {
        _block_id: blockId,
        _days: 30,
      });
      if (cancel) return;
      if (!error && res) setData(res as unknown as Summary);
      setLoading(false);
    })();
    return () => {
      cancel = true;
    };
  }, [blockId]);

  return (
    <Link
      to={`/admin/blocks/${blockId}`}
      className="group flex w-full items-center gap-3 rounded-sm border border-gold/30 bg-background/30 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-all hover:border-gold hover:bg-background/50 hover:text-primary"
      title="Ver métricas detalhadas"
    >
      <BarChart3 className="h-3.5 w-3.5 shrink-0 text-primary" />
      {loading || !data ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <div className="grid flex-1 grid-cols-4 gap-2">
          <Stat label="24h" value={data.clicks_24h} />
          <Stat label="7d" value={data.clicks_7d} />
          <Stat label="30d" value={data.clicks_30d} />
          <Stat label="CTR" value={`${data.ctr}%`} />
        </div>
      )}
      <ChevronRight className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
};

const Stat = ({ label, value }: { label: string; value: number | string }) => (
  <div className="flex flex-col items-center leading-tight">
    <span className="text-[12px] font-semibold text-foreground tracking-normal normal-case">{value}</span>
    <span className="text-[9px] tracking-[0.18em]">{label}</span>
  </div>
);

export default BlockMetricsBadge;