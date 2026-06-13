import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { captureException } from "../_shared/sentry.ts";

import { corsHeadersFor } from "../_shared/cors.ts";
import { peekCredits, consumeCredits } from "../_shared/credits.ts";

const SYSTEM_PROMPT_QUIZ = `Você é especialista em funis de vendas de alta conversão e diagnóstico de negócios digitais.
Seu trabalho: a partir de um briefing profundo do dono de um negócio (criador, coach, infoprodutor, agência, mentor, etc),
gerar um QUIZ DE QUALIFICAÇÃO (a quantidade de perguntas é definida no pedido do usuário) que detecta a DOR DOMINANTE do lead em 5 categorias:
marketing, gestao, vendas, ia, estrutura.

Cada opção de resposta deve ter pesos numéricos (pain_weights) somando aproximadamente 4-6 pontos distribuídos entre as 5 dores.
As perguntas devem ser INTELIGENTES, sentir-se feitas sob medida, despertar identificação ("é exatamente isso que acontece comigo").
Use o vocabulário, nicho e tom do briefing. Linguagem em PT-BR direta, persuasiva, sem clichês.

Tipos permitidos de pergunta: 'single' (1 escolha), 'multi' (várias), 'scale' (1-5).
Para 'single' e 'multi': 4-5 opções. Para 'scale': use 5 opções de 1 a 5 com labels descritivos.

Gere também welcome_text (boas-vindas do quiz, 1-2 frases motivadoras) e result_intro (introdução da página de resultado, 1-2 frases).`;

const SYSTEM_PROMPT_PRODUCTS = `Você é especialista em copy de vendas e estruturação de ofertas para negócios digitais.
A partir do briefing do dono de um negócio, gere os cards de produto para o funil de diagnóstico.
Linguagem em PT-BR direta, persuasiva, sem clichês. Use o vocabulário e tom do briefing.

REGRA DE PRODUTOS:
- Use APENAS os produtos do briefing. Não invente nome, preço, duração, link, features, nada. Se algum campo vier vazio no briefing, mantenha vazio no output — não preencha com placeholder, não traduza, não arredonde, não substitua.
- O briefing traz "products" com os produtos reais do dono. Copie LITERAL: name, price_hint, session_duration, plan_duration, checkout_url. Output = exatamente o que entra.
- Se price_hint vier "A combinar", "Sob consulta", "Valor sob consulta", "" (vazio) ou similar — copie LITERAL. Nunca chute número.
- Se checkout_url vier vazio — deixe vazio no output. Não invente URL nem aponte pra placeholder.
- Distribua os produtos entre as 5 dores (marketing, gestao, vendas, ia, estrutura). Para cada produto, o campo pain_tag pode conter MÚLTIPLAS dores separadas por vírgula (ex: "vendas,gestao"). Use isso para garantir que TODAS as 5 dores tenham pelo menos 1 produto mapeado. Se houver menos produtos que dores, atribua múltiplas dores ao mesmo produto. Se houver mais, escolha os melhores. Sem inventar nada novo.
- Em todos os casos, gere um template de WhatsApp pronto pra cada produto, usando {{nome}} como placeholder do nome do lead.

USO DOS CAMPOS DE CONTEXTO DO BRIEFING (quando vierem em cada produto):
- tipo_entrega: ajuste o tom do cta_label. Casos:
  • "1:1" / "individual" + checkout_url preenchido → "Quero agendar minha mentoria"
  • "1:1" / "individual" + checkout_url vazio OU price_hint "A combinar" → "Quero conversar sobre essa mentoria"
  • "grupo" / "turma" → "Quero entrar na próxima turma"
  • "online assíncrono" / "curso gravado" → "Quero acessar o curso"
  • "presencial" → "Quero garantir minha vaga"
  • Sem tipo_entrega definido → escolha pelo contexto geral (ex: "Quero saber mais")
- publico_alvo: copie LITERAL para o campo who_for do output. Não reescreva, não resuma. Se vier vazio, monte who_for a partir do briefing geral.
- diferencial: use como BULLET DE DESTAQUE dentro de benefits (idealmente o primeiro, com peso de promessa única). Se vier vazio, ignore.
- bonus_garantia: use em urgency_text (ex: "Garantia de 7 dias + bônus inclusos") ou como benefit dedicado. Se vier vazio, ignore.

PARA CADA PRODUTO, preencha OBRIGATORIAMENTE os campos de copy estruturada:
- who_for: 1 frase descrevendo PRA QUEM É (perfil específico, momento, dor)
- how_it_works: 1-2 frases descrevendo COMO FUNCIONA (formato e dinâmica). NÃO mencione duração — isso fica nos campos session_duration / plan_duration controlados pelo dono.
- benefits: array de 3-5 bullets curtos e concretos (transformações/entregas, sem floreio)
- urgency_text: 1 frase de URGÊNCIA OU ESCASSEZ honesta (ex: "Próxima turma fecha sexta — 12 vagas", "Bônus de implementação até domingo", "Só 5 vagas por mês"). Se não fizer sentido, deixe vazio.
- cta_label: texto do BOTÃO PRINCIPAL adequado ao tipo de oferta. Use frases ativas em 1ª pessoa, ex: "Quero entrar na próxima turma", "Quero agendar minha consultoria", "Quero comprar agora", "Quero garantir minha vaga", "Quero começar agora".
- cta_secondary_label: texto do botão WhatsApp secundário, ex: "Falar com o time", "Tirar dúvida no WhatsApp", "Quero conversar antes".`;

const TOOLS_QUIZ = [
  {
    name: "create_quiz",
    description: "Cria o quiz de qualificação com perguntas a partir do briefing.",
    input_schema: {
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
      },
      required: ["welcome_text", "questions"],
    },
  },
];

const TOOLS_PRODUCTS = [
  {
    name: "create_products",
    description: "Cria os cards de produto com copy estruturada a partir do briefing.",
    input_schema: {
      type: "object",
      properties: {
        products: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              pain_tag: { type: "string", description: "Dores cobertas, separadas por vírgula. Ex: 'vendas' ou 'vendas,gestao'. Garanta cobertura de todas as 5 dores distribuídas entre os produtos." },
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
      required: ["products"],
    },
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeadersFor(req.headers.get("origin")) });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeadersFor(req.headers.get("origin")), "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeadersFor(req.headers.get("origin")), "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { tenant_id, briefing, funnel_id, keep_products, num_perguntas, cenario, objetivo } = body ?? {};
    // Autonomia (defaults = comportamento atual): valida quantidade e cenario.
    const numPerguntas = [5, 8, 12].includes(Number(num_perguntas)) ? Number(num_perguntas) : 12;
    const cenarioVal = ["educar", "equilibrado", "conversao"].includes(cenario) ? cenario : "equilibrado";
    if (!tenant_id || !briefing) {
      return new Response(JSON.stringify({ error: "missing_params" }), {
        status: 400,
        headers: { ...corsHeadersFor(req.headers.get("origin")), "Content-Type": "application/json" },
      });
    }

    const products = Array.isArray(briefing?.products) ? briefing.products : [];
    const validProducts = products.filter((p: any) => p?.name && p?.description);
    if (!keep_products && validProducts.length === 0) {
      return new Response(JSON.stringify({ error: "missing_products" }), {
        status: 400,
        headers: { ...corsHeadersFor(req.headers.get("origin")), "Content-Type": "application/json" },
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
        headers: { ...corsHeadersFor(req.headers.get("origin")), "Content-Type": "application/json" },
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
        headers: { ...corsHeadersFor(req.headers.get("origin")), "Content-Type": "application/json" },
      });
    }

    const { data: addonRpc } = await admin.rpc("has_addon", {
      _tenant_id: tenant_id,
      _addon_slug: "deep_diagnostic",
    });
    if (!addonRpc) {
      return new Response(JSON.stringify({ error: "addon_required" }), {
        status: 402,
        headers: { ...corsHeadersFor(req.headers.get("origin")), "Content-Type": "application/json" },
      });
    }

    // Crédito: gerar funil custa 6 do dono. (Contas internas têm cota gigante.)
    const saldoGeracao = await peekCredits(admin, tenant_id);
    if (saldoGeracao < 6) {
      return new Response(JSON.stringify({ error: "no_credits", needed: 6, balance: saldoGeracao }), {
        status: 402,
        headers: { ...corsHeadersFor(req.headers.get("origin")), "Content-Type": "application/json" },
      });
    }

    // Chama Claude em paralelo: quiz e produtos simultaneamente (~55s vs ~100s serial)
    const briefingMsg = `Briefing do dono:\n\n${JSON.stringify(briefing, null, 2)}`;
    // Diretriz de tom conforme o cenário escolhido pelo dono.
    const cenarioDir = ({
      educar: "TOM: acolhedor e didático. As perguntas educam; o result_intro encoraja e mostra o caminho.",
      equilibrado: "TOM: honesto, direto e equilibrado.",
      conversao: "TOM: afiado. As perguntas expõem os gaps REAIS do lead; o result_intro cria urgência honesta e empurra pro próximo passo. Nunca invente gaps — só os reais.",
    } as Record<string, string>)[cenarioVal];
    const quizUserMsg = `${briefingMsg}\n\nGere APENAS o quiz (welcome_text, result_intro e ${numPerguntas} perguntas). ${cenarioDir}`;
    const anthropicHeaders = {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    };

    let quizResp: Response;
    let productsResp: Response | null = null;
    if (keep_products) {
      quizResp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: anthropicHeaders,
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 6000,
          system: SYSTEM_PROMPT_QUIZ,
          messages: [{ role: "user", content: quizUserMsg }],
          tools: TOOLS_QUIZ,
          tool_choice: { type: "tool", name: "create_quiz" },
        }),
      });
    } else {
      [quizResp, productsResp] = await Promise.all([
        fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: anthropicHeaders,
          body: JSON.stringify({
            model: "claude-sonnet-4-5",
            max_tokens: 6000,
            system: SYSTEM_PROMPT_QUIZ,
            messages: [{ role: "user", content: quizUserMsg }],
            tools: TOOLS_QUIZ,
            tool_choice: { type: "tool", name: "create_quiz" },
          }),
        }),
        fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: anthropicHeaders,
          body: JSON.stringify({
            model: "claude-sonnet-4-5",
            max_tokens: 4000,
            system: SYSTEM_PROMPT_PRODUCTS,
            messages: [{ role: "user", content: briefingMsg + "\n\nGere APENAS os cards de produto." }],
            tools: TOOLS_PRODUCTS,
            tool_choice: { type: "tool", name: "create_products" },
          }),
        }),
      ]);
    }

    if (!quizResp.ok) {
      const txt = await quizResp.text();
      console.error("AI quiz error:", quizResp.status, txt);
      const errCode = quizResp.status === 429 ? "rate_limited" : quizResp.status === 402 ? "ai_credits" : "ai_error";
      return new Response(JSON.stringify({ error: errCode }), {
        status: quizResp.status,
        headers: { ...corsHeadersFor(req.headers.get("origin")), "Content-Type": "application/json" },
      });
    }
    if (productsResp && !productsResp.ok) {
      const txt = await productsResp.text();
      console.error("AI products error:", productsResp.status, txt);
      const errCode = productsResp.status === 429 ? "rate_limited" : productsResp.status === 402 ? "ai_credits" : "ai_error";
      return new Response(JSON.stringify({ error: errCode }), {
        status: productsResp.status,
        headers: { ...corsHeadersFor(req.headers.get("origin")), "Content-Type": "application/json" },
      });
    }

    const quizJson = await quizResp.json();
    const productsJson = productsResp ? await productsResp.json() : null;

    const quizBlock = Array.isArray(quizJson?.content)
      ? quizJson.content.find((b: any) => b?.type === "tool_use")
      : null;
    const productsBlock = productsJson
      ? (Array.isArray(productsJson?.content)
          ? productsJson.content.find((b: any) => b?.type === "tool_use")
          : null)
      : null;

    if (!quizBlock) {
      return new Response(JSON.stringify({ error: "no_tool_call_quiz", raw: quizJson }), {
        status: 500,
        headers: { ...corsHeadersFor(req.headers.get("origin")), "Content-Type": "application/json" },
      });
    }
    if (!keep_products && !productsBlock) {
      return new Response(JSON.stringify({ error: "no_tool_call_products", raw: productsJson }), {
        status: 500,
        headers: { ...corsHeadersFor(req.headers.get("origin")), "Content-Type": "application/json" },
      });
    }

    // IA gerou o funil com sucesso → debita 6 créditos do dono.
    void consumeCredits(admin, tenant_id, 6, "funnel_generation", funnel_id ?? null);

    const quizArgs = quizBlock.input;
    const rawProducts: any[] = Array.isArray(productsBlock?.input?.products)
      ? productsBlock.input.products
      : [];

    // Dedup defensivo por nome (evita duplicação quando Claude repete produto para preencher 5 slots)
    const seenNames = new Set<string>();
    const dedupedProducts = rawProducts.filter((p: any) => {
      const key = String(p.name ?? "").trim().toLowerCase();
      if (!key || seenNames.has(key)) return false;
      seenNames.add(key);
      return true;
    });

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
          objetivo: objetivo ?? null,
          num_perguntas: numPerguntas,
          cenario: cenarioVal,
          welcome_text: quizArgs.welcome_text,
          result_intro: quizArgs.result_intro ?? null,
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
          objetivo: objetivo ?? null,
          num_perguntas: numPerguntas,
          cenario: cenarioVal,
          welcome_text: quizArgs.welcome_text,
          result_intro: quizArgs.result_intro ?? null,
        })
        .eq("id", funnel_id)
        .eq("tenant_id", tenant_id);
      await admin.from("deep_funnel_questions").delete().eq("funnel_id", funnel_id);
      if (!keep_products) {
        await admin.from("deep_funnel_products").delete().eq("funnel_id", funnel_id);
      }
    }

    const questionsRows = quizArgs.questions.map((q: any, i: number) => ({
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
    // Metadados do destino (tipo/capa/principal) vindos do briefing, por nome.
    const metaByName = new Map<string, { tipo?: string; imagem_url?: string; is_principal?: boolean }>();
    for (const bp of briefingProducts as Array<Record<string, unknown>>) {
      const nm = typeof bp?.name === "string" ? bp.name : "";
      if (nm) metaByName.set(nm.trim().toLowerCase(), { tipo: bp?.tipo as string, imagem_url: bp?.imagem_url as string, is_principal: bp?.is_principal as boolean });
    }
    const validPains = new Set(["marketing", "gestao", "vendas", "ia", "estrutura"]);
    const productsRows = dedupedProducts.map((p: any, i: number) => {
      const checkout = p.checkout_url || linkByName.get(String(p.name ?? "").trim().toLowerCase()) || null;
      const meta = metaByName.get(String(p.name ?? "").trim().toLowerCase());
      // Aceita comma-separated: filtra só as dores válidas, fallback "vendas"
      const rawTags = String(p.pain_tag ?? "").split(",").map((t: string) => t.trim()).filter((t: string) => validPains.has(t));
      const painTag = rawTags.length > 0 ? rawTags.join(",") : "vendas";
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
        tipo: meta?.tipo || "produto",
        imagem_url: meta?.imagem_url ?? null,
        is_principal: !!meta?.is_principal,
      };
    });

    await admin.from("deep_funnel_questions").insert(questionsRows);
    if (!keep_products) {
      await admin.from("deep_funnel_products").insert(productsRows);
    }

    return new Response(
      JSON.stringify({ funnel_id: finalFunnelId, slug, questions_count: questionsRows.length }),
      { headers: { ...corsHeadersFor(req.headers.get("origin")), "Content-Type": "application/json" } },
    );
  } catch (e) {
    await captureException(e, { function: 'generate-deep-funnel' });
    console.error("generate-deep-funnel error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500,
      headers: { ...corsHeadersFor(req.headers.get("origin")), "Content-Type": "application/json" },
    });
  }
});
