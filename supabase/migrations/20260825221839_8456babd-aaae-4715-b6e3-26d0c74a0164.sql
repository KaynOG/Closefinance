CREATE OR REPLACE FUNCTION public.gen_access_code()
RETURNS text LANGUAGE sql VOLATILE SET search_path = public AS $$
  SELECT string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (floor(random()*32)+1)::int, 1), '')
  FROM generate_series(1,16);
$$;

REVOKE ALL ON FUNCTION public.gen_access_code() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.gen_access_code() TO authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.redeem_access_key(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.redeem_access_key(text) TO authenticated;