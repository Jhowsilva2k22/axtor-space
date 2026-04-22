ALTER TABLE public.bio_blocks
  ADD COLUMN IF NOT EXISTS draft_data jsonb,
  ADD COLUMN IF NOT EXISTS has_draft boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_bio_blocks_has_draft ON public.bio_blocks(has_draft) WHERE has_draft = true;