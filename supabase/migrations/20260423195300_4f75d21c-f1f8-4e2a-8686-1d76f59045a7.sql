
-- Permite tenant_owners fazerem upload/update/delete dos próprios avatares
CREATE POLICY "Tenant owners upload avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = 'bio');

CREATE POLICY "Tenant owners update avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = 'bio')
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = 'bio');

CREATE POLICY "Tenant owners delete avatars"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = 'bio' AND owner = auth.uid());
