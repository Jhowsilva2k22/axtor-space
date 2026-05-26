-- FK opcional: funil aponta para qual número de WhatsApp usar no CTA
-- NULL = usa o número padrão do tenant (ou o legado em tenants.whatsapp_number)
ALTER TABLE public.deep_funnels
ADD COLUMN whatsapp_number_id uuid REFERENCES public.tenant_whatsapp_numbers(id) ON DELETE SET NULL;
