-- Tabela de temas/templates
CREATE TABLE public.bio_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  tokens jsonb NOT NULL,
  preview_image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bio_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active themes"
  ON public.bio_themes FOR SELECT
  USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage themes"
  ON public.bio_themes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_bio_themes_updated_at
  BEFORE UPDATE ON public.bio_themes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Coluna em bio_config pra marcar tema ativo
ALTER TABLE public.bio_config
  ADD COLUMN active_theme_slug text NOT NULL DEFAULT 'gold-noir';

-- Seed do Gold Noir (padrão atual, intocado)
INSERT INTO public.bio_themes (slug, name, is_default, is_active, tokens)
VALUES (
  'gold-noir',
  'Gold Noir',
  true,
  true,
  jsonb_build_object(
    'brandH', 43,
    'brandS', '55%',
    'brandL', '54%',
    'brandLGlow', '68%',
    'surfaceH', 30,
    'surfaceS', '12%',
    'surfaceLBg', '5%',
    'surfaceLCard', '8%',
    'surfaceLBorder', '14%',
    'fontDisplay', 'Cormorant Garamond, serif',
    'fontBody', 'Manrope, sans-serif',
    'auroraEnabled', true,
    'auroraOpacity', 0.45,
    'radius', '0.125rem'
  )
);