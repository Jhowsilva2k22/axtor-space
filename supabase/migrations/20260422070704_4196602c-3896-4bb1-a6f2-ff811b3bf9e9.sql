
-- ============== LEADS: somente admins podem ler ==============
DROP POLICY IF EXISTS "No public read on leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can read leads" ON public.leads;
CREATE POLICY "Admins can read leads"
  ON public.leads
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============== DIAGNOSTICS: remover leitura pública ==============
DROP POLICY IF EXISTS "Public can read diagnostics" ON public.diagnostics;
DROP POLICY IF EXISTS "Admins can read diagnostics" ON public.diagnostics;
CREATE POLICY "Admins can read diagnostics"
  ON public.diagnostics
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Função segura para a página /share/:id ler 1 diagnóstico específico sem expor a tabela
CREATE OR REPLACE FUNCTION public.get_diagnostic_public(_id uuid)
RETURNS TABLE (
  id uuid,
  instagram_handle text,
  status text,
  is_private boolean,
  profile_data jsonb,
  scores jsonb,
  insights jsonb,
  ai_summary text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, instagram_handle, status, is_private, profile_data, scores, insights, ai_summary, created_at
  FROM public.diagnostics
  WHERE id = _id
$$;

GRANT EXECUTE ON FUNCTION public.get_diagnostic_public(uuid) TO anon, authenticated;

-- ============== STORAGE avatars: SELECT público apenas em bio/* ==============
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
CREATE POLICY "Public can view bio avatars"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'bio'
  );
