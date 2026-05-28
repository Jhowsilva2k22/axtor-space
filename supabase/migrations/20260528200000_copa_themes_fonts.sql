-- Atualiza fontes dos temas Copa Brasil
-- Plus Jakarta Sans (display) + Inter (body) — mais legíveis e profissionais
-- Substitui Cormorant Garamond + Manrope que eram decorativos demais

UPDATE public.bio_themes
SET tokens = tokens
  || jsonb_build_object('fontDisplay', 'Plus Jakarta Sans, sans-serif')
  || jsonb_build_object('fontBody', 'Inter, sans-serif')
WHERE slug IN ('azul-copa', 'verde-canarinho');
