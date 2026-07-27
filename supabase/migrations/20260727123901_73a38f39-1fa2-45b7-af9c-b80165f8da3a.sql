CREATE TABLE public.debts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  icon text NOT NULL DEFAULT 'wallet',
  color text NOT NULL DEFAULT '#540BD3',
  total_amount numeric NOT NULL DEFAULT 0,
  installments_total integer NOT NULL DEFAULT 1,
  bank_id uuid REFERENCES public.banks(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.debts TO authenticated;
GRANT ALL ON public.debts TO service_role;

ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "debts_self_all" ON public.debts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER debts_set_updated_at BEFORE UPDATE ON public.debts
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.debt_installments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  debt_id uuid NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  number integer NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  paid boolean NOT NULL DEFAULT false,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.debt_installments TO authenticated;
GRANT ALL ON public.debt_installments TO service_role;

ALTER TABLE public.debt_installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "debt_installments_self_all" ON public.debt_installments FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER debt_installments_set_updated_at BEFORE UPDATE ON public.debt_installments
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX debt_installments_debt_id_idx ON public.debt_installments(debt_id);
CREATE INDEX debts_user_id_idx ON public.debts(user_id);