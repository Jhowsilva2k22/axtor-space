-- Adiciona campos de conteúdo exclusivos da página de captura.
-- Antes, headline/sub_headline vinham de bio_config (compartilhados com Link na Bio),
-- e a tagline era hardcoded no frontend — sem possibilidade de edição pelo tenant.
-- Com essas colunas cada superfície tem seus próprios campos editáveis.

ALTER TABLE tenant_capture_config
  ADD COLUMN IF NOT EXISTS capture_headline     text,
  ADD COLUMN IF NOT EXISTS capture_sub_headline text,
  ADD COLUMN IF NOT EXISTS capture_tagline      text;
