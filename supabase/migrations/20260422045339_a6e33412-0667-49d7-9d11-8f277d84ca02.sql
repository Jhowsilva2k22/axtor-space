-- Remove inserts públicos diretos. Toda escrita passará pela edge function (service role bypass RLS).
DROP POLICY IF EXISTS "Anyone can insert leads from landing" ON public.leads;
DROP POLICY IF EXISTS "Anyone can insert diagnostics" ON public.diagnostics;