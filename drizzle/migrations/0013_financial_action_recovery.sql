CREATE OR REPLACE FUNCTION public.financial_recovery_snapshot()
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE t text; result jsonb := '{}'::jsonb; rows jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  FOREACH t IN ARRAY ARRAY['categories','cards','banks','subscriptions','projects','debts','receivables','transactions','project_expenses','project_goals','debt_installments','receivable_installments','subscription_usage_logs','baby_expenses','baby_savings'] LOOP
    EXECUTE format('SELECT coalesce(jsonb_agg(to_jsonb(r)), ''[]''::jsonb) FROM public.%I r WHERE user_id = $1', t) INTO rows USING auth.uid();
    result := result || jsonb_build_object(t, rows);
  END LOOP;
  SELECT coalesce(jsonb_agg(jsonb_build_object('id', id, 'cash_amount', cash_amount)), '[]'::jsonb) INTO rows FROM public.profiles WHERE id = auth.uid();
  RETURN result || jsonb_build_object('profiles', rows);
END $$;
REVOKE ALL ON FUNCTION public.financial_recovery_snapshot() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.financial_recovery_snapshot() TO authenticated;

CREATE OR REPLACE FUNCTION public.restore_financial_action(p_changes jsonb)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE c jsonb; t text; expected jsonb; target jsonb; current_row jsonb; rid uuid; cols text; table_order text[] := ARRAY['categories','cards','banks','subscriptions','projects','debts','receivables','transactions','project_expenses','project_goals','debt_installments','receivable_installments','subscription_usage_logs','baby_expenses','baby_savings','profiles'];
BEGIN
  IF auth.uid() IS NULL OR jsonb_typeof(p_changes) <> 'array' THEN RAISE EXCEPTION 'Invalid recovery request'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));
  -- Validate every affected row before any write; never overwrite subsequent edits.
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
  -- Remove children before parents (redo of a deletion).
  FOREACH t IN ARRAY array_reverse_placeholder() LOOP END LOOP;
END $$;