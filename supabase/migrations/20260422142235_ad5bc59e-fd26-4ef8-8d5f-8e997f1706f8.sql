CREATE TABLE public.bio_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon text,
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_bio_categories_position ON public.bio_categories (position);

ALTER TABLE public.bio_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage categories"
  ON public.bio_categories
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can read active categories"
  ON public.bio_categories
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_bio_categories_updated_at
  BEFORE UPDATE ON public.bio_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.bio_blocks
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.bio_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bio_blocks_category ON public.bio_blocks (category_id);