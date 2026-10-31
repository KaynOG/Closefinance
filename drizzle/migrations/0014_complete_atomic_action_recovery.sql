CREATE OR REPLACE FUNCTION public.restore_financial_action(p_changes jsonb)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE c jsonb; t text; expected jsonb; target jsonb; current_row jsonb; rid uuid; cols text; n integer; table_order text[] := ARRAY['categories','cards','banks','subscriptions','projects','debts','receivables','transactions','project_expenses','project_goals','debt_installments','receivable_installments','subscription_usage_logs','baby_expenses','baby_savings','profiles'];
BEGIN
  IF auth.uid() IS NULL OR jsonb_typeof(p_changes) <> 'array' THEN RAISE EXCEPTION 'Invalid recovery request'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));
  FOR c IN SELECT value FROM jsonb_array_elements(p_changes) LOOP
    t := c->>'table'; expected := nullif(c->'expected', 'null'::jsonb); target := nullif(c->'target', 'null'::jsonb);
    IF NOT (t = ANY(table_order)) OR (target IS NULL AND expected IS NULL) THEN RAISE EXCEPTION 'Invalid recovery table'; END IF;
    rid := coalesce(target->>'id', expected->>'id')::uuid;
    IF expected IS NOT NULL AND (expected->>'id')::uuid <> rid THEN RAISE EXCEPTION 'Invalid recovery identity'; END IF;
    IF t = 'profiles' THEN
      IF rid <> auth.uid() OR target IS NULL OR expected IS NULL OR (target - ARRAY['id','cash_amount']) <> '{}'::jsonb THEN RAISE EXCEPTION 'Invalid profile recovery'; END IF;
      SELECT jsonb_build_object('id', id, 'cash_amount', cash_amount) INTO current_row FROM public.profiles WHERE id = rid FOR UPDATE;
    ELSE
      IF (target IS NOT NULL AND (target->>'user_id')::uuid IS DISTINCT FROM auth.uid()) OR (expected IS NOT NULL AND (expected->>'user_id')::uuid IS DISTINCT FROM auth.uid()) THEN RAISE EXCEPTION 'Invalid owner'; END IF;
      EXECUTE format('SELECT to_jsonb(r) FROM public.%I r WHERE id = $1 AND user_id = $2 FOR UPDATE', t) INTO current_row USING rid, auth.uid();
    END IF;
    IF (current_row - 'updated_at') IS DISTINCT FROM (expected - 'updated_at') THEN RAISE EXCEPTION 'Os dados mudaram depois desta ação. A recuperação foi cancelada para preservar suas alterações.'; END IF;
  END LOOP;
  FOR n IN REVERSE array_length(table_order, 1)..1 LOOP
    t := table_order[n];
    FOR c IN SELECT value FROM jsonb_array_elements(p_changes) WHERE value->>'table' = t AND value->'target' = 'null'::jsonb LOOP
      EXECUTE format('DELETE FROM public.%I WHERE id = $1 AND user_id = $2', t) USING (c->'expected'->>'id')::uuid, auth.uid();
    END LOOP;
  END LOOP;
  FOREACH t IN ARRAY table_order LOOP
    FOR c IN SELECT value FROM jsonb_array_elements(p_changes) WHERE value->>'table' = t AND value->'target' <> 'null'::jsonb LOOP
      target := c->'target';
      IF t = 'profiles' THEN
        UPDATE public.profiles SET cash_amount = (target->>'cash_amount')::numeric WHERE id = auth.uid();
      ELSE
        SELECT string_agg(format('%I = EXCLUDED.%I', column_name, column_name), ', ') INTO cols FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name NOT IN ('id','user_id','updated_at');
        EXECUTE format('INSERT INTO public.%1$I SELECT (jsonb_populate_record(NULL::public.%1$I, $1)).* ON CONFLICT (id) DO UPDATE SET %2$s', t, cols) USING target;
      END IF;
    END LOOP;
  END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.restore_financial_action(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.restore_financial_action(jsonb) TO authenticated;