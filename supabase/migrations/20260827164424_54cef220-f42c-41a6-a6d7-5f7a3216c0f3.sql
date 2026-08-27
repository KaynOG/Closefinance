WITH ranked AS (
  SELECT id, user_id, row_number() OVER (PARTITION BY user_id ORDER BY created_at, id) AS rn,
         first_value(id) OVER (PARTITION BY user_id ORDER BY created_at, id) AS keep_id
  FROM public.categories
  WHERE name = 'Adiantamento/Pagamento de fatura'
), dupes AS (
  SELECT id, keep_id FROM ranked WHERE rn > 1
)
UPDATE public.transactions t SET category_id = d.keep_id
FROM dupes d WHERE t.category_id = d.id;

WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY user_id ORDER BY created_at, id) AS rn
  FROM public.categories
  WHERE name = 'Adiantamento/Pagamento de fatura'
)
DELETE FROM public.categories c USING ranked r
WHERE c.id = r.id AND r.rn > 1;