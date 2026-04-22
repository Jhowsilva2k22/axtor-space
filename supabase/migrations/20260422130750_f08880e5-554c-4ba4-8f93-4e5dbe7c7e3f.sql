-- 1. page_views
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  path text NOT NULL,
  session_id text NOT NULL,
  referrer text,
  user_agent text,
  device text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  meta jsonb
);
CREATE INDEX idx_page_views_created_at ON public.page_views (created_at DESC);
CREATE INDEX idx_page_views_path ON public.page_views (path);
CREATE INDEX idx_page_views_session ON public.page_views (session_id);
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert page views" ON public.page_views FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read page views" ON public.page_views FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. bio_clicks
CREATE TABLE public.bio_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  block_id uuid,
  block_kind text,
  block_label text,
  block_url text,
  session_id text NOT NULL,
  referrer text,
  device text,
  utm_source text,
  utm_medium text,
  utm_campaign text
);
CREATE INDEX idx_bio_clicks_created_at ON public.bio_clicks (created_at DESC);
CREATE INDEX idx_bio_clicks_block_id ON public.bio_clicks (block_id);
ALTER TABLE public.bio_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert bio clicks" ON public.bio_clicks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read bio clicks" ON public.bio_clicks FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. funnel_events (etapas do diagnóstico)
CREATE TABLE public.funnel_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  event_name text NOT NULL,
  session_id text NOT NULL,
  instagram_handle text,
  diagnostic_id uuid,
  meta jsonb,
  utm_source text,
  utm_medium text,
  utm_campaign text
);
CREATE INDEX idx_funnel_events_created_at ON public.funnel_events (created_at DESC);
CREATE INDEX idx_funnel_events_name ON public.funnel_events (event_name);
CREATE INDEX idx_funnel_events_session ON public.funnel_events (session_id);
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert funnel events" ON public.funnel_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read funnel events" ON public.funnel_events FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. RPC de resumo (admin-only)
CREATE OR REPLACE FUNCTION public.get_analytics_summary(_days int DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _since timestamptz := now() - make_interval(days => _days);
  _result jsonb;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'period_days', _days,
    'page_views_total', (SELECT count(*) FROM page_views WHERE created_at >= _since),
    'unique_sessions', (SELECT count(DISTINCT session_id) FROM page_views WHERE created_at >= _since),
    'bio_clicks_total', (SELECT count(*) FROM bio_clicks WHERE created_at >= _since),
    'leads_total', (SELECT count(*) FROM leads WHERE created_at >= _since),
    'diagnostics_completed', (SELECT count(*) FROM diagnostics WHERE created_at >= _since AND status = 'completed'),
    'diagnostics_failed', (SELECT count(*) FROM diagnostics WHERE created_at >= _since AND status = 'failed'),
    'diagnostics_private', (SELECT count(*) FROM diagnostics WHERE created_at >= _since AND status = 'private_profile'),
    'views_by_path', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('path', path, 'views', views) ORDER BY views DESC), '[]'::jsonb)
      FROM (SELECT path, count(*) AS views FROM page_views WHERE created_at >= _since GROUP BY path) t
    ),
    'top_blocks', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('block_id', block_id, 'label', block_label, 'kind', block_kind, 'clicks', clicks) ORDER BY clicks DESC), '[]'::jsonb)
      FROM (SELECT block_id, block_label, block_kind, count(*) AS clicks FROM bio_clicks WHERE created_at >= _since GROUP BY block_id, block_label, block_kind ORDER BY clicks DESC LIMIT 20) t
    ),
    'funnel', (
      SELECT coalesce(jsonb_object_agg(event_name, c), '{}'::jsonb)
      FROM (SELECT event_name, count(*) AS c FROM funnel_events WHERE created_at >= _since GROUP BY event_name) t
    ),
    'top_handles', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('handle', instagram_handle, 'count', c) ORDER BY c DESC), '[]'::jsonb)
      FROM (SELECT instagram_handle, count(*) AS c FROM diagnostics WHERE created_at >= _since GROUP BY instagram_handle ORDER BY c DESC LIMIT 20) t
    ),
    'utm_sources', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('source', source, 'views', views) ORDER BY views DESC), '[]'::jsonb)
      FROM (SELECT coalesce(utm_source, '(direto)') AS source, count(*) AS views FROM page_views WHERE created_at >= _since GROUP BY source) t
    ),
    'daily_views', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('day', day, 'views', views) ORDER BY day), '[]'::jsonb)
      FROM (SELECT date_trunc('day', created_at)::date AS day, count(*) AS views FROM page_views WHERE created_at >= _since GROUP BY day) t
    ),
    'recent_leads', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', l.id,
        'handle', l.instagram_handle,
        'email', l.email,
        'phone', l.phone,
        'name', l.full_name,
        'created_at', l.created_at,
        'utm_source', l.utm_source,
        'completed', EXISTS(SELECT 1 FROM diagnostics d WHERE d.lead_id = l.id AND d.status = 'completed'),
        'private', l.profile_is_private
      ) ORDER BY l.created_at DESC), '[]'::jsonb)
      FROM (SELECT * FROM leads WHERE created_at >= _since ORDER BY created_at DESC LIMIT 50) l
    )
  ) INTO _result;

  RETURN _result;
END;
$$;