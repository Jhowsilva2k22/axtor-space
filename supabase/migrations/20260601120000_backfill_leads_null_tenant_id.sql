-- Atribui leads com tenant_id NULL ao tenant principal.
-- Esses leads vieram de tráfego direto (sem UTM) antes do fallback no edge function ser corrigido.
UPDATE leads
SET tenant_id = '47b30b21-ccda-4b02-8086-bb40fd1baf9f'
WHERE tenant_id IS NULL;
