-- A1: fecha UPDATE anônimo irrestrito em deep_diagnostics (estava USING true / WITH CHECK true)
DROP POLICY IF EXISTS "Anyone can update own session deep diagnostics" ON public.deep_diagnostics;
CREATE POLICY "Anon update only recent in-progress diagnostics"
  ON public.deep_diagnostics
  FOR UPDATE
  TO anon, authenticated
  USING (status <> 'completed' AND created_at > now() - interval '1 day')
  WITH CHECK (created_at > now() - interval '1 day');

-- B1: search_path fixo na função
ALTER FUNCTION public.update_conversation_status_timestamp() SET search_path = public, pg_temp;
