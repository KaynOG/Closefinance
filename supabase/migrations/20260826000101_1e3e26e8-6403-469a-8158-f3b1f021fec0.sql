INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users ORDER BY created_at ASC LIMIT 1
ON CONFLICT (user_id, role) DO NOTHING;

DROP POLICY IF EXISTS profiles_admin_select ON public.profiles;
CREATE POLICY profiles_admin_select ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS profiles_admin_update ON public.profiles;
CREATE POLICY profiles_admin_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS user_roles_admin_select ON public.user_roles;
CREATE POLICY user_roles_admin_select ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));