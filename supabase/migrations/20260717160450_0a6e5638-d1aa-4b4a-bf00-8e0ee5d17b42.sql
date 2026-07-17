-- Tighten SECURITY DEFINER function grants: revoke default PUBLIC execute,
-- keep only the two intentional client-facing RPCs executable by authenticated.

REVOKE ALL ON FUNCTION public.gen_friend_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.find_profile_by_friend_code(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_my_friends_ranking() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.find_profile_by_friend_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_friends_ranking() TO authenticated;

-- Harden the two RPCs with an explicit auth check so unauthenticated calls fail fast.
CREATE OR REPLACE FUNCTION public.find_profile_by_friend_code(_code text)
 RETURNS TABLE(id uuid, name text, avatar text, total_points integer, friend_code text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select p.id, p.name, p.avatar, p.total_points, p.friend_code
  from public.profiles p
  where auth.uid() is not null
    and p.friend_code = upper(_code)
  limit 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_my_friends_ranking()
 RETURNS TABLE(id uuid, name text, avatar text, total_points integer, friend_code text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select p.id, p.name, p.avatar, p.total_points, p.friend_code
  from public.friendships f
  join public.profiles p on p.id = f.friend_id
  where f.user_id = auth.uid()
    and auth.uid() is not null
  order by p.total_points desc, p.name asc;
$function$;