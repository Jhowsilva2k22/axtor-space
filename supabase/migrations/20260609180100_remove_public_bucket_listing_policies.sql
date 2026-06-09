-- M1: remove listagem ampla nos buckets públicos. Acesso por URL direta (getPublicUrl) continua funcionando.
DROP POLICY IF EXISTS "Public can read bio covers" ON storage.objects;
DROP POLICY IF EXISTS "Public read deep diagnostic media" ON storage.objects;
DROP POLICY IF EXISTS "Public read email-assets" ON storage.objects;
