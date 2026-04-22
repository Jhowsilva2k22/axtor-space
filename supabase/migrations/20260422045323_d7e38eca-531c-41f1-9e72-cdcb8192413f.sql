-- Tabela de leads capturados na landing
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instagram_handle TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  full_name TEXT,
  profile_is_private BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'landing_diagnostico',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_leads_handle ON public.leads(instagram_handle);
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_created ON public.leads(created_at DESC);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Inserts públicos (vindo da landing, sem auth) — apenas via edge function service role
CREATE POLICY "Anyone can insert leads from landing"
ON public.leads FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Leitura bloqueada para o público (apenas service role / admin futuramente)
CREATE POLICY "No public read on leads"
ON public.leads FOR SELECT
TO anon
USING (false);

-- Tabela de diagnósticos (cache + histórico)
CREATE TABLE public.diagnostics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  instagram_handle TEXT NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT false,
  profile_data JSONB,
  scores JSONB,
  insights JSONB,
  ai_summary TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_diagnostics_handle ON public.diagnostics(instagram_handle);
CREATE INDEX idx_diagnostics_lead ON public.diagnostics(lead_id);
CREATE INDEX idx_diagnostics_created ON public.diagnostics(created_at DESC);

ALTER TABLE public.diagnostics ENABLE ROW LEVEL SECURITY;

-- Diagnósticos podem ser lidos publicamente pelo handle (resultado é mostrado na tela)
CREATE POLICY "Public can read diagnostics"
ON public.diagnostics FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can insert diagnostics"
ON public.diagnostics FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_diagnostics_updated_at
BEFORE UPDATE ON public.diagnostics
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();