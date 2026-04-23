-- 1) Normaliza tenants existentes que já são partner/tester/pro mas com limites errados
UPDATE public.tenants
SET plan_limits = '{"max_blocks": 9999, "analytics": true, "campaigns": true, "improvements": true, "themes": true, "show_badge": false}'::jsonb
WHERE plan IN ('partner','tester','pro');

UPDATE public.tenants
SET plan_limits = '{"max_blocks": 3, "analytics": false, "campaigns": false, "improvements": false, "themes": false, "show_badge": true}'::jsonb
WHERE plan = 'free';

-- 2) Função que normaliza plan_limits com base no plano
CREATE OR REPLACE FUNCTION public.normalize_tenant_plan_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.plan IN ('partner','tester','pro') THEN
    NEW.plan_limits := '{"max_blocks": 9999, "analytics": true, "campaigns": true, "improvements": true, "themes": true, "show_badge": false}'::jsonb;
  ELSIF NEW.plan = 'free' THEN
    NEW.plan_limits := '{"max_blocks": 3, "analytics": false, "campaigns": false, "improvements": false, "themes": false, "show_badge": true}'::jsonb;
  END IF;
  RETURN NEW;
END;
$function$;

-- 3) Trigger no INSERT e no UPDATE de plan
DROP TRIGGER IF EXISTS trg_normalize_tenant_plan_limits_ins ON public.tenants;
CREATE TRIGGER trg_normalize_tenant_plan_limits_ins
  BEFORE INSERT ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_tenant_plan_limits();

DROP TRIGGER IF EXISTS trg_normalize_tenant_plan_limits_upd ON public.tenants;
CREATE TRIGGER trg_normalize_tenant_plan_limits_upd
  BEFORE UPDATE OF plan ON public.tenants
  FOR EACH ROW
  WHEN (OLD.plan IS DISTINCT FROM NEW.plan)
  EXECUTE FUNCTION public.normalize_tenant_plan_limits();