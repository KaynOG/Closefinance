
create or replace function public.gen_friend_code() returns text
language plpgsql
set search_path = public
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..8 loop
    result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;
  return result;
end;
$$;

revoke execute on function public.gen_friend_code() from public, anon, authenticated;
revoke execute on function public.find_profile_by_friend_code(text) from public, anon;
revoke execute on function public.get_my_friends_ranking() from public, anon;
grant execute on function public.find_profile_by_friend_code(text) to authenticated;
grant execute on function public.get_my_friends_ranking() to authenticated;
