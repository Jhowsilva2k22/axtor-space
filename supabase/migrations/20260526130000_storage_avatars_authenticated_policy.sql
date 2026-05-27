-- Adiciona políticas de upload para usuários autenticados no bucket avatars.
-- Antes apenas admins podiam fazer INSERT — isso bloqueava tenant owners de subir
-- fotos de perfil, capas, imagens do diagnóstico imersivo, etc.
-- Consistente com bio-covers que já usa authenticated sem restrição de path.

CREATE POLICY "Authenticated can upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Authenticated can update avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated can delete avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');
