-- 1) Campos de duração no produto (donos definem; IA nunca define)
ALTER TABLE public.deep_funnel_products
  ADD COLUMN IF NOT EXISTS session_duration text,
  ADD COLUMN IF NOT EXISTS plan_duration text;

-- 2) Nova RPC de métricas de bloco escopada por tenant (owner OU admin)
CREATE OR REPLACE FUNCTION public.get_block_analytics_v2(_block_id uuid, _days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _since timestamptz := now() - make_interval(days => _days);
  _tenant_id uuid;
  _bio_views bigint;
  _clicks_period bigint;
  _result jsonb;
BEGIN
  SELECT tenant_id INTO _tenant_id FROM public.bio_blocks WHERE id = _block_id;
  IF _tenant_id IS NULL THEN
    RAISE EXCEPTION 'block_not_found';
  END IF;

  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR is_tenant_owner(_tenant_id)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT count(*) INTO _bio_views
  FROM page_views
  WHERE tenant_id = _tenant_id AND created_at >= _since AND path LIKE '%/bio%' OR path = '/' || (SELECT slug FROM tenants WHERE id = _tenant_id);

  SELECT count(*) INTO _bio_views
  FROM page_views
  WHERE tenant_id = _tenant_id AND created_at >= _since;

  SELECT count(*) INTO _clicks_period
  FROM bio_clicks
  WHERE block_id = _block_id AND tenant_id = _tenant_id AND created_at >= _since;

  SELECT jsonb_build_object(
    'block_id', _block_id,
    'period_days', _days,
    'clicks_24h', (SELECT count(*) FROM bio_clicks WHERE block_id = _block_id AND tenant_id = _tenant_id AND created_at >= now() - interval '24 hours'),
    'clicks_7d',  (SELECT count(*) FROM bio_clicks WHERE block_id = _block_id AND tenant_id = _tenant_id AND created_at >= now() - interval '7 days'),
    'clicks_30d', (SELECT count(*) FROM bio_clicks WHERE block_id = _block_id AND tenant_id = _tenant_id AND created_at >= now() - interval '30 days'),
    'clicks_period', _clicks_period,
    'bio_views_period', _bio_views,
    'ctr', CASE WHEN _bio_views > 0 THEN round((_clicks_period::numeric / _bio_views::numeric) * 100, 2) ELSE 0 END,
    'daily', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('day', day, 'clicks', clicks) ORDER BY day), '[]'::jsonb)
      FROM (
        SELECT date_trunc('day', created_at)::date AS day, count(*) AS clicks
        FROM bio_clicks
        WHERE block_id = _block_id AND tenant_id = _tenant_id AND created_at >= _since
        GROUP BY day
      ) t
    ),
    'by_device', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('device', device, 'clicks', clicks) ORDER BY clicks DESC), '[]'::jsonb)
      FROM (
        SELECT coalesce(device, '(desconhecido)') AS device, count(*) AS clicks
        FROM bio_clicks
        WHERE block_id = _block_id AND tenant_id = _tenant_id AND created_at >= _since
        GROUP BY device
      ) t
    ),
    'by_utm_source', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('source', source, 'clicks', clicks) ORDER BY clicks DESC), '[]'::jsonb)
      FROM (
        SELECT coalesce(utm_source, '(direto)') AS source, count(*) AS clicks
        FROM bio_clicks
        WHERE block_id = _block_id AND tenant_id = _tenant_id AND created_at >= _since
        GROUP BY source
      ) t
    ),
    'by_utm_medium', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('medium', medium, 'clicks', clicks) ORDER BY clicks DESC), '[]'::jsonb)
      FROM (
        SELECT coalesce(utm_medium, '(nenhum)') AS medium, count(*) AS clicks
        FROM bio_clicks
        WHERE block_id = _block_id AND tenant_id = _tenant_id AND created_at >= _since
        GROUP BY medium
      ) t
    ),
    'by_utm_campaign', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('campaign', campaign, 'clicks', clicks) ORDER BY clicks DESC), '[]'::jsonb)
      FROM (
        SELECT coalesce(utm_campaign, '(nenhuma)') AS campaign, count(*) AS clicks
        FROM bio_clicks
        WHERE block_id = _block_id AND tenant_id = _tenant_id AND created_at >= _since
        GROUP BY campaign
      ) t
    ),
    'by_referrer', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('referrer', referrer, 'clicks', clicks) ORDER BY clicks DESC), '[]'::jsonb)
      FROM (
        SELECT coalesce(NULLIF(referrer, ''), '(direto)') AS referrer, count(*) AS clicks
        FROM bio_clicks
        WHERE block_id = _block_id AND tenant_id = _tenant_id AND created_at >= _since
        GROUP BY referrer
        LIMIT 20
      ) t
    )
  ) INTO _result;

  RETURN _result;
END;
$function$;

-- 3) Export de leads (com diagnóstico profundo) escopado por tenant
CREATE OR REPLACE FUNCTION public.export_tenant_leads(_tenant_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _result jsonb;
BEGIN
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR is_tenant_owner(_tenant_id)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'tenant_id', _tenant_id,
    'leads', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', l.id,
        'created_at', l.created_at,
        'full_name', l.full_name,
        'email', l.email,
        'phone', l.phone,
        'instagram_handle', l.instagram_handle,
        'source', l.source,
        'utm_source', l.utm_source,
        'utm_medium', l.utm_medium,
        'utm_campaign', l.utm_campaign,
        'profile_is_private', l.profile_is_private
      ) ORDER BY l.created_at DESC), '[]'::jsonb)
      FROM leads l WHERE l.tenant_id = _tenant_id
    ),
    'deep_diagnostics', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', d.id,
        'created_at', d.created_at,
        'funnel_name', f.name,
        'lead_name', d.lead_name,
        'lead_email', d.lead_email,
        'lead_phone', d.lead_phone,
        'instagram_handle', d.instagram_handle,
        'pain_detected', d.pain_detected,
        'recommended_product', p.name,
        'ai_veredict', d.ai_veredict,
        'status', d.status,
        'utm_source', d.utm_source,
        'utm_medium', d.utm_medium,
        'utm_campaign', d.utm_campaign
      ) ORDER BY d.created_at DESC), '[]'::jsonb)
      FROM deep_diagnostics d
      LEFT JOIN deep_funnels f ON f.id = d.funnel_id
      LEFT JOIN deep_funnel_products p ON p.id = d.recommended_product_id
      WHERE d.tenant_id = _tenant_id
    )
  ) INTO _result;
  RETURN _result;
END;
$function$;