-- Remove tabelas órfãs do atende-zap (CRM) que não fazem parte do Axtor.
-- Todas vazias (0 linhas), sem referência de código nem FK externa.
DROP TABLE IF EXISTS public.interactions CASCADE;
DROP TABLE IF EXISTS public.conversation_status CASCADE;
DROP TABLE IF EXISTS public.contacts CASCADE;
DROP TABLE IF EXISTS public.agent_config CASCADE;
DROP TABLE IF EXISTS public.sectors CASCADE;
DROP FUNCTION IF EXISTS public.update_conversation_status_timestamp();
