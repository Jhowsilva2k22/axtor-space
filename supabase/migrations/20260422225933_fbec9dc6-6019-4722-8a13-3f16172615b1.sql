ALTER TABLE public.bio_config ADD COLUMN IF NOT EXISTS cover_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('bio-covers', 'bio-covers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public can read bio covers" ON storage.objects;
CREATE POLICY "Public can read bio covers" ON storage.objects FOR SELECT USING (bucket_id = 'bio-covers');

DROP POLICY IF EXISTS "Authenticated can upload bio covers" ON storage.objects;
CREATE POLICY "Authenticated can upload bio covers" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'bio-covers');

DROP POLICY IF EXISTS "Authenticated can update bio covers" ON storage.objects;
CREATE POLICY "Authenticated can update bio covers" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'bio-covers');

DROP POLICY IF EXISTS "Authenticated can delete bio covers" ON storage.objects;
CREATE POLICY "Authenticated can delete bio covers" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'bio-covers');