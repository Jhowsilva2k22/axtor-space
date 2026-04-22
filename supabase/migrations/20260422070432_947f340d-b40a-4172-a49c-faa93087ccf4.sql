
ALTER TABLE public.bio_blocks
ADD COLUMN IF NOT EXISTS use_brand_color boolean NOT NULL DEFAULT false;
