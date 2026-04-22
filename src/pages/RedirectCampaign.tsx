import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/analytics";

function detectDevice(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/mobile|iphone|ipod|android.*mobile/i.test(ua)) return "mobile";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  return "desktop";
}

function buildFinalUrl(
  baseUrl: string,
  utm: { utm_source?: string | null; utm_medium?: string | null; utm_campaign?: string | null },
): string {
  try {
    // Internal route → keep as-is, append utms only if it's a URL
    if (baseUrl.startsWith("/")) {
      const url = new URL(baseUrl, window.location.origin);
      if (utm.utm_source) url.searchParams.set("utm_source", utm.utm_source);
      if (utm.utm_medium) url.searchParams.set("utm_medium", utm.utm_medium);
      if (utm.utm_campaign) url.searchParams.set("utm_campaign", utm.utm_campaign);
      return url.pathname + url.search + url.hash;
    }
    const url = new URL(baseUrl);
    if (utm.utm_source) url.searchParams.set("utm_source", utm.utm_source);
    if (utm.utm_medium) url.searchParams.set("utm_medium", utm.utm_medium);
    if (utm.utm_campaign) url.searchParams.set("utm_campaign", utm.utm_campaign);
    return url.toString();
  } catch {
    return baseUrl;
  }
}

const RedirectCampaign = () => {
  const { slug } = useParams<{ slug: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError("Link inválido");
      return;
    }
    (async () => {
      const { data, error: rpcErr } = await supabase.rpc("resolve_campaign", { _slug: slug });
      if (rpcErr) {
        setError("Não foi possível abrir esse link");
        return;
      }
      const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
      if (!row) {
        setError("Campanha não encontrada ou desativada");
        return;
      }
      // Fire-and-forget click tracking with the campaign slug
      try {
        await supabase.from("bio_clicks").insert([{
          block_id: row.block_id,
          block_kind: row.block_kind,
          block_label: row.block_label,
          block_url: row.block_url,
          session_id: getSessionId(),
          referrer: document.referrer || null,
          device: detectDevice(),
          utm_source: row.utm_source,
          utm_medium: row.utm_medium,
          utm_campaign: row.utm_campaign,
          campaign_slug: slug,
        }]);
      } catch {
        /* ignore */
      }
      const finalUrl = buildFinalUrl(row.block_url, {
        utm_source: row.utm_source,
        utm_medium: row.utm_medium,
        utm_campaign: row.utm_campaign,
      });
      window.location.replace(finalUrl);
    })();
  }, [slug]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 grain">
      {error ? (
        <>
          <p className="text-sm uppercase tracking-[0.25em] text-destructive">{error}</p>
          <a href="/bio" className="text-[10px] uppercase tracking-[0.3em] text-primary hover:underline">
            ir para /bio
          </a>
        </>
      ) : (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">redirecionando…</p>
        </>
      )}
    </div>
  );
};

export default RedirectCampaign;