-- Index for fast per-block analytics queries
CREATE INDEX IF NOT EXISTS idx_bio_clicks_block_created
  ON public.bio_clicks (block_id, created_at DESC);

-- Per-block analytics function (admin only)
CREATE OR REPLACE FUNCTION public.get_block_analytics(_block_id uuid, _days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _since timestamptz := now() - make_interval(days => _days);
  _bio_views bigint;
  _clicks_period bigint;
  _result jsonb;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT count(*) INTO _bio_views
  FROM page_views
  WHERE created_at >= _since AND path = '/bio';

  SELECT count(*) INTO _clicks_period
  FROM bio_clicks
  WHERE block_id = _block_id AND created_at >= _since;

  SELECT jsonb_build_object(
    'block_id', _block_id,
    'period_days', _days,
    'clicks_24h', (SELECT count(*) FROM bio_clicks WHERE block_id = _block_id AND created_at >= now() - interval '24 hours'),
    'clicks_7d',  (SELECT count(*) FROM bio_clicks WHERE block_id = _block_id AND created_at >= now() - interval '7 days'),
    'clicks_30d', (SELECT count(*) FROM bio_clicks WHERE block_id = _block_id AND created_at >= now() - interval '30 days'),
    'clicks_period', _clicks_period,
    'bio_views_period', _bio_views,
    'ctr', CASE WHEN _bio_views > 0 THEN round((_clicks_period::numeric / _bio_views::numeric) * 100, 2) ELSE 0 END,
    'daily', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('day', day, 'clicks', clicks) ORDER BY day), '[]'::jsonb)
      FROM (
        SELECT date_trunc('day', created_at)::date AS day, count(*) AS clicks
        FROM bio_clicks
        WHERE block_id = _block_id AND created_at >= _since
        GROUP BY day
      ) t
    ),
    'by_device', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('device', device, 'clicks', clicks) ORDER BY clicks DESC), '[]'::jsonb)
      FROM (
        SELECT coalesce(device, '(desconhecido)') AS device, count(*) AS clicks
        FROM bio_clicks
        WHERE block_id = _block_id AND created_at >= _since
        GROUP BY device
      ) t
    ),
    'by_utm_source', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('source', source, 'clicks', clicks) ORDER BY clicks DESC), '[]'::jsonb)
      FROM (
        SELECT coalesce(utm_source, '(direto)') AS source, count(*) AS clicks
        FROM bio_clicks
        WHERE block_id = _block_id AND created_at >= _since
        GROUP BY source
      ) t
    ),
    'by_utm_medium', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('medium', medium, 'clicks', clicks) ORDER BY clicks DESC), '[]'::jsonb)
      FROM (
        SELECT coalesce(utm_medium, '(nenhum)') AS medium, count(*) AS clicks
        FROM bio_clicks
        WHERE block_id = _block_id AND created_at >= _since
        GROUP BY medium
      ) t
    ),
    'by_utm_campaign', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('campaign', campaign, 'clicks', clicks) ORDER BY clicks DESC), '[]'::jsonb)
      FROM (
        SELECT coalesce(utm_campaign, '(nenhuma)') AS campaign, count(*) AS clicks
        FROM bio_clicks
        WHERE block_id = _block_id AND created_at >= _since
        GROUP BY campaign
      ) t
    ),
    'by_referrer', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('referrer', referrer, 'clicks', clicks) ORDER BY clicks DESC), '[]'::jsonb)
      FROM (
        SELECT coalesce(NULLIF(referrer, ''), '(direto)') AS referrer, count(*) AS clicks
        FROM bio_clicks
        WHERE block_id = _block_id AND created_at >= _since
        GROUP BY referrer
        LIMIT 20
      ) t
    )
  ) INTO _result;

  RETURN _result;
END;
$function$;