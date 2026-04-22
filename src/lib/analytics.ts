import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "lov-session-id";
const UTM_KEY = "lov-utm";

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = uuid();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

function detectDevice(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/mobile|iphone|ipod|android.*mobile/i.test(ua)) return "mobile";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  return "desktop";
}

type Utm = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
};

export function captureUtm(): Utm {
  try {
    const params = new URLSearchParams(window.location.search);
    const fresh = {
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
    };
    if (fresh.utm_source || fresh.utm_medium || fresh.utm_campaign) {
      sessionStorage.setItem(UTM_KEY, JSON.stringify(fresh));
      return fresh;
    }
    const stored = sessionStorage.getItem(UTM_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    /* ignore */
  }
  return { utm_source: null, utm_medium: null, utm_campaign: null };
}

export async function trackPageView(path: string, meta?: Record<string, unknown>) {
  try {
    const utm = captureUtm();
    await supabase.from("page_views").insert({
      path,
      session_id: getSessionId(),
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      device: detectDevice(),
      ...utm,
      meta: meta ?? null,
    });
  } catch (e) {
    console.warn("trackPageView failed", e);
  }
}

export async function trackBioClick(block: {
  id?: string;
  kind?: string;
  label?: string;
  url?: string;
}) {
  try {
    const utm = captureUtm();
    await supabase.from("bio_clicks").insert({
      block_id: block.id ?? null,
      block_kind: block.kind ?? null,
      block_label: block.label ?? null,
      block_url: block.url ?? null,
      session_id: getSessionId(),
      referrer: document.referrer || null,
      device: detectDevice(),
      ...utm,
    });
  } catch (e) {
    console.warn("trackBioClick failed", e);
  }
}

export type FunnelEvent =
  | "diag_landing_view"
  | "diag_handle_submit"
  | "diag_lead_submit"
  | "diag_result_view"
  | "diag_result_private"
  | "diag_result_failed"
  | "diag_cta_bio"
  | "diag_cta_clone"
  | "diag_cta_whatsapp"
  | "diag_share_click";

export async function trackFunnel(
  event: FunnelEvent,
  data?: { handle?: string | null; diagnostic_id?: string | null; meta?: Record<string, unknown> },
) {
  try {
    const utm = captureUtm();
    await supabase.from("funnel_events").insert({
      event_name: event,
      session_id: getSessionId(),
      instagram_handle: data?.handle ?? null,
      diagnostic_id: data?.diagnostic_id ?? null,
      meta: data?.meta ?? null,
      ...utm,
    });
  } catch (e) {
    console.warn("trackFunnel failed", e);
  }
}