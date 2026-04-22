
-- Tabela de feedback público enviado por visitantes
CREATE TABLE public.user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'general',
  message text NOT NULL,
  email text,
  page_path text,
  block_id uuid,
  session_id text,
  user_agent text,
  device text,
  sentiment text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit feedback"
  ON public.user_feedback FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(message) BETWEEN 3 AND 2000
    AND char_length(category) <= 50
  );

CREATE POLICY "Admins read feedback"
  ON public.user_feedback FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage feedback"
  ON public.user_feedback FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete feedback"
  ON public.user_feedback FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_user_feedback_created ON public.user_feedback (created_at DESC);
CREATE INDEX idx_user_feedback_status ON public.user_feedback (status);

-- Tabela de recomendações geradas pela IA
CREATE TABLE public.improvement_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text NOT NULL,
  rationale text,
  category text NOT NULL DEFAULT 'general',
  impact text NOT NULL DEFAULT 'medium', -- low | medium | high
  effort text NOT NULL DEFAULT 'medium', -- low | medium | high
  priority_score numeric NOT NULL DEFAULT 0,
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  action_type text, -- e.g. update_bio_config, edit_block, create_block, manual
  action_payload jsonb,
  status text NOT NULL DEFAULT 'new', -- new | in_progress | applied | dismissed
  applied_at timestamptz,
  source_run_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.improvement_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage recommendations"
  ON public.improvement_recommendations FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_recommendations_status ON public.improvement_recommendations (status, priority_score DESC);
CREATE INDEX idx_recommendations_run ON public.improvement_recommendations (source_run_id);

CREATE TRIGGER trg_improvement_recommendations_updated_at
  BEFORE UPDATE ON public.improvement_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de runs (cada vez que a IA roda uma análise)
CREATE TABLE public.improvement_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending', -- pending | completed | failed
  inputs_summary jsonb,
  ai_summary text,
  recommendations_count integer NOT NULL DEFAULT 0,
  error_message text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.improvement_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage runs"
  ON public.improvement_runs FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
