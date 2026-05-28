-- Adiciona temas Copa Brasil + corrige radius do gold-noir
-- azul-copa: tema com tons de azul royal (bandeira) + dourado como acento
-- verde-canarinho: tema com fundo verde floresta + amarelo canário como acento
-- gold-noir: corrige radius de 0.125rem → 1.5rem (alinha com fallback do código)

UPDATE public.bio_themes
SET tokens = jsonb_set(tokens, '{radius}', '"1.5rem"')
WHERE slug = 'gold-noir';

INSERT INTO public.bio_themes (slug, name, is_default, is_active, tokens)
VALUES
  (
    'azul-copa',
    'Azul Copa',
    false,
    true,
    jsonb_build_object(
      'brandH',     210,
      'brandS',     '82%',
      'brandL',     '58%',
      'brandLGlow', '72%',
      'surfaceH',   218,
      'surfaceS',   '20%',
      'surfaceLBg',     '5%',
      'surfaceLCard',   '9%',
      'surfaceLBorder', '15%',
      'fontDisplay', 'Plus Jakarta Sans, sans-serif',
      'fontBody',    'Inter, sans-serif',
      'auroraEnabled',  true,
      'auroraOpacity',  0.45,
      'radius',     '1.5rem'
    )
  ),
  (
    'verde-canarinho',
    'Verde Canarinho',
    false,
    true,
    jsonb_build_object(
      'brandH',     54,
      'brandS',     '88%',
      'brandL',     '52%',
      'brandLGlow', '66%',
      'surfaceH',   140,
      'surfaceS',   '16%',
      'surfaceLBg',     '5%',
      'surfaceLCard',   '8%',
      'surfaceLBorder', '14%',
      'fontDisplay', 'Plus Jakarta Sans, sans-serif',
      'fontBody',    'Inter, sans-serif',
      'auroraEnabled',  true,
      'auroraOpacity',  0.45,
      'radius',     '1.5rem'
    )
  )
ON CONFLICT (slug) DO NOTHING;
