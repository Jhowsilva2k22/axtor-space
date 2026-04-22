import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_PER_BLOCK = 5;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurado");

    // Cliente para validar usuário
    const supaUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supaUser.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cliente admin
    const supaAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Verifica role admin
    const { data: roleRow } = await supaAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Apenas admins podem gerar ícones" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const blockId: string | undefined = body.block_id;
    const description: string = (body.description ?? "").toString().trim();
    if (!blockId || !description) {
      return new Response(JSON.stringify({ error: "block_id e description obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (description.length > 300) {
      return new Response(JSON.stringify({ error: "Descrição muito longa (máx 300)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Checa limite
    const { data: block, error: blockErr } = await supaAdmin
      .from("bio_blocks")
      .select("id, icon_generations_count")
      .eq("id", blockId)
      .maybeSingle();
    if (blockErr || !block) {
      return new Response(JSON.stringify({ error: "Bloco não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const used = block.icon_generations_count ?? 0;
    if (used >= MAX_PER_BLOCK) {
      return new Response(
        JSON.stringify({ error: `Limite de ${MAX_PER_BLOCK} gerações por bloco atingido`, used, max: MAX_PER_BLOCK }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Prompt fixo: ícone linear dourado, fundo transparente, estilo Lucide
    const prompt = `A minimalist line icon representing: ${description}. Style: thin elegant golden line strokes (color #D4AF37), 2px stroke weight, no fill, completely transparent background, centered composition with generous padding, simple geometric shapes, similar to Lucide icons, single icon only, no text, no labels, no shadows, no gradients, square format.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de uso da IA atingido. Tente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione em Settings > Workspace > Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "Falha ao gerar ícone" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    const dataUrl: string | undefined = aiData?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!dataUrl || !dataUrl.startsWith("data:image/")) {
      console.error("AI sem imagem", JSON.stringify(aiData).slice(0, 500));
      return new Response(JSON.stringify({ error: "IA não retornou imagem" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decodifica base64
    const [meta, b64] = dataUrl.split(",");
    const mime = meta.match(/data:(image\/[a-zA-Z+]+);/)?.[1] ?? "image/png";
    const ext = mime.split("/")[1].replace("+xml", "").replace("jpeg", "jpg");
    const binary = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

    const path = `${blockId}/${Date.now()}.${ext}`;
    const { error: upErr } = await supaAdmin.storage.from("block-icons").upload(path, binary, {
      contentType: mime,
      upsert: false,
    });
    if (upErr) {
      console.error("Upload err", upErr);
      return new Response(JSON.stringify({ error: "Falha ao salvar imagem" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: pub } = supaAdmin.storage.from("block-icons").getPublicUrl(path);
    const publicUrl = pub.publicUrl;

    // Atualiza bloco: incrementa contador + salva URL
    const { error: updErr } = await supaAdmin
      .from("bio_blocks")
      .update({
        icon_url: publicUrl,
        icon_generations_count: used + 1,
      })
      .eq("id", blockId);
    if (updErr) {
      console.error("Update err", updErr);
      return new Response(JSON.stringify({ error: "Falha ao atualizar bloco" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ icon_url: publicUrl, used: used + 1, max: MAX_PER_BLOCK }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("generate-icon error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});