CREATE TABLE public.client_error_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  severity TEXT NOT NULL DEFAULT 'error',
  message TEXT NOT NULL,
  stack TEXT,
  component_stack TEXT,
  route TEXT,
  user_agent TEXT,
  user_id UUID,
  user_email TEXT,
  tenant_id UUID,
  app_version TEXT,
  extra JSONB
);

ALTER TABLE public.client_error_log ENABLE ROW LEVEL SECURITY;

-- Insert público pra capturar crashes mesmo deslogado
CREATE POLICY "Anyone can log client errors"
ON public.client_error_log
FOR INSERT
TO anon, authenticated
WITH CHECK (char_length(message) <= 4000 AND char_length(coalesce(stack, '')) <= 16000);

-- Apenas admin lê / gerencia
CREATE POLICY "Admins read client errors"
ON public.client_error_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete client errors"
ON public.client_error_log
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_client_error_log_created_at ON public.client_error_log (created_at DESC);
CREATE INDEX idx_client_error_log_user ON public.client_error_log (user_id, created_at DESC);
CREATE INDEX idx_client_error_log_severity ON public.client_error_log (severity, created_at DESC);