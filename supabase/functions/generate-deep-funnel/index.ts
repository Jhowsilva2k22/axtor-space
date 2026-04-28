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

REGRA DE PRODUTOS (rígida — viola e o funil não consegue entregar):
- O dono SEMPRE define os produtos no briefing. Você NUNCA inventa nada — nem nome, nem preço, nem duração, nem features. Não invente sequer "sugestões genéricas".
- O briefing TRAZ "products" (lista de produtos reais do dono). Use EXATAMENTE esses produtos: copie name, description, price_hint, session_duration, plan_duration e link LITERAIS do briefing — não traduza, não arredonde, não substitua, não infira nada que não tá lá.
- Distribua os produtos do briefing entre as 5 dores (marketing, gestao, vendas, ia, estrutura) baseado em qual dor cada produto melhor resolve. Se houver menos de 5 produtos, repita os mais versáteis cobrindo dores adicionais. Se houver mais de 5, escolha os 5 mais estratégicos.
- Use os campos extras de cada produto pra gerar copy MAIS CIRÚRGICA (não pra inventar dados):
  * tipo_entrega → influencia o tom do cta_label (ex: "Quero agendar minha mentoria" pra 1:1, "Quero entrar na próxima turma" pra grupo, "Quero acessar o curso" pra produto digital, "Quero contratar a consultoria" pra serviço pontual).
  * publico_alvo → vai literalmente no campo who_for (não reescreva — use as palavras do dono).
  * diferencial → entra como um dos benefits, posicionado como o bullet de destaque que justifica preço/escolha.
  * bonus_garantia → entra como urgency_text OU como benefit dedicado, dependendo de qual encaixa melhor no contexto da dor.
- Para CADA produto, gere um template de WhatsApp pronto, usando {{nome}} como placeholder do nome do lead.
- Se ALGUM campo do briefing estiver vazio (ex: dono não preencheu "diferencial"), mantenha vazio no output ou simplesmente não use no copy. NUNCA preencha com placeholder genérico ("Diferencial exclusivo", "Bônus surpresa" etc).

PARA CADA PRODUTO, preencha OBRIGATORIAMENTE os campos de copy estruturada:
- who_for: 1 frase descrevendo PRA QUEM É (perfil específico, momento, dor)
- how_it_works: 1-2 frases descrevendo COMO FUNCIONA (formato e dinâmica). NÃO mencione duração — isso fica nos campos session_duration / plan_duration controlados pelo dono.
- benefits: array de 3-5 bullets curtos e concretos (transformações/entregas, sem floreio)
- urgency_text: 1 frase de URGÊNCIA OU ESCASSEZ honesta (ex: "Próxima turma fecha sexta — 12 vagas", "Bônus de implementação até domingo", "Só 5 vagas por mês"). Se não fizer sentido, deixe vazio.
- cta_label: texto do BOTÃO PRINCIPAL adequado ao tipo de oferta. Use frases ativas em 1ª pessoa, ex: "Quero entrar na próxima turma", "Quero agendar minha consultoria", "Quero comprar agora", "Quero garantir minha vaga", "Quero começar agora".
- cta_secondary_label: texto do botão WhatsApp secundário, ex: "Falar com o time", "Tirar dúvida no WhatsApp", "Quero conversar antes".`;

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
                session_duration: { type: "string", description: "Duração da sessão (ex: '1 hora'). COPIE LITERAL do briefing; se não houver, deixe vazio." },
                plan_duration: { type: "string", description: "Duração do plano de ação (ex: '30 dias'). COPIE LITERAL do briefing; se não houver, deixe vazio." },
                checkout_url: { type: "string" },
                whatsapp_template: { type: "string", description: "Mensagem pronta com {{nome}} placeholder" },
                who_for: { type: "string", description: "Pra quem é o produto (1 frase)" },
                how_it_works: { type: "string", description: "Como funciona (1-2 frases)" },
                benefits: { type: "array", items: { type: "string" }, description: "3-5 bullets curtos" },
                urgency_text: { type: "string", description: "Frase de urgência/escassez (opcional)" },
                cta_label: { type: "string", description: "Texto do botão principal" },
                cta_secondary_label: { type: "string", description: "Texto do botão WhatsApp" },
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
    // Onda 4 — usa Gemini direto (Google AI Studio) em vez do Lovable AI Gateway.
    // Independência do Lovable + free tier do Gemini cobre o volume previsível.
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

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

    // Onda 4 — proibido gerar funil sem produtos do dono.
    // Antes a IA inventava produtos quando o briefing vinha vazio; agora isso quebra o funil
    // (cliente fecha cobrança e o dono não tem como entregar). Bloqueio rígido aqui.
    const incomingProducts = Array.isArray((briefing as Record<string, unknown>)?.products)
      ? ((briefing as { products: unknown[] }).products as Array<Record<string, unknown>>)
      : [];
    const validIncomingProducts = incomingProducts.filter(
      (p) => typeof p?.name === "string" && (p.name as string).trim().length > 0,
    );
    if (validIncomingProducts.length === 0) {
      return new Response(
        JSON.stringify({
          error: "missing_products",
          message:
            "Cadastre pelo menos 1 produto antes de gerar o funil. A IA não inventa produtos — ela só usa os seus.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
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

    // Chama Gemini direto via Google AI Studio (sem proxy Lovable).
    // Tenta 2.5-flash primeiro (mais inteligente). Se 503 (sobrecarga), faz retry com 2s
    // e depois fallback pro 2.0-flash (mais estável). JSON Schema mode pra structured output.
    const GEMINI_REQUEST_BODY = JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Briefing do dono:\n\n${JSON.stringify(briefing, null, 2)}\n\nGere o funil completo agora retornando JSON estruturado seguindo o schema.`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        // 32768 cobre 12 perguntas × 4-5 opções × pain_weights + 5 produtos com copy estruturada.
        // 8192 era pouco e Gemini truncava o JSON, quebrando o parse.
        maxOutputTokens: 32768,
        responseMimeType: "application/json",
        responseSchema: TOOLS[0].function.parameters,
      },
    });

    const callGemini = async (model: string): Promise<Response> => {
      return fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: GEMINI_REQUEST_BODY,
        },
      );
    };

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // Estratégia: 2.5-flash → retry após 2s → 2.0-flash fallback → retry 2.0-flash após 2s
    let aiResp: Response | null = null;
    const attempts: Array<{ model: string; delayMs: number }> = [
      { model: "gemini-2.5-flash", delayMs: 0 },
      { model: "gemini-2.5-flash", delayMs: 2000 },
      { model: "gemini-2.0-flash", delayMs: 0 },
      { model: "gemini-2.0-flash", delayMs: 2000 },
    ];

    for (const { model, delayMs } of attempts) {
      if (delayMs > 0) await sleep(delayMs);
      try {
        const r = await callGemini(model);
        if (r.ok) {
          aiResp = r;
          break;
        }
        // 503/429/500 → tenta de novo. Outros (400, 401, 403) → sai do loop, é erro definitivo.
        if (r.status !== 503 && r.status !== 429 && r.status !== 500) {
          aiResp = r;
          break;
        }
        const txt = await r.text();
        console.warn(`Gemini ${model} retornou ${r.status}, tentando próximo:`, txt.slice(0, 200));
      } catch (e) {
        console.warn(`Gemini ${model} exception:`, (e as Error).message);
      }
    }

    if (!aiResp || !aiResp.ok) {
      const status = aiResp?.status ?? 503;
      const txt = aiResp ? await aiResp.text() : "no response after retries";
      console.error("Gemini falhou em todas as tentativas:", status, txt);
      const errCode =
        status === 429
          ? "rate_limited"
          : status === 503
            ? "model_overloaded"
            : status === 403 || status === 401
              ? "ai_credits"
              : "ai_error";
      return new Response(
        JSON.stringify({ error: errCode, detail: txt.slice(0, 500), status }),
        {
          status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const aiJson = await aiResp.json();
    // Em JSON Schema mode, Gemini retorna o JSON estruturado em candidates[0].content.parts[0].text
    const parts = aiJson.candidates?.[0]?.content?.parts ?? [];
    const textPart = parts.find((p: { text?: string }) => typeof p?.text === "string");
    if (!textPart?.text) {
      console.error("Gemini sem texto:", JSON.stringify(aiJson).slice(0, 1000));
      return new Response(
        JSON.stringify({ error: "no_tool_call", raw: aiJson }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    let args: Record<string, unknown>;
    try {
      args = JSON.parse(textPart.text);
    } catch (e) {
      console.error("Gemini JSON parse falhou:", textPart.text.slice(0, 500));
      return new Response(
        JSON.stringify({ error: "invalid_json", detail: (e as Error).message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

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
        session_duration: p.session_duration ?? null,
        plan_duration: p.plan_duration ?? null,
        checkout_url: checkout,
        cta_mode: checkout ? "checkout" : "whatsapp",
        whatsapp_template: p.whatsapp_template ?? null,
        who_for: p.who_for ?? null,
        how_it_works: p.how_it_works ?? null,
        benefits: Array.isArray(p.benefits) ? p.benefits : [],
        urgency_text: p.urgency_text ?? null,
        cta_label: p.cta_label ?? null,
        cta_secondary_label: p.cta_secondary_label ?? null,
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