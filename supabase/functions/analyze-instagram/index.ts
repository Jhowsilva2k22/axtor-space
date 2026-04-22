import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const APIFY_TOKEN = Deno.env.get("APIFY_API_TOKEN")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

function sanitizeHandle(raw: string): string {
  return raw.trim().replace(/^@+/, "").replace(/\/+$/, "").toLowerCase();
}

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
  const prompt = `Você é um estrategista digital sênior, direto, com pegada de consultor premium. Analise este perfil real do Instagram e devolva um diagnóstico AFIADO em português brasileiro.

DADOS DO PERFIL:
${JSON.stringify(profile, null, 2)}

Devolva APENAS um JSON válido (sem markdown) no formato:
{
  "score_geral": <0-100>,
  "scores": {
    "posicionamento": <0-100>,
    "bio_e_cta": <0-100>,
    "consistencia": <0-100>,
    "engajamento": <0-100>,
    "conversao": <0-100>
  },
  "pontos_fortes": ["3 frases curtas e específicas"],
  "gaps_criticos": ["3 frases mostrando o que tá deixando dinheiro na mesa"],
  "plano_acao": ["5 ações práticas e priorizadas"],
  "veredicto": "1 parágrafo de 2-3 frases, direto, falando como um consultor."
}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "Responda apenas com JSON válido." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`IA falhou [${res.status}]: ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";
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
      })
      .select()
      .single();

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