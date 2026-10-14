CREATE TABLE public.baby_savings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  month text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.baby_savings TO authenticated;
GRANT ALL ON public.baby_savings TO service_role;
ALTER TABLE public.baby_savings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own baby_savings" ON public.baby_savings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.subscription_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  level text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subscription_id, week_start)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscription_usage_logs TO authenticated;
GRANT ALL ON public.subscription_usage_logs TO service_role;
ALTER TABLE public.subscription_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sub usage" ON public.subscription_usage_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);