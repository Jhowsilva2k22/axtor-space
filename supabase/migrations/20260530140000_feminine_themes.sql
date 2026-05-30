-- Adiciona trio de temas femininos: Rosa Velvet, Lavanda e Marfim.
-- Todos dark, com tipografia elegante e estética clean/minimalista.

INSERT INTO public.bio_themes (slug, name, is_default, is_active, tokens) VALUES

(
  'rosa-velvet',
  'Rosa Velvet',
  false,
  true,
  '{
    "brandH": 340,
    "brandS": "60%",
    "brandL": "65%",
    "brandLGlow": "78%",
    "surfaceH": 340,
    "surfaceS": "8%",
    "surfaceLBg": "5%",
    "surfaceLCard": "9%",
    "surfaceLBorder": "16%",
    "fontDisplay": "Italiana, serif",
    "fontBody": "Raleway, sans-serif",
    "auroraEnabled": true,
    "auroraOpacity": 0.30,
    "radius": "1.5rem"
  }'::jsonb
),

(
  'lavanda',
  'Lavanda',
  false,
  true,
  '{
    "brandH": 272,
    "brandS": "55%",
    "brandL": "70%",
    "brandLGlow": "82%",
    "surfaceH": 272,
    "surfaceS": "12%",
    "surfaceLBg": "5%",
    "surfaceLCard": "8%",
    "surfaceLBorder": "14%",
    "fontDisplay": "Bodoni Moda, serif",
    "fontBody": "Mulish, sans-serif",
    "auroraEnabled": true,
    "auroraOpacity": 0.28,
    "radius": "2rem"
  }'::jsonb
),

(
  'marfim',
  'Marfim',
  false,
  true,
  '{
    "brandH": 220,
    "brandS": "15%",
    "brandL": "60%",
    "brandLGlow": "72%",
    "surfaceH": 220,
    "surfaceS": "7%",
    "surfaceLBg": "5%",
    "surfaceLCard": "8%",
    "surfaceLBorder": "13%",
    "fontDisplay": "Josefin Sans, sans-serif",
    "fontBody": "Jost, sans-serif",
    "auroraEnabled": false,
    "auroraOpacity": 0.0,
    "radius": "0.5rem"
  }'::jsonb
);
