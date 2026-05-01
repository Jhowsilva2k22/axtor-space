import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { TEMPLATES } from '../_shared/transactional-email-templates/registry.ts'

// Onda 4 polimento — envio imediato (sem queue) com rate-limit anti-flood.
// Antes: enfileirava em pgmq, esperava process-email-queue desenfileirar (manual ou cron).
// Agora: envia direto via Resend em <2s, com trava de 60s pra mesmo recipient+template.
// Fallback: se Resend falhar, enfileira pra retry async.

const SITE_NAME = 'Axtor'
const DEFAULT_FROM_EMAIL = 'noreply@axtor.space'
const RATE_LIMIT_MS = 60_000 // 1 minuto

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function sendResendEmail(
  apiKey: string,
  payload: { to: string; from: string; subject: string; html: string; text: string }
): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: payload.from,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
  })
  if (!res.ok) {
    const txt = await res.text()
    const err: any = new Error(`Resend [${res.status}]: ${txt.slice(0, 300)}`)
    err.status = res.status
    throw err
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  const resendFromEmail = Deno.env.get('RESEND_FROM_EMAIL') || DEFAULT_FROM_EMAIL

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables')
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  let templateName: string
  let recipientEmail: string
  let idempotencyKey: string
  let messageId: string
  let templateData: Record<string, any> = {}
  try {
    const body = await req.json()
    templateName = body.templateName || body.template_name
    recipientEmail = body.recipientEmail || body.recipient_email
    messageId = crypto.randomUUID()
    idempotencyKey = body.idempotencyKey || body.idempotency_key || messageId
    if (body.templateData && typeof body.templateData === 'object') {
      templateData = body.templateData
    }
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON in request body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (!templateName) {
    return new Response(
      JSON.stringify({ error: 'templateName is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const template = TEMPLATES[templateName]
  if (!template) {
    return new Response(
      JSON.stringify({
        error: `Template '${templateName}' not found. Available: ${Object.keys(TEMPLATES).join(', ')}`,
      }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const effectiveRecipient = template.to || recipientEmail
  if (!effectiveRecipient) {
    return new Response(
      JSON.stringify({ error: 'recipientEmail is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // 1. Suppression check
  const { data: suppressed, error: suppressionError } = await supabase
    .from('suppressed_emails')
    .select('id')
    .eq('email', effectiveRecipient.toLowerCase())
    .maybeSingle()

  if (suppressionError) {
    return new Response(
      JSON.stringify({ error: 'Failed to verify suppression status' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (suppressed) {
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: 'suppressed',
    })
    return new Response(
      JSON.stringify({ success: false, reason: 'email_suppressed' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // 2. Rate limit anti-flood: verifica se mesmo recipient+template recebeu email <60s
  const cutoff = new Date(Date.now() - RATE_LIMIT_MS).toISOString()
  const { data: recent } = await supabase
    .from('email_send_log')
    .select('id, created_at')
    .eq('recipient_email', effectiveRecipient)
    .eq('template_name', templateName)
    .eq('status', 'sent')
    .gt('created_at', cutoff)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (recent) {
    const elapsedMs = Date.now() - new Date((recent as any).created_at).getTime()
    const remainingSec = Math.max(1, Math.ceil((RATE_LIMIT_MS - elapsedMs) / 1000))
    return new Response(
      JSON.stringify({
        success: false,
        reason: 'rate_limited',
        message: `Aguarde ${remainingSec}s antes de reenviar este tipo de email para esse destinatário.`,
        retry_after_seconds: remainingSec,
      }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // 3. Get/create unsubscribe token
  const normalizedEmail = effectiveRecipient.toLowerCase()
  let unsubscribeToken: string

  const { data: existingToken } = await supabase
    .from('email_unsubscribe_tokens')
    .select('token, used_at')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (existingToken && !(existingToken as any).used_at) {
    unsubscribeToken = (existingToken as any).token
  } else if (!existingToken) {
    unsubscribeToken = generateToken()
    await supabase
      .from('email_unsubscribe_tokens')
      .upsert(
        { token: unsubscribeToken, email: normalizedEmail },
        { onConflict: 'email', ignoreDuplicates: true }
      )
    const { data: storedToken } = await supabase
      .from('email_unsubscribe_tokens')
      .select('token')
      .eq('email', normalizedEmail)
      .maybeSingle()
    unsubscribeToken = (storedToken as any)?.token ?? unsubscribeToken
  } else {
    return new Response(
      JSON.stringify({ success: false, reason: 'email_suppressed' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // 4. Render template
  const html = await renderAsync(React.createElement(template.component, templateData))
  const plainText = await renderAsync(
    React.createElement(template.component, templateData),
    { plainText: true }
  )

  const resolvedSubject =
    typeof template.subject === 'function' ? template.subject(templateData) : template.subject

  const fromHeader = `${SITE_NAME} <${resendFromEmail}>`

  // 5. ENVIO DIRETO via Resend (sem fila). Fallback pra fila se falhar.
  if (resendApiKey) {
    try {
      await sendResendEmail(resendApiKey, {
        to: effectiveRecipient,
        from: fromHeader,
        subject: resolvedSubject,
        html,
        text: plainText,
      })

      await supabase.from('email_send_log').insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email: effectiveRecipient,
        status: 'sent',
      })

      return new Response(
        JSON.stringify({ success: true, sent: true, message_id: messageId }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn('Resend direct send failed, falling back to queue:', msg)
      // continua pro fallback de fila abaixo
    }
  }

  // 6. Fallback: enfileira pra processamento async (caso Resend caiu ou key não setada)
  await supabase.from('email_send_log').insert({
    message_id: messageId,
    template_name: templateName,
    recipient_email: effectiveRecipient,
    status: 'pending',
  })

  const { error: enqueueError } = await supabase.rpc('enqueue_email', {
    queue_name: 'transactional_emails',
    payload: {
      message_id: messageId,
      to: effectiveRecipient,
      from: fromHeader,
      subject: resolvedSubject,
      html,
      text: plainText,
      purpose: 'transactional',
      label: templateName,
      idempotency_key: idempotencyKey,
      unsubscribe_token: unsubscribeToken,
      queued_at: new Date().toISOString(),
    },
  })

  if (enqueueError) {
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: 'failed',
      error_message: 'Failed to enqueue email after Resend fallback',
    })
    return new Response(JSON.stringify({ error: 'Failed to send/enqueue email' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(
    JSON.stringify({ success: true, queued: true, message_id: messageId }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
