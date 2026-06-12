-- Guest checkout: libera o status 'expired' (cobrança Pix cancelada por tempo).
-- ADITIVA — só amplia o check de status; não altera dados existentes.

begin;

alter table public.guest_checkouts
  drop constraint if exists guest_checkouts_status_check;

alter table public.guest_checkouts
  add constraint guest_checkouts_status_check
  check (status in ('pending','paid','provisioned','failed','expired'));

commit;
