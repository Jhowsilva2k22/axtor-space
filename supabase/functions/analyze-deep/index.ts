import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `Você é consultor sênior de negócios digitais. Sua tarefa: escrever um VEREDICT PERSUASIVO em PT-BR (180-260 palavras) baseado nas respostas REAIS do lead ao quiz, no briefing do dono do negócio e nos produtos disponíveis.

REGRAS ABSOLUTAS:
1. O veredict DEVE citar pelo menos 1 resposta específica do lead (parafraseada, não copiada). Ex: "Você marcou que [X] — isso indica [Y]".
2. O veredict DEVE usar o vocabulário/nicho do briefing (não generalize com "negócios digitais" se o briefing for paternidade ou outro nicho específico).
3. O veredict DEVE recomendar 1 produto específico com justificativa direta ("Por isso o {produto} faz sentido pra você AGORA, porque…").
4. O veredict DEVE terminar com chamada pra continuar pelo WhatsApp.
5. Tom: claro, premium, sem clichês motivacionais. Vulnerabilidade > performance.
6. PROIBIDO: markdown (**, ##), listas, emojis (máx 1 no fim), frases prontas tipo "transformação garantida", "fórmula", "destrave", "vai mudar sua vida".

REGRAS DE NOME:
- Use EXATAMENTE o "lead_name" passado. Se vazio/null, comece sem vocativo ("Olha, seus dados mostram…" ou "Os números deixam claro que…").
- Use o nome no máximo 1 vez, no início.

REGRAS DE PRODUTOS:
- Escolha 1 product como principal (recommended_product_id), o que melhor resolve a dor dominante.
- Escolha até 2 alternativos (alternative_product_ids). Se houver só 1 produto disponível, retorne array vazio.

FORMATAÇÃO:
- Use APENAS texto plano. Sem markdown, sem asteriscos, sem bullets, sem títulos com #, sem negrito. Apenas parágrafos separados por quebra de linha.`;

const TOOLS_ANTHROPIC = [
  {
    name: "deliver_veredict",
    description: "Retorna o produto principal escolhido, alternativas e veredicto personalizado.",
    input_schema: {
      type: "object",
      properties: {
        recommended_product_id: { type: "string" },
        alternative_product_ids: {
          type: "array",
          items: { type: "string" },
          description: "IDs de até 2 produtos alternativos. Pode ser vazio.",
        },
        veredict: {
          type: "string",
          description: "Veredict persuasivo em PT-BR, 180-260 palavras. DEVE citar pelo menos 1 resposta específica do lead (parafraseada) e usar terminologia/contexto do nicho do tenant. Sem markdown, sem listas, sem **negrito**, sem emojis.",
        },
      },
      required: ["recommended_product_id", "veredict"],
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
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

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

    // Busca o funnel incluindo briefing para contexto da IA
    const { data: funnel } = await admin
      .from("deep_funnels")
      .select("id, tenant_id, name, is_published, briefing")
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
      .select("id, name, description, pain_tag, price_hint, session_duration, plan_duration, whatsapp_template, checkout_url, cta_mode, result_media_url, result_media_type, who_for, how_it_works, benefits, urgency_text, cta_label, cta_secondary_label")
      .eq("funnel_id", funnel_id)
      .eq("is_active", true);

    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ error: "no_products" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Busca perguntas do funil para mapear answers (id -> texto + label)
    const { data: questions } = await admin
      .from("deep_funnel_questions")
      .select("id, question_text, options")
      .eq("funnel_id", funnel_id)
      .order("position");

    const dominantPain = pickDominantPain(pain_scores);

    // Helper: força que o nome no veredicto seja o lead_name real (ou remove vocativo se vazio)
    const enforceLeadName = (text: string): string => {
      if (!text) return text;
      const cleanName = (lead_name ?? "").toString().trim();
      const firstName = cleanName.split(/\s+/)[0] ?? "";
      if (firstName) {
        return text.replace(/^([A-Za-zÀ-ÿ]{2,30})\s*,/, (_m, p1) => {
          if (p1.toLowerCase() === firstName.toLowerCase()) return `${firstName},`;
          return `${firstName},`;
        });
      }
      return text.replace(/^[A-Za-zÀ-ÿ]{2,30}\s*[,:]\s*/, "");
    };

    // Helper: verifica se produto cobre uma dor (suporta pain_tag comma-separated)
    const productCoversPain = (p: { pain_tag?: string | null }, pain: string) =>
      String(p.pain_tag ?? "").split(",").map((t) => t.trim()).includes(pain);

    // Escolhe melhor produto pelo ranking de dores (do score mais alto ao mais baixo)
    const pickBestProduct = (prods: typeof products, scores: Record<string, number>) => {
      const ranked = Object.entries(scores)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .map(([k]) => k);
      for (const pain of ranked) {
        const match = prods.find((p) => productCoversPain(p, pain));
        if (match) return match;
      }
      return prods[0];
    };

    // Monta respostas enriquecidas (texto da pergunta + label da opção selecionada)
    const enrichedAnswers: Array<{ question: string; answer: string }> = [];
    if (Array.isArray(questions) && answers && typeof answers === "object") {
      for (const q of questions) {
        const selectedValue = answers[q.id];
        if (selectedValue === undefined || selectedValue === null) continue;
        const options: Array<{ label: string; value?: string | number }> = Array.isArray(q.options) ? q.options : [];
        let answerLabel = String(selectedValue);
        // selectedValue pode ser um único valor ou array (multi)
        const selectedArr = Array.isArray(selectedValue) ? selectedValue : [selectedValue];
        const labels = selectedArr
          .map((val) => {
            const opt = options.find((o) => String(o.value ?? o.label) === String(val) || o.label === String(val));
            return opt ? opt.label : String(val);
          })
          .filter(Boolean);
        if (labels.length > 0) answerLabel = labels.join(", ");
        enrichedAnswers.push({ question: q.question_text, answer: answerLabel });
      }
    }

    // Extrai campos relevantes do briefing
    const briefing = funnel.briefing ?? {};
    const business_name = briefing.business_name || funnel.name || "";
    const niche = briefing.niche || "";
    const ideal_client = briefing.ideal_client || "";
    const tone_of_voice = briefing.tone_of_voice || "";
    const transformation = briefing.transformation || "";

    // Monta mensagem estruturada para a IA
    const answersBlock = enrichedAnswers.length > 0
      ? enrichedAnswers.map((a) => `- "${a.question}": "${a.answer}"`).join("\n")
      : "- (sem respostas mapeadas)";

    const productsBlock = products.map((p) => JSON.stringify({
      id: p.id,
      name: p.name,
      description: p.description,
      pain_tag: p.pain_tag,
      price_hint: p.price_hint,
      who_for: p.who_for,
      benefits: p.benefits,
    })).join("\n");

    const userMessage = `Briefing do dono:
- Negócio: ${business_name}
- Nicho: ${niche}
- Cliente ideal: ${ideal_client}
- Tom: ${tone_of_voice}
- Transformação: ${transformation}

Respostas do lead (perguntas + opções selecionadas):
${answersBlock}

Pain scores (calculado pelas respostas):
${JSON.stringify(pain_scores)}

Dor dominante: ${dominantPain}

Produtos disponíveis (escolha 1 principal + até 2 alternativos):
${productsBlock}

Lead: ${lead_name || "anônimo"} @${instagram_handle || "—"}

Gere o veredict persuasivo agora.`;

    const aiResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
        tools: TOOLS_ANTHROPIC,
        tool_choice: { type: "tool", name: "deliver_veredict" },
      }),
    });

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      console.error("AI error:", aiResp.status, txt);
      const fallback = pickBestProduct(products, pain_scores);
      const cleanName = (lead_name ?? "").toString().trim().split(/\s+/)[0] ?? "";
      const greeting = cleanName ? `${cleanName}, ` : "";
      const ownerName = briefing?.business_name || "o time";
      const veredict = `${greeting}seus dados apontam que a maior alavanca agora está em ${dominantPain}. O caminho mais direto pra você é o "${fallback.name}" — converse com ${ownerName} no WhatsApp pra entender exatamente como aplicar isso ao seu caso.`;
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
    const toolBlock = Array.isArray(aiJson?.content)
      ? aiJson.content.find((b: any) => b?.type === "tool_use")
      : null;

    let recommended = pickBestProduct(products, pain_scores);
    let veredict = `Sua dor principal está em ${dominantPain}. Veja a recomendação abaixo.`;
    let alternativeIds: string[] = [];

    if (toolBlock) {
      // Anthropic: toolBlock.input é objeto direto, não JSON string
      const args = toolBlock.input;
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
