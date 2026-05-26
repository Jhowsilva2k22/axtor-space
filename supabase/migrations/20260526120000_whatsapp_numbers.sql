-- Tabela de números de WhatsApp por tenant
-- Permite que cada tenant cadastre e gerencie seus próprios números de contato
CREATE TABLE public.tenant_whatsapp_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Principal',
  phone text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tenant_whatsapp_numbers ENABLE ROW LEVEL SECURITY;

-- Leitura pública: número de WhatsApp é dado de contato exibido em funis públicos
CREATE POLICY "tenant_whatsapp_numbers_public_select"
ON public.tenant_whatsapp_numbers
FOR SELECT
USING (true);

-- Insert: somente dono do tenant
CREATE POLICY "tenant_whatsapp_numbers_owner_insert"
ON public.tenant_whatsapp_numbers
FOR INSERT
WITH CHECK (
  exists (
    select 1 from public.tenants t
    where t.id = tenant_id
      and t.owner_user_id = auth.uid()
  )
);

-- Update: somente dono do tenant
CREATE POLICY "tenant_whatsapp_numbers_owner_update"
ON public.tenant_whatsapp_numbers
FOR UPDATE
USING (
  exists (
    select 1 from public.tenants t
    where t.id = tenant_whatsapp_numbers.tenant_id
      and t.owner_user_id = auth.uid()
  )
);

-- Delete: somente dono do tenant
CREATE POLICY "tenant_whatsapp_numbers_owner_delete"
ON public.tenant_whatsapp_numbers
FOR DELETE
USING (
  exists (
    select 1 from public.tenants t
    where t.id = tenant_whatsapp_numbers.tenant_id
      and t.owner_user_id = auth.uid()
  )
);
