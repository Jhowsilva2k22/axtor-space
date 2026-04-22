import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Authenticate the caller as admin
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1) Create a run row
    const { data: run, error: runErr } = await admin
      .from("improvement_runs")
      .insert({ status: "pending", created_by: userData.user.id })
      .select()
      .single();
    if (runErr) throw runErr;

    // 2) Gather inputs in parallel
    const [
      feedbackRes,
      analyticsRes,
      bioConfigRes,
      blocksRes,
      categoriesRes,
      diagnosticsRes,
      campaignsRes,
      previousRecsRes,
    ] = await Promise.all([
      admin
        .from("user_feedback")
        .select("id,category,message,sentiment,page_path,block_id,created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      admin.rpc("get_analytics_summary", { _days: 30 }),
      admin.from("bio_config").select("*").maybeSingle(),
      admin
        .from("bio_blocks")
        .select(
          "id,kind,label,description,url,badge,highlight,position,is_active,size,category_id",
        )
        .order("position"),
      admin.from("bio_categories").select("id,name,slug,is_active").order("position"),
      admin
        .from("diagnostics")
        .select("instagram_handle,scores,ai_summary,status,created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      admin
        .from("bio_block_campaigns")
        .select("slug,label,clicks_count,is_active,block_id"),
      admin
        .from("improvement_recommendations")
        .select("title,status,impact,created_at")
        .order("created_at", { ascending: false })
        .limit(40),
    ]);

    const inputs = {
      feedback_count: feedbackRes.data?.length ?? 0,
      analytics: analyticsRes.data ?? null,
      bio_config: bioConfigRes.data ?? null,
      blocks_count: blocksRes.data?.length ?? 0,
      blocks: blocksRes.data ?? [],
      categories: categoriesRes.data ?? [],
      feedback: feedbackRes.data ?? [],
      diagnostics_recent: diagnosticsRes.data ?? [],
      campaigns: campaignsRes.data ?? [],
      previous_recommendations: previousRecsRes.data ?? [],
    };

    // 3) Build the system + user prompt
    const systemPrompt = `Você é um especialista em CRO (otimização de conversão), copy persuasiva e UX para páginas de bio/link-in-bio. Sua missão é analisar dados quantitativos (analytics, cliques, CTR) e qualitativos (feedback de visitantes) e gerar recomendações ACIONÁVEIS, ESPECÍFICAS e PRIORIZADAS para o dono do site melhorar a página /bio e a estratégia geral.

REGRAS:
- Gere entre 5 e 10 recomendações.
- Cada recomendação deve ser específica para ESTE site (cite blocos reais pelo label, números reais do analytics, frases reais do feedback).
- NUNCA invente dados. Se não houver evidência suficiente para uma sugestão, não a faça.
- Priorize: o que aparece em múltiplos feedbacks > problemas com alto impacto no funil > otimizações de copy/UX.
- Evite repetir recomendações já marcadas como 'applied' ou 'dismissed' nas previous_recommendations.
- Categorias válidas: copy, ux, performance, content, conversion, trust, mobile, accessibility, seo, analytics.
- impact e effort: low | medium | high.
- Sempre escreva em português do Brasil.`;

    const userPrompt = `Aqui estão os dados consolidados do site para você analisar:

## Configuração da Bio
${JSON.stringify(inputs.bio_config, null, 2)}

## Blocos atuais (${inputs.blocks_count})
${JSON.stringify(inputs.blocks, null, 2)}

## Categorias
${JSON.stringify(inputs.categories, null, 2)}

## Analytics dos últimos 30 dias
${JSON.stringify(inputs.analytics, null, 2)}

## Campanhas (UTM/links curtos)
${JSON.stringify(inputs.campaigns, null, 2)}

## Feedback dos visitantes (${inputs.feedback_count} mensagens recentes)
${JSON.stringify(inputs.feedback, null, 2)}

## Diagnósticos recentes (Instagram analisados)
${JSON.stringify(inputs.diagnostics_recent, null, 2)}

## Recomendações já geradas anteriormente (não repetir as 'applied' nem 'dismissed')
${JSON.stringify(inputs.previous_recommendations, null, 2)}

Agora gere as recomendações usando a função emit_recommendations.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "emit_recommendations",
          description:
            "Emite a lista final de recomendações priorizadas e o resumo executivo.",
          parameters: {
            type: "object",
            properties: {
              executive_summary: {
                type: "string",
                description:
                  "Resumo executivo de 2-4 frases em português destacando o panorama geral e os 1-2 pontos mais críticos.",
              },
              recommendations: {
                type: "array",
                minItems: 3,
                maxItems: 10,
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "Título curto e direto (máx 80 chars)." },
                    summary: { type: "string", description: "O que fazer, em 1-3 frases." },
                    rationale: { type: "string", description: "Por que isso importa, citando dados/feedback." },
                    category: {
                      type: "string",
                      enum: [
                        "copy",
                        "ux",
                        "performance",
                        "content",
                        "conversion",
                        "trust",
                        "mobile",
                        "accessibility",
                        "seo",
                        "analytics",
                      ],
                    },
                    impact: { type: "string", enum: ["low", "medium", "high"] },
                    effort: { type: "string", enum: ["low", "medium", "high"] },
                    evidence: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          source: {
                            type: "string",
                            enum: ["feedback", "analytics", "bio_config", "block", "diagnostic", "campaign"],
                          },
                          detail: { type: "string" },
                        },
                        required: ["source", "detail"],
                        additionalProperties: false,
                      },
                    },
                    action_type: {
                      type: "string",
                      enum: ["edit_bio_config", "edit_block", "create_block", "edit_category", "manual"],
                    },
                    action_payload: {
                      type: "object",
                      description: "Payload sugerido (ex: { block_id, fields: { label, description } }).",
                      additionalProperties: true,
                    },
                  },
                  required: ["title", "summary", "rationale", "category", "impact", "effort", "evidence", "action_type"],
                  additionalProperties: false,
                },
              },
            },
            required: ["executive_summary", "recommendations"],
            additionalProperties: false,
          },
        },
      },
    ];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "emit_recommendations" } },
      }),
    });

    if (!aiResponse.ok) {
      const txt = await aiResponse.text();
      console.error("AI gateway error", aiResponse.status, txt);
      await admin
        .from("improvement_runs")
        .update({
          status: "failed",
          error_message: `AI gateway ${aiResponse.status}: ${txt.slice(0, 500)}`,
          completed_at: new Date().toISOString(),
        })
        .eq("id", run.id);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos do AI Gateway esgotados. Adicione créditos em Settings > Workspace > Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({ error: "Erro ao chamar IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    const argsRaw = toolCall?.function?.arguments;
    if (!argsRaw) {
      console.error("No tool call in AI response", JSON.stringify(aiData).slice(0, 1000));
      await admin
        .from("improvement_runs")
        .update({ status: "failed", error_message: "IA não retornou tool call", completed_at: new Date().toISOString() })
        .eq("id", run.id);
      return new Response(JSON.stringify({ error: "IA não retornou recomendações" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed: { executive_summary: string; recommendations: any[] };
    try {
      parsed = JSON.parse(argsRaw);
    } catch (e) {
      console.error("JSON parse error", e, argsRaw);
      throw new Error("Falha ao interpretar resposta da IA");
    }

    const impactWeight: Record<string, number> = { low: 1, medium: 2, high: 3 };
    const effortWeight: Record<string, number> = { low: 3, medium: 2, high: 1 };

    const rows = (parsed.recommendations || []).map((r) => ({
      title: r.title,
      summary: r.summary,
      rationale: r.rationale ?? null,
      category: r.category ?? "general",
      impact: r.impact ?? "medium",
      effort: r.effort ?? "medium",
      priority_score:
        (impactWeight[r.impact] ?? 2) * 10 + (effortWeight[r.effort] ?? 2),
      evidence: r.evidence ?? [],
      action_type: r.action_type ?? "manual",
      action_payload: r.action_payload ?? null,
      source_run_id: run.id,
      status: "new",
    }));

    if (rows.length > 0) {
      const { error: insErr } = await admin
        .from("improvement_recommendations")
        .insert(rows);
      if (insErr) throw insErr;
    }

    await admin
      .from("improvement_runs")
      .update({
        status: "completed",
        ai_summary: parsed.executive_summary,
        recommendations_count: rows.length,
        inputs_summary: {
          feedback_count: inputs.feedback_count,
          blocks_count: inputs.blocks_count,
          analytics_period_days: 30,
        },
        completed_at: new Date().toISOString(),
      })
      .eq("id", run.id);

    return new Response(
      JSON.stringify({
        run_id: run.id,
        executive_summary: parsed.executive_summary,
        count: rows.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("generate-improvements error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});