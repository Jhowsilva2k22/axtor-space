ALTER TABLE public.bio_blocks
  ADD COLUMN IF NOT EXISTS size text NOT NULL DEFAULT 'md'
  CHECK (size IN ('sm', 'md', 'lg'));