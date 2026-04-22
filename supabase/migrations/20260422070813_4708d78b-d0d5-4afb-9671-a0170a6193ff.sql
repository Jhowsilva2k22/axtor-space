
-- LEADS: writes só admin via dashboard; serviço usa service_role (bypass)
DROP POLICY IF EXISTS "Admins manage leads" ON public.leads;
CREATE POLICY "Admins manage leads"
  ON public.leads
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- DIAGNOSTICS: idem
DROP POLICY IF EXISTS "Admins manage diagnostics" ON public.diagnostics;
CREATE POLICY "Admins manage diagnostics"
  ON public.diagnostics
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
