
-- Remove o usuário antigo (e seus papéis em cascata via user_id)
DELETE FROM public.user_roles WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'contatojhow@icloud.com');
DELETE FROM auth.identities WHERE provider_id = 'contatojhow@icloud.com' OR user_id IN (SELECT id FROM auth.users WHERE email = 'contatojhow@icloud.com');
DELETE FROM auth.users WHERE email = 'contatojhow@icloud.com';

-- Recria o usuário com todos os campos string preenchidos (vazios, não NULL)
DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, recovery_sent_at, last_sign_in_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    'contatojhow@icloud.com',
    crypt('The13071994jhow.', gen_salt('bf')),
    now(), NULL, NULL,
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(), now(),
    '', '', '', ''
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', 'contatojhow@icloud.com', 'email_verified', true),
    'email',
    'contatojhow@icloud.com',
    now(), now(), now()
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (new_user_id, 'admin');
END $$;
