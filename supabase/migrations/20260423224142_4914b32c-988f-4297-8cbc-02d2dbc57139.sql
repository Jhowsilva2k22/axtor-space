ALTER TABLE public.bio_categories DROP CONSTRAINT IF EXISTS bio_categories_slug_key;
CREATE UNIQUE INDEX IF NOT EXISTS bio_categories_tenant_slug_key ON public.bio_categories (tenant_id, slug);