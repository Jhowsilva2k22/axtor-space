import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const APIFY_TOKEN = Deno.env.get("APIFY_API_TOKEN")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@axtor.space";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

function sanitizeHandle(raw: string): string {
  return raw.trim().replace(/^@+/, "").replace(/\/+$/, "").toLowerCase();
}

// ---------------------------------------------------------------------------
// notifyLead — best-effort, NEVER throws, NEVER blocks main response
// ---------------------------------------------------------------------------
async function notifyLead(
  tenantId: string | null,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    if (!tenantId) return;

    const { data: cfg, error: cfgErr } = await supabase
      .from("tenant_capture_config")
      .select("lead_destination_type, lead_destination_url")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (cfgErr) {
      console.error("[notify] tenant_capture_config query error:", cfgErr.message);
      return;
    }
    if (!cfg || !cfg.lead_destination_type) return;

    const { lead_destination_type: destType, lead_destination_url: destUrl } = cfg;

    if (destType === "email") {
      if (!destUrl) {
        console.warn("[notify] email destination set but no address configured");
        return;
      }
      if (!RESEND_API_KEY) {
        console.warn("[notify] RESEND_API_KEY not set — skipping email notification");
        return;
      }
      const leadName = String(payload.lead_name || payload.instagram_handle || "Lead");
      const handle = payload.instagram_handle ? `@${payload.instagram_handle}` : "";
      const subject = `[Axtor] Novo lead — ${leadName}${handle ? ` (${handle})` : ""}`;
      const html = buildLeadEmailHtml(payload);
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `Axtor <${RESEND_FROM_EMAIL}>`,
          to: [destUrl],
          subject,
          html,
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        console.error(`[notify] Resend error [${res.status}]:`, txt.slice(0, 300));
      } else {
        console.log("[notify] email notification sent to", destUrl);
      }
    } else if (destType === "webhook") {
      if (!destUrl) {
        console.warn("[notify] webhook destination set but no URL configured");
        return;
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const res = await fetch(destUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) {
          console.error(`[notify] webhook responded [${res.status}] for`, destUrl);
        } else {
          console.log("[notify] webhook notification sent to", destUrl);
        }
      } catch (e) {
        clearTimeout(timeout);
        console.error("[notify] webhook fetch error:", e instanceof Error ? e.message : String(e));
      }
    } else if (destType === "whatsapp") {
      console.log("[notify] WhatsApp destination not yet automated:", destUrl);
    } else {
      console.warn("[notify] unknown lead_destination_type:", destType);
    }
  } catch (e) {
    // Must never propagate
    console.error("[notify] unexpected error in notifyLead:", e instanceof Error ? e.message : String(e));
  }
}

function buildLeadEmailHtml(p: Record<string, unknown>): string {
  const rows = [
    ["Fonte", p.source],
    ["Nome", p.lead_name],
    ["Email", p.lead_email],
    ["Telefone", p.lead_phone],
    ["Instagram", p.instagram_handle ? `@${p.instagram_handle}` : null],
    ["Diagnóstico ID", p.diagnostic_id],
    ["Score geral", p.score !== undefined ? `${p.score}/100` : null],
    ["Veredicto", p.veredict],
    ["Data", p.created_at],
  ]
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px;color:#888;font-size:13px;border-bottom:1px solid #222;">${label}</td><td style="padding:6px 12px;color:#f5e9c8;font-size:13px;border-bottom:1px solid #222;">${value}</td></tr>`,
    )
    .join("");
  return `<!DOCTYPE html><html><body style="background:#0d0d0d;font-family:sans-serif;padding:32px"><div style="max-width:520px;margin:0 auto;background:#111;border:1px solid rgba(201,168,76,.2);border-radius:12px;padding:28px"><p style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#c9a84c;margin:0 0 20px">axtor · novo lead</p><table style="width:100%;border-collapse:collapse">${rows}</table></div></body></html>`;
}
// ---------------------------------------------------------------------------

async function runApifyScraper(handle: string) {
  // apify/instagram-profile-scraper roda síncrono e retorna direto
  const url = `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      usernames: [handle],
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Apify falhou [${res.status}]: ${txt.slice(0, 300)}`);
  }
  const items = await res.json();
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Perfil não encontrado no Instagram.");
  }
  return items[0];
}

async function generateAIDiagnosis(profile: Record<string, unknown>) {
  const prompt = `Você é um ESTRATEGISTA DE MERCADO DIGITAL — não um consultor genérico. Sua leitura tem sagacidade, visão ampla, contexto de mercado e referências reais. Você fala como quem já viu mil perfis do mesmo nicho e sabe exatamente onde a maioria trava.

REGRAS DE TOM:
- Português brasileiro, direto, afiado, premium. Sem jargão de coach. Sem "vamos juntos".
- Cada frase precisa ENTREGAR um insight, não preencher espaço.
- Sempre que possível, contextualize com o nicho que você detectar (pais/paternidade, fitness, finanças, beleza, gastronomia, lifestyle, B2B, e-commerce, criador de conteúdo, etc) — adapte referências ao mercado real desse nicho.
- PROIBIDO inventar números, percentuais ou benchmarks. Use APENAS dados que estão DIRETAMENTE no profile fornecido (followers, posts, etc). Se for falar de tendência de mercado/nicho, use linguagem qualitativa ("a maioria desses perfis", "criadores nesse mercado tendem a", "é raro nesse nicho") — NUNCA cite porcentagens, taxas de conversão fictícias, ou comparativos numéricos não baseados em dado real.
- O VEREDICTO precisa ter 1 frase-bomba memorável, do tipo que gruda na cabeça e o usuário lembra dias depois.

DADOS REAIS DO PERFIL:
${JSON.stringify(profile, null, 2)}

TAREFA:
1. Detecte o nicho (interno, não devolva campo).
2. Pontue cada dimensão (0-100) com base em sinais reais (bio, posts, engajamento, frequência, posicionamento, link externo, categoria, contagens, etc).
3. Calcule score_geral como média ponderada coerente.
4. Determine a faixa qualitativa: 0-30 "Crítico", 31-55 "Tem potencial", 56-78 "Forte", 79-100 "Excelente".
5. Devolva APENAS JSON válido (sem markdown, sem comentários) neste formato exato:

{
  "score_geral": <0-100>,
  "faixa": "Crítico" | "Tem potencial" | "Forte" | "Excelente",
  "nicho_detectado": "<nicho em 2-4 palavras>",
  "scores": {
    "posicionamento": <0-100>,
    "bio_e_cta": <0-100>,
    "consistencia": <0-100>,
    "engajamento": <0-100>,
    "conversao": <0-100>
  },
  "pontos_fortes": ["3 frases curtas e ESPECÍFICAS — citar elementos reais do perfil"],
  "gaps_criticos": ["3 frases mostrando exatamente onde está perdendo dinheiro/atenção, com referência ao mercado do nicho"],
  "plano_acao": ["5 ações priorizadas, executáveis nos próximos 7-14 dias, ordem importa"],
  "veredicto": "2-3 frases de estrategista. A última precisa ser uma frase-bomba memorável."
}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      system:
        "Você é um estrategista de mercado digital sênior. Responda APENAS com JSON válido, sem markdown, sem comentários extras.",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`IA falhou [${res.status}]: ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  const content = data.content?.[0]?.text ?? "{}";
  const cleaned = content.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  return JSON.parse(cleaned);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const handleRaw = String(body.handle ?? "");
    const email = body.email ? String(body.email).trim().toLowerCase() : null;
    const phone = body.phone ? String(body.phone).trim() : null;
    const fullName = body.full_name ? String(body.full_name).trim() : null;
    const utm = body.utm ?? {};

    if (!handleRaw || handleRaw.length < 1) {
      return new Response(
        JSON.stringify({ error: "Informe seu @ do Instagram." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!email && !phone) {
      return new Response(
        JSON.stringify({ error: "Informe um email ou telefone para receber o diagnóstico." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const handle = sanitizeHandle(handleRaw);

    // Resolve tenant a partir do utm_source da landing.
    // Sem UTM ou UTM desconhecido = NULL → o DEFAULT da coluna (tenant principal) assume.
    let resolvedTenantId: string | null = null;
    const utmSource = utm?.source ? String(utm.source).trim() : null;
    if (utmSource) {
      const { data: rt } = await supabase.rpc("resolve_landing_tenant", { _utm_source: utmSource });
      if (rt) resolvedTenantId = rt as unknown as string;
    }

    // 0. Verifica limites por @
    const now = Date.now();
    const twelveHoursAgo = new Date(now - 12 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

    // 0.1 Cache: análise completed nas últimas 12h → devolve a antiga
    const { data: recent } = await supabase
      .from("diagnostics")
      .select("*")
      .eq("instagram_handle", handle)
      .eq("status", "completed")
      .gte("created_at", twelveHoursAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recent) {
      const profile = (recent.profile_data ?? {}) as Record<string, unknown>;
      const insights = (recent.insights ?? {}) as Record<string, unknown>;
      const scores = (recent.scores ?? {}) as Record<string, number>;
      return new Response(
        JSON.stringify({
          status: "completed",
          cached: true,
          handle,
          diagnostic_id: recent.id,
          profile: {
            username: profile?.username,
            fullName: profile?.fullName,
            biography: profile?.biography,
            profilePicUrl: profile?.profilePicUrl,
            followersCount: profile?.followersCount,
            followsCount: profile?.followsCount,
            postsCount: profile?.postsCount,
            verified: profile?.verified,
            businessCategoryName: profile?.businessCategoryName,
            externalUrl: profile?.externalUrl,
          },
          diagnosis: {
            score_geral: insights?.score_geral ?? 0,
            scores,
            pontos_fortes: insights?.pontos_fortes ?? [],
            gaps_criticos: insights?.gaps_criticos ?? [],
            plano_acao: insights?.plano_acao ?? [],
            veredicto: recent.ai_summary ?? "",
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 0.2 Bloqueio semanal: 3 análises completed nos últimos 7 dias
    const { data: weekly } = await supabase
      .from("diagnostics")
      .select("created_at")
      .eq("instagram_handle", handle)
      .eq("status", "completed")
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: true });

    if (weekly && weekly.length >= 3) {
      const oldest = new Date(weekly[0].created_at).getTime();
      const unlocksAt = new Date(oldest + 7 * 24 * 60 * 60 * 1000).toISOString();
      return new Response(
        JSON.stringify({
          status: "rate_limited",
          handle,
          reason: "weekly_limit",
          unlocks_at: unlocksAt,
          message:
            "Esse perfil já recebeu 3 análises essa semana. Compartilhe seu diagnóstico ou volte em breve.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 1. Cria/atualiza lead
    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .insert({
        instagram_handle: handle,
        email,
        phone,
        full_name: fullName,
        utm_source: utm.source ?? null,
        utm_medium: utm.medium ?? null,
        utm_campaign: utm.campaign ?? null,
        ...(resolvedTenantId ? { tenant_id: resolvedTenantId } : {}),
      })
      .select()
      .single();

    if (leadErr) {
      console.error("Erro ao salvar lead:", leadErr);
    }

    // 2. Scraping
    let profile: Record<string, unknown>;
    try {
      profile = await runApifyScraper(handle);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("Apify error:", msg);
      const { data: diag } = await supabase
        .from("diagnostics")
        .insert({
          lead_id: lead?.id ?? null,
          instagram_handle: handle,
          status: "failed",
          error_message: msg,
          ...(resolvedTenantId ? { tenant_id: resolvedTenantId } : {}),
        })
        .select()
        .single();
      return new Response(
        JSON.stringify({
          status: "failed",
          error: "Não conseguimos analisar esse perfil agora. Verifique se o @ está correto.",
          diagnostic_id: diag?.id,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const isPrivate = Boolean(profile?.private || profile?.isPrivate);

    // 3. Perfil privado -> retorna instrução
    if (isPrivate) {
      await supabase.from("leads").update({ profile_is_private: true }).eq("id", lead?.id);
      const { data: diag } = await supabase
        .from("diagnostics")
        .insert({
          lead_id: lead?.id ?? null,
          instagram_handle: handle,
          is_private: true,
          profile_data: profile,
          status: "private_profile",
          ...(resolvedTenantId ? { tenant_id: resolvedTenantId } : {}),
        })
        .select()
        .single();

      return new Response(
        JSON.stringify({
          status: "private_profile",
          handle,
          message:
            "Seu perfil está privado. Para gerarmos o diagnóstico real, abra temporariamente seu perfil ao público e tente de novo.",
          profile_preview: {
            username: profile?.username,
            fullName: profile?.fullName,
            profilePicUrl: profile?.profilePicUrl,
            followersCount: profile?.followersCount,
          },
          diagnostic_id: diag?.id,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 4. Diagnóstico via IA
    let aiResult;
    try {
      aiResult = await generateAIDiagnosis(profile);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("AI error:", msg);
      aiResult = {
        score_geral: 0,
        scores: {},
        pontos_fortes: [],
        gaps_criticos: [],
        plano_acao: [],
        veredicto: "Conseguimos puxar seus dados, mas a análise inteligente falhou. Tente de novo em instantes.",
      };
    }

    const { data: diag } = await supabase
      .from("diagnostics")
      .insert({
        lead_id: lead?.id ?? null,
        instagram_handle: handle,
        is_private: false,
        profile_data: profile,
        scores: aiResult.scores ?? {},
        insights: {
          pontos_fortes: aiResult.pontos_fortes ?? [],
          gaps_criticos: aiResult.gaps_criticos ?? [],
          plano_acao: aiResult.plano_acao ?? [],
          score_geral: aiResult.score_geral ?? 0,
        },
        ai_summary: aiResult.veredicto ?? "",
        status: "completed",
        ...(resolvedTenantId ? { tenant_id: resolvedTenantId } : {}),
      })
      .select()
      .single();

    // 5. Notifica o dono do tenant — best-effort, não bloqueia response
    void notifyLead(resolvedTenantId, {
      source: "capture",
      tenant_id: resolvedTenantId,
      lead_name: fullName ?? null,
      lead_email: email ?? null,
      lead_phone: phone ?? null,
      instagram_handle: handle,
      diagnostic_id: diag?.id ?? null,
      score: aiResult.score_geral ?? null,
      veredict: typeof aiResult.veredicto === "string"
        ? aiResult.veredicto.split(".")[0]?.trim() ?? null
        : null,
      created_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        status: "completed",
        handle,
        diagnostic_id: diag?.id,
        profile: {
          username: profile?.username,
          fullName: profile?.fullName,
          biography: profile?.biography,
          profilePicUrl: profile?.profilePicUrl,
          followersCount: profile?.followersCount,
          followsCount: profile?.followsCount,
          postsCount: profile?.postsCount,
          verified: profile?.verified,
          businessCategoryName: profile?.businessCategoryName,
          externalUrl: profile?.externalUrl,
        },
        diagnosis: aiResult,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Fatal:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
