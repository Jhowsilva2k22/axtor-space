import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

/**
 * Onda 4 Fase 6 — Edge Function que cria cobrança Pix no Asaas.
 * Chamada pelo front (autenticada via JWT). Retorna QR Code Pix + paymentId.
 *
 * Fluxo:
 *  1. Valida JWT do user (deve ser owner do tenant ou admin).
 *  2. Lê plan/addon do payload.
 *  3. Cria customer no Asaas (ou reusa pelo CPF/email).
 *  4. Cria cobrança Pix.
 *  5. Insere row em tenant_subscriptions com status='pending'.
 *  6. Devolve QR Code + URL de fatura pro front.
 *
 * Webhook (asaas-webhook function) confirma pagamento depois.
 */

const ALLOWED_ORIGINS = [
  "https://axtor.space",
  "https://www.axtor.space",
  "http://localhost:8080",
  "http://localhost:8082",
  "http://localhost:8083",
];

const corsHeadersFor = (origin: string | null) => {
  const allowed = ALLOWED_ORIGINS.includes(origin ?? "") ? origin! : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
};

const jsonResponse = (status: number, body: unknown, origin: string | null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersFor(origin), "Content-Type": "application/json" },
  });

const ASAAS_API_URL = (Deno.env.get("ASAAS_API_KEY") ?? "").startsWith("$aact_hmlg_")
  ? "https://sandbox.asaas.com/api/v3"
  : "https://api.asaas.com/v3";

type CreatePaymentInput = {
  tenant_id: string;
  plan_slug?: string;
  addon_slug?: string;
  customer_name?: string;
  customer_email?: string;
  customer_cpf?: string;
};

// =============================================================================
// Validação de input simples (sem Zod pra evitar import — manualmente)
// =============================================================================

const validateInput = (body: unknown): { ok: true; data: CreatePaymentInput } | { ok: false; error: string } => {
  if (!body || typeof body !== "object") return { ok: false, error: "body inválido" };
  const obj = body as Record<string, unknown>;
  const tenant_id = typeof obj.tenant_id === "string" ? obj.tenant_id : null;
  if (!tenant_id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenant_id)) {
    return { ok: false, error: "tenant_id inválido" };
  }
  const plan_slug = typeof obj.plan_slug === "string" ? obj.plan_slug : undefined;
  const addon_slug = typeof obj.addon_slug === "string" ? obj.addon_slug : undefined;
  if (!plan_slug && !addon_slug) {
    return { ok: false, error: "Necessário plan_slug ou addon_slug" };
  }
  return {
    ok: true,
    data: {
      tenant_id,
      plan_slug,
      addon_slug,
      customer_name: typeof obj.customer_name === "string" ? obj.customer_name.slice(0, 200) : undefined,
      customer_email: typeof obj.customer_email === "string" ? obj.customer_email.slice(0, 200) : undefined,
      customer_cpf: typeof obj.customer_cpf === "string" ? obj.customer_cpf.replace(/\D/g, "").slice(0, 14) : undefined,
    },
  };
};

// =============================================================================
// Handler
// =============================================================================

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeadersFor(origin) });
  }
  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Método não permitido" }, origin);
  }

  // 1. Auth: JWT do user logado
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return jsonResponse(401, { error: "Não autenticado" }, origin);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const asaasKey = Deno.env.get("ASAAS_API_KEY");

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey || !asaasKey) {
    console.error("[asaas-create-payment] secrets ausentes");
    return jsonResponse(500, { error: "Servidor mal configurado" }, origin);
  }

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErr } = await supabaseAuth.auth.getUser();
  if (userErr || !userData.user) {
    return jsonResponse(401, { error: "Sessão inválida" }, origin);
  }

  const userId = userData.user.id;

  // 2. Valida input
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(400, { error: "JSON inválido" }, origin);
  }
  const v = validateInput(body);
  if (!v.ok) return jsonResponse(400, { error: v.error }, origin);
  const { tenant_id, plan_slug, addon_slug, customer_name, customer_email, customer_cpf } = v.data;

  // 3. Verifica que user é owner do tenant ou admin
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  const [{ data: tenantRow }, { data: roleRow }] = await Promise.all([
    supabaseAdmin
      .from("tenants")
      .select("id, owner_user_id, plan, slug, display_name")
      .eq("id", tenant_id)
      .maybeSingle(),
    supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle(),
  ]);

  const isAdmin = !!roleRow;
  const isOwner = tenantRow?.owner_user_id === userId;
  if (!tenantRow || !(isAdmin || isOwner)) {
    return jsonResponse(403, { error: "Sem permissão pra esse tenant" }, origin);
  }

  // 4. Determina valor da cobrança — separa plan e addon pra registrar em tabelas distintas depois
  let planValor = 0;
  let addonValor = 0;
  let descricao = "";

  if (plan_slug) {
    const { data: plan } = await supabaseAdmin
      .from("plan_features")
      .select("plan_slug, price_monthly")
      .eq("plan_slug", plan_slug)
      .maybeSingle();
    if (!plan?.price_monthly) {
      return jsonResponse(400, { error: "Plano sem preço definido" }, origin);
    }
    planValor = Number(plan.price_monthly);
    descricao = `Plano ${plan.plan_slug.toUpperCase()} - mensal - ${tenantRow.display_name}`;
  }

  if (addon_slug) {
    const { data: addon } = await supabaseAdmin
      .from("addons_catalog")
      .select("slug, name, price_brl")
      .eq("slug", addon_slug)
      .eq("is_active", true)
      .maybeSingle();
    if (!addon) return jsonResponse(400, { error: "Addon não encontrado" }, origin);
    addonValor = Number(addon.price_brl);
    descricao = descricao
      ? `${descricao} + Addon ${addon.name}`
      : `Addon ${addon.name} - ${tenantRow.display_name}`;
  }

  const valor = planValor + addonValor;
  if (valor <= 0) {
    return jsonResponse(400, { error: "Valor inválido" }, origin);
  }

  // 5. Cria customer no Asaas (idempotente — externalReference = userId)
  let customerId: string | null = null;
  try {
    const customerRes = await fetch(`${ASAAS_API_URL}/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: asaasKey,
      },
      body: JSON.stringify({
        name: customer_name ?? tenantRow.display_name ?? "Cliente",
        email: customer_email ?? userData.user.email ?? "",
        cpfCnpj: customer_cpf ?? "",
        externalReference: userId,
      }),
    });
    const customerData = await customerRes.json();
    if (!customerRes.ok) {
      console.warn("[asaas] customer falhou", customerData);
      return jsonResponse(502, { error: "Falha ao criar cliente Asaas", detalhe: customerData }, origin);
    }
    customerId = customerData.id;
  } catch (e) {
    console.error("[asaas] customer exception", e);
    return jsonResponse(502, { error: "Falha de comunicação com Asaas" }, origin);
  }

  // 6. Cria cobrança Pix — vencimento em 3 dias úteis pra suportar Pix agendado
  //    e dar folga pro cliente. Quando o cliente agenda no app do banco, o Asaas
  //    mantém pendente até a data, e o webhook dispara assim que compensar.
  const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const paymentRes = await fetch(`${ASAAS_API_URL}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", access_token: asaasKey },
    body: JSON.stringify({
      customer: customerId,
      billingType: "PIX",
      value: valor,
      dueDate,
      description: descricao.slice(0, 500),
      externalReference: tenant_id,
    }),
  });
  const paymentData = await paymentRes.json();
  if (!paymentRes.ok) {
    console.warn("[asaas] payment falhou", paymentData);
    return jsonResponse(502, { error: "Falha ao criar cobrança", detalhe: paymentData }, origin);
  }

  // 7. Pega QR Code do Pix
  const qrRes = await fetch(`${ASAAS_API_URL}/payments/${paymentData.id}/pixQrCode`, {
    headers: { access_token: asaasKey },
  });
  const qrData = await qrRes.json();

  // 8. Registra pending no banco — plano vai pra tenant_subscriptions, addon avulso pra tenant_addons.
  //    Caso compre os dois juntos (Pro + Addon), grava em ambas.
  if (plan_slug) {
    const { error: subErr } = await supabaseAdmin.from("tenant_subscriptions").insert({
      tenant_id,
      plan_slug,
      billing_cycle: "monthly",
      gateway: "asaas",
      gateway_subscription_id: paymentData.id,
      final_price_brl: planValor,
      status: "pending",
    });
    if (subErr) {
      console.error("[asaas-create-payment] insert subscription falhou", subErr);
    }
  }

  if (addon_slug) {
    const { error: addonErr } = await supabaseAdmin.from("tenant_addons").insert({
      tenant_id,
      addon_slug,
      gateway: "asaas",
      gateway_payment_id: paymentData.id,
      value_brl: addonValor,
      status: "pending",
    });
    if (addonErr) {
      console.error("[asaas-create-payment] insert addon falhou", addonErr);
    }
  }

  return jsonResponse(
    200,
    {
      paymentId: paymentData.id,
      invoiceUrl: paymentData.invoiceUrl,
      qrCode: qrData.encodedImage ?? null,
      qrCodeText: qrData.payload ?? null,
      expirationDate: qrData.expirationDate ?? null,
      valor,
      descricao,
    },
    origin,
  );
});
