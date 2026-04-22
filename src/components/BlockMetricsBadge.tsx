import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Loader2 } from "lucide-react";

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
      className="group inline-flex items-center gap-3 rounded-sm border border-gold/40 bg-background/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-all hover:border-gold hover:text-primary"
      title="Ver métricas detalhadas"
    >
      <BarChart3 className="h-3 w-3 shrink-0 text-primary" />
      {loading || !data ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <>
          <span>
            <span className="text-foreground">{data.clicks_24h}</span> 24h
          </span>
          <span className="text-gold/40">·</span>
          <span>
            <span className="text-foreground">{data.clicks_7d}</span> 7d
          </span>
          <span className="text-gold/40">·</span>
          <span>
            <span className="text-foreground">{data.clicks_30d}</span> 30d
          </span>
          <span className="text-gold/40">·</span>
          <span>
            ctr <span className="text-foreground">{data.ctr}%</span>
          </span>
        </>
      )}
    </Link>
  );
};

export default BlockMetricsBadge;