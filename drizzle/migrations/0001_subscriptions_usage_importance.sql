ALTER TABLE public.subscriptions ADD COLUMN usage_frequency text not null default 'monthly';
ALTER TABLE public.subscriptions ADD COLUMN importance text not null default 'important';