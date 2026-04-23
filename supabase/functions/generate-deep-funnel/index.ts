import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `Você é especialista em funis de vendas de alta conversão e diagnóstico de negócios digitais.
Seu trabalho: a partir de um briefing profundo do dono de um negócio (criador, coach, infoprodutor, agência, mentor, etc),
gerar um QUIZ DE QUALIFICAÇÃO de 12 perguntas que detecta a DOR DOMINANTE do lead em 5 categorias:
marketing, gestao, vendas, ia, estrutura.

Cada opção de resposta deve ter pesos numéricos (pain_weights) somando aproximadamente 4-6 pontos distribuídos entre as 5 dores.
As perguntas devem ser INTELIGENTES, sentir-se feitas sob medida, despertar identificação ("é exatamente isso que acontece comigo").
Use o vocabulário, nicho e tom do briefing. Linguagem em PT-BR direta, persuasiva, sem clichês.

Tipos permitidos de pergunta: 'single' (1 escolha), 'multi' (várias), 'scale' (1-5).
Para 'single' e 'multi': 4-5 opções. Para 'scale': use 5 opções de 1 a 5 com labels descritivos.

REGRA DE PRODUTOS:
- Se o briefing trouxer "products" (lista de produtos reais do dono), use EXATAMENTE esses produtos: mantenha nome, descrição e preço fornecidos. Distribua-os entre as 5 dores (marketing, gestao, vendas, ia, estrutura). Se houver menos de 5, repita os mais versáteis pra cobrir todas as dores. Se houver mais de 5, escolha os 5 melhores.
- Se NÃO houver produtos no briefing, invente 5 produtos sugeridos (1 por dor) com nome, descrição persuasiva e preço estimado coerente com o nicho.
- Em todos os casos, gere um template de WhatsApp pronto pra cada produto, usando {{nome}} como placeholder do nome do lead.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "create_deep_funnel",
      description: "Cria o funil de qualificação completo a partir do briefing.",
      parameters: {
        type: "object",
        properties: {
          welcome_text: { type: "string" },
          result_intro: { type: "string" },
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question_text: { type: "string" },
                subtitle: { type: "string" },
                question_type: { type: "string" },
                options: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      label: { type: "string" },
                      pain_weights: {
                        type: "object",
                        properties: {
                          marketing: { type: "number" },
                          gestao: { type: "number" },
                          vendas: { type: "number" },
                          ia: { type: "number" },
                          estrutura: { type: "number" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          products: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                pain_tag: { type: "string" },
                price_hint: { type: "string" },
                checkout_url: { type: "string" },
                whatsapp_template: { type: "string", description: "Mensagem pronta com {{nome}} placeholder" },
              },
            },
          },
        },
        required: ["welcome_text", "questions", "products"],
      },
    },
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { tenant_id, briefing, funnel_id } = body ?? {};
    if (!tenant_id || !briefing) {
      return new Response(JSON.stringify({ error: "missing_params" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Valida ownership + addon
    const { data: tenant } = await admin
      .from("tenants")
      .select("id, owner_user_id, plan, display_name")
      .eq("id", tenant_id)
      .maybeSingle();

    if (!tenant) {
      return new Response(JSON.stringify({ error: "tenant_not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    const isAdmin = !!roleRow;
    const isOwner = tenant.owner_user_id === userData.user.id;
    if (!isAdmin && !isOwner) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: addonRpc } = await admin.rpc("has_addon", {
      _tenant_id: tenant_id,
      _addon_slug: "deep_diagnostic",
    });
    if (!addonRpc) {
      return new Response(JSON.stringify({ error: "addon_required" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Chama Lovable AI
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Briefing do dono:\n\n${JSON.stringify(briefing, null, 2)}\n\nGere o funil completo agora.` },
        ],
        tools: TOOLS,
        tool_choice: { type: "function", function: { name: "create_deep_funnel" } },
      }),
    });

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      console.error("AI error:", aiResp.status, txt);
      const errCode = aiResp.status === 429 ? "rate_limited" : aiResp.status === 402 ? "ai_credits" : "ai_error";
      return new Response(JSON.stringify({ error: errCode }), {
        status: aiResp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "no_tool_call", raw: aiJson }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const args = JSON.parse(toolCall.function.arguments);

    // Cria ou atualiza o funil
    const baseSlug = (briefing.business_name || tenant.display_name || "funil")
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30);
    const slug = funnel_id ? undefined : `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

    let finalFunnelId = funnel_id;
    if (!finalFunnelId) {
      const { data: created, error: insertErr } = await admin
        .from("deep_funnels")
        .insert({
          tenant_id,
          name: briefing.business_name || `${tenant.display_name} — Diagnóstico`,
          slug,
          briefing,
          welcome_text: args.welcome_text,
          result_intro: args.result_intro ?? null,
          is_published: false,
        })
        .select("id")
        .single();
      if (insertErr) {
        console.error("Insert funnel failed:", insertErr);
        throw insertErr;
      }
      finalFunnelId = created.id;
    } else {
      await admin
        .from("deep_funnels")
        .update({
          briefing,
          welcome_text: args.welcome_text,
          result_intro: args.result_intro ?? null,
        })
        .eq("id", funnel_id)
        .eq("tenant_id", tenant_id);
      // limpa perguntas e produtos antigos
      await admin.from("deep_funnel_questions").delete().eq("funnel_id", funnel_id);
      await admin.from("deep_funnel_products").delete().eq("funnel_id", funnel_id);
    }

    const questionsRows = args.questions.map((q: any, i: number) => ({
      funnel_id: finalFunnelId,
      position: i,
      question_text: q.question_text,
      subtitle: q.subtitle ?? null,
      question_type: q.question_type,
      options: q.options,
    }));
    // Mapa nome->link vindo do briefing pra preservar checkout do dono
    const briefingProducts: Array<{ name?: string; link?: string }> = Array.isArray(briefing?.products)
      ? briefing.products
      : [];
    const linkByName = new Map<string, string>();
    for (const bp of briefingProducts) {
      if (bp?.name && bp?.link) linkByName.set(bp.name.trim().toLowerCase(), bp.link);
    }
    const validPains = new Set(["marketing", "gestao", "vendas", "ia", "estrutura"]);
    const productsRows = args.products.map((p: any, i: number) => {
      const checkout = p.checkout_url || linkByName.get(String(p.name ?? "").trim().toLowerCase()) || null;
      const painTag = validPains.has(p.pain_tag) ? p.pain_tag : "vendas";
      return {
        funnel_id: finalFunnelId,
        position: i,
        name: p.name,
        description: p.description,
        pain_tag: painTag,
        price_hint: p.price_hint ?? null,
        checkout_url: checkout,
        cta_mode: checkout ? "checkout" : "whatsapp",
        whatsapp_template: p.whatsapp_template ?? null,
      };
    });

    await admin.from("deep_funnel_questions").insert(questionsRows);
    await admin.from("deep_funnel_products").insert(productsRows);

    return new Response(
      JSON.stringify({ funnel_id: finalFunnelId, slug, questions_count: questionsRows.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("generate-deep-funnel error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});