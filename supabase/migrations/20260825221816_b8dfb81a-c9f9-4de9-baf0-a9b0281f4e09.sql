-- 1. Roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_roles_self_select ON public.user_roles;
CREATE POLICY user_roles_self_select ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- 2. Profile license fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS license_kind text NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS license_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS license_expires_at timestamptz;

-- 3. Access keys
CREATE TABLE IF NOT EXISTS public.access_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  kind text NOT NULL DEFAULT 'monthly',
  days integer,
  note text,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.access_keys TO authenticated;
GRANT ALL ON public.access_keys TO service_role;
ALTER TABLE public.access_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS access_keys_admin_all ON public.access_keys;
CREATE POLICY access_keys_admin_all ON public.access_keys
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS access_keys_set_updated_at ON public.access_keys;
CREATE TRIGGER access_keys_set_updated_at BEFORE UPDATE ON public.access_keys
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 4. Key generator (random readable code)
CREATE OR REPLACE FUNCTION public.gen_access_code()
RETURNS text LANGUAGE sql VOLATILE AS $$
  SELECT string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (floor(random()*32)+1)::int, 1), '')
  FROM generate_series(1,16);
$$;

-- 5. Redeem
CREATE OR REPLACE FUNCTION public.redeem_access_key(_code text)
RETURNS TABLE(license_kind text, license_expires_at timestamptz)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  k public.access_keys%ROWTYPE;
  _kind text;
  _exp timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT * INTO k FROM public.access_keys
  WHERE upper(replace(code,'-','')) = upper(replace(_code,'-','')) FOR UPDATE;

  IF NOT FOUND OR NOT k.active OR k.redeemed_by IS NOT NULL THEN
    RAISE EXCEPTION 'invalid_key';
  END IF;

  IF k.kind = 'lifetime' THEN
    _kind := 'lifetime'; _exp := NULL;
  ELSE
    _kind := k.kind;
    _exp := GREATEST(now(), COALESCE((SELECT p.license_expires_at FROM public.profiles p WHERE p.id = auth.uid()), now()))
            + (COALESCE(k.days, 30) || ' days')::interval;
  END IF;

  UPDATE public.access_keys
    SET redeemed_by = auth.uid(), redeemed_at = now(), active = false
    WHERE id = k.id;

  UPDATE public.profiles
    SET license_kind = _kind,
        license_started_at = COALESCE(license_started_at, now()),
        license_expires_at = _exp,
        updated_at = now()
    WHERE id = auth.uid();

  RETURN QUERY SELECT _kind, _exp;
END; $$;

REVOKE ALL ON FUNCTION public.redeem_access_key(text) FROM public;
GRANT EXECUTE ON FUNCTION public.redeem_access_key(text) TO authenticated;