import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `Você é consultor sênior de negócios digitais. A partir do perfil do lead, dor dominante detectada
e catálogo de produtos do dono, escreva um VEREDICTO PERSUASIVO em PT-BR (180-260 palavras), em primeira pessoa do diagnosticador,
que: (1) valida a dor sem ser óbvio, (2) conecta a dor à oportunidade real, (3) recomenda o produto que melhor resolve com justificativa direta,
(4) termina com chamada pra continuar a conversa pelo WhatsApp. Tom: claro, premium, sem clichês, sem emojis em excesso.

REGRA CRÍTICA SOBRE NOME:
- Use EXATAMENTE o "lead_name" fornecido no payload, sem alterar, sem traduzir, sem inventar.
- Se "lead_name" estiver vazio, nulo ou ausente, NÃO invente nome — comece o veredicto sem vocativo (ex: "Olha, seu diagnóstico…" ou "Os dados mostram…"). NUNCA chute um nome.
- Use o nome no máximo 1 vez no texto, no início. Não repita.

REGRA DE PRODUTOS:
- Você DEVE escolher 1 produto principal (recommended_product_id) — o que MELHOR resolve a dor dominante.
- Você DEVE também escolher até 2 produtos alternativos (alternative_product_ids) — produtos diferentes do principal que ainda fazem sentido pra esse perfil (complementares ou caminhos alternativos). Se só houver 1 produto disponível, retorne array vazio.
- O veredicto deve focar no produto principal, mas pode mencionar brevemente que existem alternativas.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "deliver_veredict",
      description: "Retorna o produto principal escolhido, alternativas e veredicto.",
      parameters: {
        type: "object",
        properties: {
          recommended_product_id: { type: "string" },
          alternative_product_ids: {
            type: "array",
            items: { type: "string" },
            description: "IDs de até 2 produtos alternativos relevantes pro perfil. Pode ser vazio.",
          },
          veredict: { type: "string", description: "Texto persuasivo em PT-BR, 180-260 palavras" },
        },
        required: ["recommended_product_id", "veredict"],
        additionalProperties: false,
      },
    },
  },
];

function pickDominantPain(scores: Record<string, number>): string {
  let best = "vendas";
  let max = -Infinity;
  for (const [k, v] of Object.entries(scores)) {
    if (typeof v === "number" && v > max) {
      max = v;
      best = k;
    }
  }
  return best;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const body = await req.json();
    const {
      funnel_id,
      diagnostic_id,
      answers,
      pain_scores,
      lead_name,
      lead_email,
      lead_phone,
      instagram_handle,
      session_id,
      utm_source,
      utm_medium,
      utm_campaign,
    } = body ?? {};

    if (!funnel_id || !answers || !pain_scores) {
      return new Response(JSON.stringify({ error: "missing_params" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: funnel } = await admin
      .from("deep_funnels")
      .select("id, tenant_id, name, is_published")
      .eq("id", funnel_id)
      .maybeSingle();
    if (!funnel || !funnel.is_published) {
      return new Response(JSON.stringify({ error: "funnel_not_available" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: products } = await admin
      .from("deep_funnel_products")
      .select("id, name, description, pain_tag, price_hint, whatsapp_template, checkout_url, cta_mode, result_media_url, result_media_type, who_for, how_it_works, benefits, urgency_text, cta_label, cta_secondary_label")
      .eq("funnel_id", funnel_id);

    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ error: "no_products" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dominantPain = pickDominantPain(pain_scores);

    // Helper: força que o nome no veredicto seja o lead_name real (ou remove vocativo se vazio)
    const enforceLeadName = (text: string): string => {
      if (!text) return text;
      const cleanName = (lead_name ?? "").toString().trim();
      const firstName = cleanName.split(/\s+/)[0] ?? "";
      // Se temos nome real, troca qualquer vocativo "Nome," no início pelo nome correto
      if (firstName) {
        return text.replace(/^([A-Za-zÀ-ÿ]{2,30})\s*,/, (_m, p1) => {
          if (p1.toLowerCase() === firstName.toLowerCase()) return `${firstName},`;
          return `${firstName},`;
        });
      }
      // Sem nome → remove vocativo inicial "Nome," ou "Nome:" (se IA inventar)
      return text.replace(/^[A-Za-zÀ-ÿ]{2,30}\s*[,:]\s*/, "");
    };

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: JSON.stringify({
              lead: { lead_name, instagram_handle },
              dor_dominante: dominantPain,
              pain_scores,
              produtos: products,
            }),
          },
        ],
        tools: TOOLS,
        tool_choice: { type: "function", function: { name: "deliver_veredict" } },
      }),
    });

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      console.error("AI error:", aiResp.status, txt);
      const errCode = aiResp.status === 429 ? "rate_limited" : aiResp.status === 402 ? "ai_credits" : "ai_error";
      // fallback: pega 1º produto da dor dominante
      const fallback = products.find((p) => p.pain_tag === dominantPain) ?? products[0];
      const cleanName = (lead_name ?? "").toString().trim().split(/\s+/)[0] ?? "";
      const greeting = cleanName ? `${cleanName}, identificamos` : "Identificamos";
      const veredict = `${greeting} sua dor principal em ${dominantPain}. Recomendamos: ${fallback.name}. Continue pelo WhatsApp para entender como aplicar isso ao seu caso.`;
      // Alternativas no fallback: até 2 outros produtos
      const alternatives = products.filter((p) => p.id !== fallback.id).slice(0, 2);
      const { data: saved } = await admin
        .from("deep_diagnostics")
        .upsert({
          id: diagnostic_id ?? undefined,
          funnel_id,
          tenant_id: funnel.tenant_id,
          session_id,
          lead_name,
          lead_email,
          lead_phone,
          instagram_handle,
          answers,
          pain_scores,
          pain_detected: dominantPain,
          recommended_product_id: fallback.id,
          ai_veredict: veredict,
          status: "completed",
          utm_source,
          utm_medium,
          utm_campaign,
        })
        .select("id")
        .single();
      return new Response(
        JSON.stringify({
          diagnostic_id: saved?.id,
          pain_detected: dominantPain,
          product: fallback,
          products: [fallback, ...alternatives],
          veredict,
          ai_fallback: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    let recommended = products.find((p) => p.pain_tag === dominantPain) ?? products[0];
    let veredict = `Sua dor principal está em ${dominantPain}. Veja a recomendação abaixo.`;
    let alternativeIds: string[] = [];
    if (toolCall) {
      const args = JSON.parse(toolCall.function.arguments);
      const found = products.find((p) => p.id === args.recommended_product_id);
      if (found) recommended = found;
      if (args.veredict) veredict = args.veredict;
      if (Array.isArray(args.alternative_product_ids)) {
        alternativeIds = args.alternative_product_ids
          .filter((id: string) => typeof id === "string" && id !== recommended.id)
          .slice(0, 2);
      }
    }
    // Aplica trava de nome real
    veredict = enforceLeadName(veredict);
    // Resolve alternativas (com fallback caso IA não retorne)
    let alternatives = alternativeIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => !!p);
    if (alternatives.length === 0) {
      alternatives = products.filter((p) => p.id !== recommended.id).slice(0, 2);
    }

    const { data: saved } = await admin
      .from("deep_diagnostics")
      .upsert({
        id: diagnostic_id ?? undefined,
        funnel_id,
        tenant_id: funnel.tenant_id,
        session_id,
        lead_name,
        lead_email,
        lead_phone,
        instagram_handle,
        answers,
        pain_scores,
        pain_detected: dominantPain,
        recommended_product_id: recommended.id,
        ai_veredict: veredict,
        status: "completed",
        utm_source,
        utm_medium,
        utm_campaign,
      })
      .select("id")
      .single();

    return new Response(
      JSON.stringify({
        diagnostic_id: saved?.id,
        pain_detected: dominantPain,
        product: recommended,
        products: [recommended, ...alternatives],
        veredict,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("analyze-deep error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});