-- Public bucket for bio avatar images
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "Public can view avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- Admin write/update/delete
CREATE POLICY "Admins can upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND public.has_role(auth.uid(), 'admin'));