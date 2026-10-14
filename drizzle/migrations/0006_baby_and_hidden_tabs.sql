ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS baby_mode boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hidden_tabs text[] NOT NULL DEFAULT '{}';

CREATE TABLE public.baby_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  essential text NOT NULL DEFAULT 'essential',
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  payment_method text NOT NULL DEFAULT 'pix',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.baby_expenses TO authenticated;
GRANT ALL ON public.baby_expenses TO service_role;
ALTER TABLE public.baby_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY baby_expenses_self_all ON public.baby_expenses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX baby_expenses_user_idx ON public.baby_expenses(user_id, date DESC);