-- 1. Roles enum + tabela segura
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Admins can read roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. bio_config (singleton)
CREATE TABLE public.bio_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton BOOLEAN NOT NULL DEFAULT true UNIQUE,
  avatar_url TEXT,
  display_name TEXT NOT NULL DEFAULT 'Joanderson Silva',
  headline TEXT NOT NULL DEFAULT 'Ajudo pais que já foram ausentes a se reaproximarem dos filhos com presença real, leveza e propósito.',
  sub_headline TEXT,
  contact_url TEXT,
  footer_text TEXT DEFAULT 'joandersonsilva.com.br',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bio_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read bio config" ON public.bio_config
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can update bio config" ON public.bio_config
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert bio config" ON public.bio_config
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER bio_config_updated_at
  BEFORE UPDATE ON public.bio_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. bio_blocks (lista de cards)
CREATE TABLE public.bio_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL DEFAULT 'link', -- link | product | affiliate | partner | ebook | service | cta_diagnostico | cta_ferramenta | whatsapp | instagram | site | agenda
  label TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  icon TEXT, -- nome do ícone lucide
  badge TEXT, -- "novo", "popular", "afiliado", "parceiro"
  highlight BOOLEAN NOT NULL DEFAULT false, -- destaque dourado
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX bio_blocks_position_idx ON public.bio_blocks(position) WHERE is_active = true;

ALTER TABLE public.bio_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active blocks" ON public.bio_blocks
  FOR SELECT TO anon, authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage blocks" ON public.bio_blocks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER bio_blocks_updated_at
  BEFORE UPDATE ON public.bio_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Cria usuário admin direto via auth.users (senha hashada bcrypt)
DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_sso_user
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    'contatojhow@icloud.com',
    crypt('The13071994jhow.', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    false
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', 'contatojhow@icloud.com', 'email_verified', true),
    'email',
    new_user_id::text,
    now(),
    now(),
    now()
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (new_user_id, 'admin');
END $$;

-- 5. Seed bio_config + blocos iniciais
INSERT INTO public.bio_config (singleton, display_name, headline, sub_headline)
VALUES (true, 'Joanderson Silva',
  'Ajudo pais que já foram ausentes a se reaproximarem dos filhos com presença real, leveza e propósito.',
  'Estratégia, presença digital e reconstrução de vínculo.');

INSERT INTO public.bio_blocks (kind, label, description, url, icon, badge, highlight, position) VALUES
  ('instagram', 'Instagram', 'Conteúdo diário sobre presença e paternidade', 'https://instagram.com/joandersonsilva', 'Instagram', NULL, false, 1),
  ('site', 'Site oficial', 'Tudo sobre o trabalho', 'https://joandersonsilva.com.br', 'Globe', NULL, false, 2),
  ('whatsapp', 'WhatsApp', 'Falar diretamente comigo', 'https://wa.me/5500000000000', 'MessageCircle', NULL, false, 3),
  ('cta_diagnostico', 'Diagnóstico do seu Instagram', 'Descubra em 30s o que tá deixando dinheiro na mesa', '/', 'Sparkles', 'gratuito', true, 4),
  ('cta_ferramenta', 'Quer um link-in-bio assim?', 'A mesma ferramenta, no seu nome', 'mailto:contatojhow@icloud.com?subject=Quero%20meu%20link-in-bio', 'Crown', 'novo', true, 5);