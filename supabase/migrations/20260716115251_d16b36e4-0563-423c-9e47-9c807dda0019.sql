
-- ============ 1. Friend code column on profiles ============
alter table public.profiles add column if not exists friend_code text unique;

create or replace function public.gen_friend_code() returns text
language plpgsql as $$
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

-- Backfill for existing users
do $$
declare r record; new_code text;
begin
  for r in select id from public.profiles where friend_code is null loop
    loop
      new_code := public.gen_friend_code();
      exit when not exists (select 1 from public.profiles where friend_code = new_code);
    end loop;
    update public.profiles set friend_code = new_code where id = r.id;
  end loop;
end $$;

-- ============ 2. Update handle_new_user ============
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
begin
  -- unique friend code
  loop
    new_code := public.gen_friend_code();
    exit when not exists (select 1 from public.profiles where friend_code = new_code);
  end loop;

  insert into public.profiles (id, email, name, birthdate, job, yearly_goal, gender, friend_code)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email,''), '@', 1)),
    nullif(new.raw_user_meta_data->>'birthdate','')::date,
    nullif(new.raw_user_meta_data->>'job',''),
    nullif(new.raw_user_meta_data->>'yearly_goal','')::numeric,
    coalesce(new.raw_user_meta_data->>'gender','other'),
    new_code
  )
  on conflict (id) do nothing;

  -- Categorias padrão (expandidas)
  insert into public.categories (user_id, name, color, kind, icon) values
    (new.id, 'Aluguel/Moradia', '#540BD3', 'expense', 'home'),
    (new.id, 'Conta de luz',    '#FFCC00', 'expense', 'power'),
    (new.id, 'Conta de água',   '#22C3CC', 'expense', 'water'),
    (new.id, 'Internet',        '#006F77', 'expense', 'internet'),
    (new.id, 'Alimentação',     '#FF6B1A', 'expense', 'food'),
    (new.id, 'Lazer',           '#B388FF', 'expense', 'leisure'),
    (new.id, 'Tecnologia',      '#2BD9A1', 'expense', 'laptop'),
    (new.id, 'Estudo',          '#FFD700', 'expense', 'study'),
    (new.id, 'Transporte',      '#820432', 'expense', 'car'),
    (new.id, 'Animais',         '#FF8FA3', 'expense', 'dog'),
    (new.id, 'Saúde',           '#FF4D6D', 'expense', 'doctor'),
    (new.id, 'Salário',         '#2BD9A1', 'income',  'cash'),
    (new.id, 'Renda extra',     '#22C3CC', 'income',  'money');
  return new;
end;
$$;

-- ============ 3. Friendships table ============
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  friend_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, friend_id),
  check (user_id <> friend_id)
);

grant select, insert, delete on public.friendships to authenticated;
grant all on public.friendships to service_role;

alter table public.friendships enable row level security;

create policy friendships_self_select on public.friendships
  for select to authenticated using (auth.uid() = user_id);
create policy friendships_self_insert on public.friendships
  for insert to authenticated with check (auth.uid() = user_id);
create policy friendships_self_delete on public.friendships
  for delete to authenticated using (auth.uid() = user_id);

-- ============ 4. RPC: find profile by code ============
create or replace function public.find_profile_by_friend_code(_code text)
returns table (id uuid, name text, avatar text, total_points int, friend_code text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.name, p.avatar, p.total_points, p.friend_code
  from public.profiles p
  where p.friend_code = upper(_code)
  limit 1;
$$;

grant execute on function public.find_profile_by_friend_code(text) to authenticated;

-- ============ 5. RPC: my friends ranking ============
create or replace function public.get_my_friends_ranking()
returns table (id uuid, name text, avatar text, total_points int, friend_code text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.name, p.avatar, p.total_points, p.friend_code
  from public.friendships f
  join public.profiles p on p.id = f.friend_id
  where f.user_id = auth.uid()
  order by p.total_points desc, p.name asc;
$$;

grant execute on function public.get_my_friends_ranking() to authenticated;
