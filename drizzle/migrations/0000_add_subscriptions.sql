CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  first_charge_date date NOT NULL,
  recurrence_months integer NOT NULL DEFAULT 1,
  color text NOT NULL DEFAULT '#E50914',
  icon text NOT NULL DEFAULT 'sparkles',
  essential text NOT NULL DEFAULT 'non_essential',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscriptions_recurrence_positive CHECK (recurrence_months > 0),
  CONSTRAINT subscriptions_amount_nonnegative CHECK (amount >= 0),
  CONSTRAINT subscriptions_essential_valid CHECK (essential IN ('essential', 'non_essential'))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY subscriptions_self_all ON public.subscriptions
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
CREATE INDEX subscriptions_user_id_idx ON public.subscriptions(user_id);
CREATE TRIGGER subscriptions_set_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

ALTER TABLE public.transactions ADD COLUMN subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL;
CREATE INDEX transactions_subscription_id_idx ON public.transactions(subscription_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  new_code text;
begin
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
    (new.id, 'Assinaturas',     '#E50914', 'expense', 'tv'),
    (new.id, 'Salário',         '#2BD9A1', 'income',  'cash'),
    (new.id, 'Renda extra',     '#22C3CC', 'income',  'money');
  return new;
end;
$function$;