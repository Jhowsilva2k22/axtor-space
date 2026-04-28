import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

/**
 * Onda 4 Fase 6 — Webhook do Asaas que confirma pagamentos.
 * Asaas chama este endpoint quando o status de uma cobrança muda.
 *
 * Eventos relevantes:
 *  - PAYMENT_RECEIVED — pagamento confirmado (Pix recebido, cartão capturado)
 *  - PAYMENT_CONFIRMED — confirmação adicional
 *  - PAYMENT_OVERDUE — vencido
 *  - PAYMENT_REFUNDED — estornado
 *
 * Segurança:
 *  - Valida o token Authorization configurado no painel do Asaas (ASAAS_WEBHOOK_TOKEN)
 *  - Edge Function usa service_role pra atualizar tenant_subscriptions / tenant_addons
 *  - service_role NUNCA é exposto pro frontend
 */

const okResponse = () => new Response("OK", { status: 200 });

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Método não permitido", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const expectedToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN") ?? "";

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[asaas-webhook] secrets ausentes");
    return new Response("Servidor mal configurado", { status: 500 });
  }

  // 1. Valida token do header (Asaas envia o que você configurou no painel deles)
  if (expectedToken) {
    const got = req.headers.get("asaas-access-token") ?? req.headers.get("Authorization") ?? "";
    if (got !== expectedToken) {
      console.warn("[asaas-webhook] token inválido");
      return new Response("Token inválido", { status: 401 });
    }
  } else {
    console.warn("[asaas-webhook] ASAAS_WEBHOOK_TOKEN não configurado — pulando validação");
  }

  // 2. Lê payload
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response("JSON inválido", { status: 400 });
  }

  const event: string = body?.event ?? "";
  const payment = body?.payment ?? {};
  const paymentId: string | undefined = payment?.id;
  const status: string | undefined = payment?.status;
  const externalReference: string | undefined = payment?.externalReference;

  console.log("[asaas-webhook] event=%s payment=%s status=%s ref=%s", event, paymentId, status, externalReference);

  if (!paymentId || !externalReference) {
    return okResponse(); // ignora eventos sem ref
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 3. Roteia por evento
  if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") {
    // Marca subscription como ativa
    const { data: subRow } = await supabase
      .from("tenant_subscriptions")
      .select("id, tenant_id, plan_slug")
      .eq("gateway_subscription_id", paymentId)
      .maybeSingle();

    if (subRow) {
      const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await supabase
        .from("tenant_subscriptions")
        .update({
          status: "active",
          current_period_end: periodEnd,
        })
        .eq("id", subRow.id);

      // Atualiza tenants.plan
      if (subRow.plan_slug && subRow.tenant_id) {
        await supabase
          .from("tenants")
          .update({ plan: subRow.plan_slug })
          .eq("id", subRow.tenant_id);
      }

      console.log("[asaas-webhook] sub %s ativada", subRow.id);
    } else {
      // Pode ser pagamento de addon avulso (não criou subscription) — TODO mapear
      console.log("[asaas-webhook] payment recebido sem subscription — possível addon avulso", paymentId);
    }
  } else if (event === "PAYMENT_OVERDUE") {
    await supabase
      .from("tenant_subscriptions")
      .update({ status: "past_due" })
      .eq("gateway_subscription_id", paymentId);
  } else if (event === "PAYMENT_REFUNDED" || event === "PAYMENT_DELETED") {
    await supabase
      .from("tenant_subscriptions")
      .update({ status: "canceled" })
      .eq("gateway_subscription_id", paymentId);
  }

  return okResponse();
});
