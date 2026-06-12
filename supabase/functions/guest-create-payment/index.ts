import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

/**
 * Guest checkout (Caminho Y) — cria cobrança Pix SEM login.
 * Pública: o visitante paga primeiro; a conta é criada pelo webhook após pagar.
 *
 * Fluxo:
 *  1. Valida input (email, nome, cpf, slug, plano).
 *  2. Guard de abuso: limita N checkouts pendentes por email/hora.
 *  3. Bloqueia se o email JÁ tem conta (manda logar).
 *  4. Checa se o @ (slug) está livre.
 *  5. Cria customer + cobrança Pix no Asaas (externalReference = id do guest_checkout).
 *  6. Grava guest_checkouts (status=pending) + asaas_payment_id.
 *  7. Devolve QR Code + o id do guest_checkout (pro front escutar a confirmação).
 *
 * Segurança: roda com service_role (server only). RLS de guest_checkouts trava
 * o acesso do cliente. CORS restrito. Sem auth — por isso o guard de abuso.
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
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-api-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
};

const json = (status: number, body: unknown, origin: string | null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersFor(origin), "Content-Type": "application/json" },
  });

const ASAAS_API_URL = (Deno.env.get("ASAAS_API_KEY") ?? "").startsWith("$aact_hmlg_")
  ? "https://sandbox.asaas.com/api/v3"
  : "https://api.asaas.com/v3";

// Cancela (deleta) uma cobrança Pix no Asaas — usado quando o contador do front
// zera ou quando o usuário gera um novo Pix. Best-effort: se a cobrança já foi
// paga, o Asaas recusa o delete e a gente ignora (o webhook provisiona normal).
const cancelAsaasPayment = async (paymentId: string, asaasKey: string) => {
  try {
    await fetch(`${ASAAS_API_URL}/payments/${paymentId}`, {
      method: "DELETE",
      headers: { access_token: asaasKey },
    });
  } catch (e) {
    console.warn("[guest] cancel cobrança falhou", e);
  }
};

// Status que indicam pagamento concluído no Asaas.
const PAID_STATUSES = ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"];

// Consulta o status atual da cobrança no Asaas. Usado pra NÃO expirar uma
// cobrança que já foi paga (evita conta no limbo na corrida do contador).
const isAsaasPaymentPaid = async (paymentId: string, asaasKey: string): Promise<boolean> => {
  try {
    const r = await fetch(`${ASAAS_API_URL}/payments/${paymentId}`, {
      headers: { access_token: asaasKey },
    });
    const d = await r.json();
    return typeof d?.status === "string" && PAID_STATUSES.includes(d.status);
  } catch (e) {
    console.warn("[guest] consulta status falhou", e);
    return false; // na dúvida, não bloqueia o fluxo de expirar
  }
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_RE = /^[a-z0-9]([a-z0-9-]{1,38})[a-z0-9]$/; // 3-40, minúsculas/números/hífen

type Input = {
  email: string;
  display_name: string;
  cpf: string;
  slug: string;
  plan_slug: "pro" | "premium";
};

const validate = (b: unknown): { ok: true; data: Input } | { ok: false; error: string } => {
  if (!b || typeof b !== "object") return { ok: false, error: "body inválido" };
  const o = b as Record<string, unknown>;
  const email = typeof o.email === "string" ? o.email.trim().toLowerCase() : "";
  const display_name = typeof o.display_name === "string" ? o.display_name.trim().slice(0, 80) : "";
  const cpf = typeof o.cpf === "string" ? o.cpf.replace(/\D/g, "").slice(0, 14) : "";
  const slug = typeof o.slug === "string" ? o.slug.trim().toLowerCase() : "";
  const plan_slug = o.plan_slug === "premium" ? "premium" : o.plan_slug === "pro" ? "pro" : "";

  if (!EMAIL_RE.test(email)) return { ok: false, error: "email inválido" };
  if (display_name.length < 2) return { ok: false, error: "nome muito curto" };
  if (cpf.length < 11) return { ok: false, error: "cpf inválido" };
  if (!SLUG_RE.test(slug)) return { ok: false, error: "@ inválido" };
  if (!plan_slug) return { ok: false, error: "plano inválido" };

  return { ok: true, data: { email, display_name, cpf, slug, plan_slug } };
};

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeadersFor(origin) });
  if (req.method !== "POST") return json(405, { error: "Método não permitido" }, origin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const asaasKey = Deno.env.get("ASAAS_API_KEY");
  if (!supabaseUrl || !serviceKey || !asaasKey) {
    console.error("[guest-create-payment] secrets ausentes");
    return json(500, { error: "Servidor mal configurado" }, origin);
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json(400, { error: "JSON inválido" }, origin);
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const rawObj = (raw ?? {}) as Record<string, unknown>;

  // Modo CANCELAR — disparado quando o contador zera no front. Apaga a cobrança
  // Pix no Asaas (mata o QR de verdade) e marca o checkout como expirado.
  if (rawObj.cancel_only === true) {
    const pid = typeof rawObj.payment_id === "string" ? rawObj.payment_id : "";
    if (!pid) return json(400, { error: "payment_id ausente" }, origin);
    // Se já foi pago, NÃO expira — devolve paid:true pro front e deixa o webhook
    // provisionar normalmente. Sem isso, uma conta paga ficava no limbo.
    if (await isAsaasPaymentPaid(pid, asaasKey)) {
      return json(200, { paid: true }, origin);
    }
    await cancelAsaasPayment(pid, asaasKey);
    await admin
      .from("guest_checkouts")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("asaas_payment_id", pid)
      .eq("status", "pending");
    return json(200, { ok: true }, origin);
  }

  const v = validate(raw);
  if (!v.ok) return json(400, { error: v.error }, origin);
  const { email, display_name, cpf, slug, plan_slug } = v.data;

  // Regenerar: se veio replace_payment_id, cancela a cobrança anterior antes de
  // criar a nova (não deixa dois Pix vivos pro mesmo checkout).
  const replaceId = typeof rawObj.replace_payment_id === "string" ? rawObj.replace_payment_id : "";
  if (replaceId && !(await isAsaasPaymentPaid(replaceId, asaasKey))) {
    await cancelAsaasPayment(replaceId, asaasKey);
    await admin
      .from("guest_checkouts")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("asaas_payment_id", replaceId)
      .eq("status", "pending");
  }

  // 2. Guard de abuso — máx 5 checkouts pendentes por email na última hora
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recent } = await admin
    .from("guest_checkouts")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .eq("status", "pending")
    .gte("created_at", since);
  if ((recent ?? 0) >= 5) {
    return json(429, { error: "muitas tentativas — tente mais tarde" }, origin);
  }

  // 3. Email já tem conta? Bloqueia (manda logar)
  const { data: hasAccount, error: haErr } = await admin.rpc("email_has_account", { _email: email });
  if (haErr) {
    console.error("[guest-create-payment] email_has_account erro", haErr);
    return json(500, { error: "Erro ao validar email" }, origin);
  }
  if (hasAccount === true) {
    return json(409, { error: "email_has_account" }, origin);
  }

  // 4. @ livre?
  const { data: slugCheck, error: slugErr } = await admin.rpc("check_slug_available", { _slug: slug });
  if (slugErr) {
    console.error("[guest-create-payment] check_slug erro", slugErr);
    return json(500, { error: "Erro ao validar @" }, origin);
  }
  if (!(slugCheck as { available?: boolean } | null)?.available) {
    return json(409, { error: "slug_taken" }, origin);
  }

  // 5. Preço do plano (do servidor — nunca do cliente)
  const { data: plan } = await admin
    .from("plan_features")
    .select("plan_slug, price_monthly")
    .eq("plan_slug", plan_slug)
    .maybeSingle();
  const valor = Number(plan?.price_monthly ?? 0);
  if (valor <= 0) return json(400, { error: "Plano sem preço" }, origin);

  // id do guest_checkout — usado como externalReference no Asaas
  const guestId = crypto.randomUUID();

  // 6. Customer + cobrança Pix no Asaas
  let customerId: string;
  try {
    const cr = await fetch(`${ASAAS_API_URL}/customers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", access_token: asaasKey },
      body: JSON.stringify({ name: display_name, email, cpfCnpj: cpf, externalReference: guestId }),
    });
    const cd = await cr.json();
    if (!cr.ok) {
      console.warn("[guest] customer falhou", cd);
      return json(502, { error: "Falha ao criar cliente Asaas" }, origin);
    }
    customerId = cd.id;
  } catch (e) {
    console.error("[guest] customer exception", e);
    return json(502, { error: "Falha de comunicação com Asaas" }, origin);
  }

  const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const pr = await fetch(`${ASAAS_API_URL}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", access_token: asaasKey },
    body: JSON.stringify({
      customer: customerId,
      billingType: "PIX",
      value: valor,
      dueDate,
      description: `Plano ${plan_slug.toUpperCase()} - mensal - ${display_name}`.slice(0, 500),
      externalReference: guestId,
    }),
  });
  const pd = await pr.json();
  if (!pr.ok) {
    console.warn("[guest] payment falhou", pd);
    return json(502, { error: "Falha ao criar cobrança" }, origin);
  }

  // 7. Grava o guest_checkout pendente (com o payment_id pra o webhook casar)
  const { error: insErr } = await admin.from("guest_checkouts").insert({
    id: guestId,
    email,
    display_name,
    cpf,
    slug,
    plan_slug,
    asaas_payment_id: pd.id,
    status: "pending",
  });
  if (insErr) {
    console.error("[guest] insert guest_checkouts falhou", insErr);
    return json(500, { error: "Erro ao registrar checkout" }, origin);
  }

  // 8. QR Code
  const qr = await fetch(`${ASAAS_API_URL}/payments/${pd.id}/pixQrCode`, {
    headers: { access_token: asaasKey },
  });
  const qd = await qr.json();

  return json(
    200,
    {
      guestCheckoutId: guestId,
      paymentId: pd.id,
      invoiceUrl: pd.invoiceUrl,
      qrCode: qd.encodedImage ?? null,
      qrCodeText: qd.payload ?? null,
      expirationDate: qd.expirationDate ?? null,
      valor,
    },
    origin,
  );
});
