-- Remove o DEFAULT hardcoded (UUID do tenant joanderson) da coluna tenant_id
-- e torna a coluna nullable. Leads sem UTM identificável passam a gravar NULL
-- em vez de serem atribuídos silenciosamente ao tenant principal.
ALTER TABLE leads
  ALTER COLUMN tenant_id DROP DEFAULT,
  ALTER COLUMN tenant_id DROP NOT NULL;
