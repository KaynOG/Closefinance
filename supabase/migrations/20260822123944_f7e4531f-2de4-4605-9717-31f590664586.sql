CREATE TABLE public.receivables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text NOT NULL DEFAULT 'wallet',
  color text NOT NULL DEFAULT '#2BD9A1',
  total_amount numeric NOT NULL DEFAULT 0,
  installments_total integer NOT NULL DEFAULT 1,
  bank_id uuid REFERENCES public.banks(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.receivables TO authenticated;
GRANT ALL ON public.receivables TO service_role;

ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;

CREATE POLICY receivables_self_all ON public.receivables FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER receivables_set_updated_at BEFORE UPDATE ON public.receivables
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.receivable_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receivable_id uuid NOT NULL REFERENCES public.receivables(id) ON DELETE CASCADE,
  number integer NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  received boolean NOT NULL DEFAULT false,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.receivable_installments TO authenticated;
GRANT ALL ON public.receivable_installments TO service_role;

ALTER TABLE public.receivable_installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY receivable_installments_self_all ON public.receivable_installments FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER receivable_installments_set_updated_at BEFORE UPDATE ON public.receivable_installments
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX idx_receivable_installments_receivable ON public.receivable_installments(receivable_id);