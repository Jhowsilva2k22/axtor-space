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
 *  - Falha fechado (401) se ASAAS_WEBHOOK_TOKEN não estiver configurado
 *  - Idempotente: tabela webhook_events garante que (paymentId, event) é processado só uma vez
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

  // 1. Valida token — fail closed: se não configurado, rejeita
  if (!expectedToken) {
    console.error("[asaas-webhook] ASAAS_WEBHOOK_TOKEN não configurado — rejeitando");
    return new Response("Token inválido", { status: 401 });
  }
  const got = req.headers.get("asaas-access-token") ?? req.headers.get("Authorization") ?? "";
  if (got !== expectedToken) {
    console.warn("[asaas-webhook] token inválido");
    return new Response("Token inválido", { status: 401 });
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

  // 3. Idempotência — garante que (paymentId, event) seja processado só uma vez
  const { error: dedupeErr } = await supabase
    .from("webhook_events")
    .insert({ payment_id: paymentId, event });

  if (dedupeErr) {
    if (dedupeErr.code === "23505") {
      // unique_violation — evento já foi processado antes
      console.log("[asaas-webhook] evento duplicado ignorado: %s/%s", event, paymentId);
      return okResponse();
    }
    // Outro erro — loga mas continua para não perder o evento
    console.error("[asaas-webhook] webhook_events insert erro:", dedupeErr);
  }

  // 4. Roteia por evento — atualiza tenant_subscriptions (planos) e tenant_addons (compras avulsas).
  //    O mesmo paymentId pode estar em ambas se foi compra Pro+Addon junto.
  if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") {
    // 4a. Subscription (plano recorrente)
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

      if (subRow.plan_slug && subRow.tenant_id) {
        await supabase
          .from("tenants")
          .update({ plan: subRow.plan_slug })
          .eq("id", subRow.tenant_id);
        // concede a cota de créditos do novo plano na hora (não espera o cron)
        const { error: grantErr } = await supabase.rpc("grant_plan_credits", {
          p_tenant: subRow.tenant_id,
        });
        if (grantErr) console.error("[asaas-webhook] grant_plan_credits falhou", grantErr);
      }
      console.log("[asaas-webhook] sub %s ativada", subRow.id);
    }

    // 4b. Addons avulsos (a mesma cobrança pode trazer um ou mais)
    const { data: addonRows, error: addonErr } = await supabase
      .from("tenant_addons")
      .update({ status: "paid" })
      .eq("gateway_payment_id", paymentId)
      .select("id, addon_slug, tenant_id");

    if (addonErr) {
      console.error("[asaas-webhook] update addons falhou", addonErr);
    } else if (addonRows && addonRows.length > 0) {
      console.log("[asaas-webhook] %d addon(s) marcado(s) como pagos", addonRows.length);
      // créditos avulsos: se o pacote concede créditos, credita o saldo topup
      for (const a of addonRows) {
        const { data: cat } = await supabase
          .from("addons_catalog")
          .select("grants_credits")
          .eq("slug", a.addon_slug)
          .maybeSingle();
        const grants = (cat as { grants_credits?: number } | null)?.grants_credits ?? 0;
        if (grants > 0 && a.tenant_id) {
          const { error: topupErr } = await supabase.rpc("add_topup_credits", {
            p_tenant: a.tenant_id,
            p_amount: grants,
            p_ref: paymentId,
          });
          if (topupErr) console.error("[asaas-webhook] add_topup_credits falhou", topupErr);
        }
      }
    } else if (!subRow) {
      // Nem sub nem addon — pagamento órfão
      console.warn("[asaas-webhook] payment %s sem subscription nem addon", paymentId);
    }

    // 4c. GUEST CHECKOUT — pagamento confirmado sem tenant: provisiona conta.
    const { data: guest } = await supabase
      .from("guest_checkouts")
      .select("id, email, display_name, slug, plan_slug")
      .eq("asaas_payment_id", paymentId)
      // provisiona qualquer checkout ainda não concluído. 'expired' entra aqui de
      // propósito: se o pagamento cair logo após o contador zerar, a conta tem que
      // ser criada do mesmo jeito (rede de segurança contra a corrida do timer).
      .in("status", ["pending", "expired"])
      .maybeSingle();

    if (guest) {
      try {
        // a) cria o usuário (email confirmado — acessa via magic link)
        const { data: createdUser, error: cuErr } = await supabase.auth.admin.createUser({
          email: guest.email,
          email_confirm: true,
        });
        if (cuErr || !createdUser?.user) throw new Error(cuErr?.message ?? "createUser falhou");
        const newUserId = createdUser.user.id;

        // b) cria o tenant com o plano pago (RPC admin que aceita user_id)
        const { data: tRes, error: tErr } = await supabase.rpc("create_tenant_for_user_admin", {
          _user_id: newUserId,
          _slug: guest.slug,
          _display_name: guest.display_name,
          _plan: guest.plan_slug,
        });
        if (tErr) throw new Error("create_tenant: " + tErr.message);
        const newTenantId = (tRes as { tenant_id?: string } | null)?.tenant_id;

        // c) assinatura ativa + concede créditos do plano
        const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        await supabase.from("tenant_subscriptions").insert({
          tenant_id: newTenantId,
          plan_slug: guest.plan_slug,
          billing_cycle: "monthly",
          gateway: "asaas",
          gateway_subscription_id: paymentId,
          final_price_brl: Number(payment?.value ?? 0),
          status: "active",
          current_period_end: periodEnd,
        });
        await supabase.rpc("grant_plan_credits", { p_tenant: newTenantId });

        // d) magic link de acesso (dispara o email padrão de magic link)
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
        if (anonKey) {
          const anon = createClient(supabaseUrl, anonKey);
          await anon.auth.signInWithOtp({
            email: guest.email,
            options: {
              shouldCreateUser: false,
              // guest cai na recepção (/bem-vindo) com o plano certo, igual ao
              // fluxo de quem compra logado. De lá ela segue pro /painel.
              emailRedirectTo: `https://axtor.space/bem-vindo?type=plan&slug=${guest.plan_slug}`,
            },
          });
        }

        // e) marca provisionado
        await supabase
          .from("guest_checkouts")
          .update({
            status: "provisioned",
            tenant_id: newTenantId,
            user_id: newUserId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", guest.id);

        console.log("[asaas-webhook] guest %s provisionado → tenant %s", guest.id, newTenantId);
      } catch (e) {
        console.error("[asaas-webhook] guest provision falhou", e);
        await supabase
          .from("guest_checkouts")
          .update({
            status: "failed",
            error: e instanceof Error ? e.message : "erro",
            updated_at: new Date().toISOString(),
          })
          .eq("id", guest.id);
      }
    }
  } else if (event === "PAYMENT_OVERDUE") {
    await supabase
      .from("tenant_subscriptions")
      .update({ status: "past_due" })
      .eq("gateway_subscription_id", paymentId);
    await supabase
      .from("tenant_addons")
      .update({ status: "pending" })
      .eq("gateway_payment_id", paymentId);
  } else if (event === "PAYMENT_REFUNDED" || event === "PAYMENT_DELETED") {
    await supabase
      .from("tenant_subscriptions")
      .update({ status: "canceled" })
      .eq("gateway_subscription_id", paymentId);
    await supabase
      .from("tenant_addons")
      .update({ status: "refunded" })
      .eq("gateway_payment_id", paymentId);
  }

  return okResponse();
});
