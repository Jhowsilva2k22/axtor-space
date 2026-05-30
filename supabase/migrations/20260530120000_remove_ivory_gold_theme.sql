-- Remove o tema "Ivory Gold" da plataforma.
-- Nenhum tenant estava usando este tema no momento da remoção.
-- Tenants que porventura o tivessem teriam sido migrados para gold-noir.
UPDATE public.bio_config
SET active_theme_slug = 'gold-noir'
WHERE active_theme_slug = 'ivory-gold';

DELETE FROM public.bio_themes WHERE slug = 'ivory-gold';
