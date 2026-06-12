-- Helper pro guest checkout: checa se um email já tem conta (auth.users).
-- SECURITY DEFINER, search_path fixo, executável só pelo service_role
-- (não exposto a anon/authenticated — evita enumeração de email).

create or replace function public.email_has_account(_email text)
returns boolean
language sql
security definer
set search_path = public, auth
as $$
  select exists (select 1 from auth.users u where lower(u.email) = lower(_email));
$$;

revoke all on function public.email_has_account(text) from public, anon, authenticated;
grant execute on function public.email_has_account(text) to service_role;
