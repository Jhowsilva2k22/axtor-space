
CREATE TABLE IF NOT EXISTS public.bio_icon_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id uuid REFERENCES public.bio_blocks(id) ON DELETE SET NULL,
  icon_url text NOT NULL,
  storage_path text NOT NULL,
  prompt text NOT NULL,
  style text NOT NULL DEFAULT 'linear_gold',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bio_icon_generations_block ON public.bio_icon_generations(block_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bio_icon_generations_created ON public.bio_icon_generations(created_at DESC);

ALTER TABLE public.bio_icon_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read icon generations"
  ON public.bio_icon_generations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins insert icon generations"
  ON public.bio_icon_generations FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins delete icon generations"
  ON public.bio_icon_generations FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
