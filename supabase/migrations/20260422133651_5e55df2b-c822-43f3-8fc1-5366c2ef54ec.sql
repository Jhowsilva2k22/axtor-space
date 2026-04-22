
ALTER TABLE public.bio_blocks 
  ADD COLUMN IF NOT EXISTS icon_url text,
  ADD COLUMN IF NOT EXISTS icon_generations_count integer NOT NULL DEFAULT 0;

INSERT INTO storage.buckets (id, name, public)
VALUES ('block-icons', 'block-icons', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read block icons" ON storage.objects;
CREATE POLICY "Public read block icons" ON storage.objects
  FOR SELECT USING (bucket_id = 'block-icons');

DROP POLICY IF EXISTS "Admins manage block icons" ON storage.objects;
CREATE POLICY "Admins manage block icons" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'block-icons' AND public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (bucket_id = 'block-icons' AND public.has_role(auth.uid(), 'admin'::public.app_role));
