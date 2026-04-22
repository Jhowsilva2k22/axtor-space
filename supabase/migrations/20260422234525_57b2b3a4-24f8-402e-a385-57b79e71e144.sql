
CREATE OR REPLACE FUNCTION public.get_tenant_analytics(_tenant_id uuid, _days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _since timestamptz := now() - make_interval(days => _days);
  _result jsonb;
BEGIN
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR is_tenant_owner(_tenant_id)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'period_days', _days,
    'tenant_id', _tenant_id,
    'page_views_total', (SELECT count(*) FROM page_views WHERE tenant_id = _tenant_id AND created_at >= _since),
    'unique_sessions', (SELECT count(DISTINCT session_id) FROM page_views WHERE tenant_id = _tenant_id AND created_at >= _since),
    'bio_clicks_total', (SELECT count(*) FROM bio_clicks WHERE tenant_id = _tenant_id AND created_at >= _since),
    'leads_total', (SELECT count(*) FROM leads WHERE tenant_id = _tenant_id AND created_at >= _since),
    'diagnostics_completed', (SELECT count(*) FROM diagnostics WHERE tenant_id = _tenant_id AND created_at >= _since AND status = 'completed'),
    'diagnostics_failed', (SELECT count(*) FROM diagnostics WHERE tenant_id = _tenant_id AND created_at >= _since AND status = 'failed'),
    'diagnostics_private', (SELECT count(*) FROM diagnostics WHERE tenant_id = _tenant_id AND created_at >= _since AND status = 'private_profile'),
    'views_by_path', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('path', path, 'views', views) ORDER BY views DESC), '[]'::jsonb)
      FROM (SELECT path, count(*) AS views FROM page_views WHERE tenant_id = _tenant_id AND created_at >= _since GROUP BY path) t
    ),
    'top_blocks', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('block_id', block_id, 'label', block_label, 'kind', block_kind, 'clicks', clicks) ORDER BY clicks DESC), '[]'::jsonb)
      FROM (SELECT block_id, block_label, block_kind, count(*) AS clicks FROM bio_clicks WHERE tenant_id = _tenant_id AND created_at >= _since GROUP BY block_id, block_label, block_kind ORDER BY clicks DESC LIMIT 20) t
    ),
    'funnel', (
      SELECT coalesce(jsonb_object_agg(event_name, c), '{}'::jsonb)
      FROM (SELECT event_name, count(*) AS c FROM funnel_events WHERE tenant_id = _tenant_id AND created_at >= _since GROUP BY event_name) t
    ),
    'top_handles', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('handle', instagram_handle, 'count', c) ORDER BY c DESC), '[]'::jsonb)
      FROM (SELECT instagram_handle, count(*) AS c FROM diagnostics WHERE tenant_id = _tenant_id AND created_at >= _since GROUP BY instagram_handle ORDER BY c DESC LIMIT 20) t
    ),
    'utm_sources', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('source', source, 'views', views) ORDER BY views DESC), '[]'::jsonb)
      FROM (SELECT coalesce(utm_source, '(direto)') AS source, count(*) AS views FROM page_views WHERE tenant_id = _tenant_id AND created_at >= _since GROUP BY source) t
    ),
    'daily_views', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('day', day, 'views', views) ORDER BY day), '[]'::jsonb)
      FROM (SELECT date_trunc('day', created_at)::date AS day, count(*) AS views FROM page_views WHERE tenant_id = _tenant_id AND created_at >= _since GROUP BY day) t
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
      FROM (SELECT * FROM leads WHERE tenant_id = _tenant_id AND created_at >= _since ORDER BY created_at DESC LIMIT 50) l
    )
  ) INTO _result;

  RETURN _result;
END;
$function$;
