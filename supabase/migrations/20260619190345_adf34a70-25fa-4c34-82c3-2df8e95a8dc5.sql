
-- =========== Profiles ===========
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text not null default '',
  birthdate date,
  job text,
  yearly_goal numeric,
  avatar text,
  gender text check (gender in ('male','female','other')) default 'other',
  total_points integer not null default 0,
  sound_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles_self_select" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_self_insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_self_update" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_self_delete" on public.profiles for delete to authenticated using (auth.uid() = id);

-- =========== Categories ===========
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#540BD3',
  icon text,
  kind text not null default 'expense' check (kind in ('income','expense','both')),
  created_at timestamptz not null default now()
);
create index categories_user_idx on public.categories(user_id);
grant select, insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "categories_self_all" on public.categories for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========== Cards ===========
create table public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  limit_amount numeric not null default 0,
  closing_day integer not null default 1 check (closing_day between 1 and 28),
  due_day integer not null default 10 check (due_day between 1 and 28),
  color text not null default '#540BD3',
  created_at timestamptz not null default now()
);
create index cards_user_idx on public.cards(user_id);
grant select, insert, update, delete on public.cards to authenticated;
grant all on public.cards to service_role;
alter table public.cards enable row level security;
create policy "cards_self_all" on public.cards for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========== Banks ===========
create table public.banks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#22C3CC',
  account_balance numeric not null default 0,
  saved_amount numeric not null default 0,
  note text,
  created_at timestamptz not null default now()
);
create index banks_user_idx on public.banks(user_id);
grant select, insert, update, delete on public.banks to authenticated;
grant all on public.banks to service_role;
alter table public.banks enable row level security;
create policy "banks_self_all" on public.banks for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========== Transactions ===========
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income','expense')),
  amount numeric not null check (amount > 0),
  description text not null default '',
  date date not null,
  category_id uuid references public.categories(id) on delete set null,
  card_id uuid references public.cards(id) on delete set null,
  bank_id uuid references public.banks(id) on delete set null,
  essential text check (essential in ('essential','non_essential')),
  payment_method text check (payment_method in ('credit','debit','pix','cash')),
  installment_no integer,
  installment_total integer,
  installment_group_id uuid,
  tag text,
  created_at timestamptz not null default now()
);
create index transactions_user_idx on public.transactions(user_id);
create index transactions_date_idx on public.transactions(user_id, date desc);
create index transactions_group_idx on public.transactions(installment_group_id);
grant select, insert, update, delete on public.transactions to authenticated;
grant all on public.transactions to service_role;
alter table public.transactions enable row level security;
create policy "transactions_self_all" on public.transactions for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========== Mission History ===========
create table public.mission_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id text not null,
  points integer not null default 10,
  occurred_at timestamptz not null default now(),
  day date not null default (now() at time zone 'utc')::date
);
create index mission_history_user_idx on public.mission_history(user_id, occurred_at desc);
create unique index mission_history_unique_per_day on public.mission_history(user_id, mission_id, day) where points > 0;
grant select, insert, update, delete on public.mission_history to authenticated;
grant all on public.mission_history to service_role;
alter table public.mission_history enable row level security;
create policy "mission_history_self_all" on public.mission_history for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========== handle_new_user trigger ===========
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, birthdate, job, yearly_goal, gender)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email,''), '@', 1)),
    nullif(new.raw_user_meta_data->>'birthdate','')::date,
    nullif(new.raw_user_meta_data->>'job',''),
    nullif(new.raw_user_meta_data->>'yearly_goal','')::numeric,
    coalesce(new.raw_user_meta_data->>'gender','other')
  )
  on conflict (id) do nothing;

  -- Categorias padrão
  insert into public.categories (user_id, name, color, kind) values
    (new.id, 'Alimentação', '#FFCC00', 'expense'),
    (new.id, 'Moradia', '#540BD3', 'expense'),
    (new.id, 'Transporte', '#006F77', 'expense'),
    (new.id, 'Lazer', '#820432', 'expense'),
    (new.id, 'Saúde', '#FF8FA3', 'expense'),
    (new.id, 'Salário', '#2BD9A1', 'income'),
    (new.id, 'Renda extra', '#22C3CC', 'income');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at trigger for profiles
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.tg_set_updated_at();
