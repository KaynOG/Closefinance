ALTER TABLE public.categories ADD COLUMN budget_group text;
ALTER TABLE public.categories ADD CONSTRAINT categories_budget_group_valid CHECK (budget_group IS NULL OR budget_group IN ('freedom','comfort','pleasures','knowledge','fixed','goals'));
ALTER TABLE public.profiles ADD COLUMN budget_plan jsonb NOT NULL DEFAULT '{}'::jsonb;
COMMENT ON COLUMN public.categories.budget_group IS 'User-selected group for the six-part monthly financial goals comparison.';
COMMENT ON COLUMN public.profiles.budget_plan IS 'Monthly budget percentages and user-confirmed saved/invested monthly amounts; bank balances remain cumulative stock.';