-- Tabela de deduplicação de eventos de webhook.
-- Garante que o mesmo (payment_id, event) seja processado no máximo uma vez,
-- mesmo se o Asaas reenviar o evento por retry.
CREATE TABLE IF NOT EXISTS webhook_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id   TEXT        NOT NULL,
  event        TEXT        NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_webhook_event UNIQUE (payment_id, event)
);

-- Acessada apenas via service_role pela edge function — sem políticas para anon.
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
