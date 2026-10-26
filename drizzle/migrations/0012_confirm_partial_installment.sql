CREATE OR REPLACE FUNCTION public.confirm_partial_installment(p_kind text, p_record uuid, p_installment uuid, p_amount numeric, p_date date, p_expected jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid(); v_parent text; v_rows text; v_fk text; v_flag text;
  v_record record; v_inst record; v_next record; v_snapshot jsonb; v_count integer; v_remainder bigint; v_share bigint; v_extra bigint; v_index integer := 0;
  v_tx uuid; v_new_number integer; v_new_date date; v_bank jsonb; v_result jsonb; v_installments jsonb;
BEGIN
  IF v_uid IS NULL OR p_kind NOT IN ('debt', 'receivable') OR p_date IS NULL OR p_date <> (now() AT TIME ZONE 'America/Sao_Paulo')::date THEN RAISE EXCEPTION 'Operação inválida'; END IF;
  v_parent := CASE WHEN p_kind = 'debt' THEN 'debts' ELSE 'receivables' END;
  v_rows := CASE WHEN p_kind = 'debt' THEN 'debt_installments' ELSE 'receivable_installments' END;
  v_fk := CASE WHEN p_kind = 'debt' THEN 'debt_id' ELSE 'receivable_id' END;
  v_flag := CASE WHEN p_kind = 'debt' THEN 'paid' ELSE 'received' END;
  EXECUTE format('SELECT * FROM public.%I WHERE id=$1 AND user_id=$2 FOR UPDATE', v_parent) INTO v_record USING p_record, v_uid;
  IF v_record.id IS NULL OR v_record.archived THEN RAISE EXCEPTION 'Registro não disponível'; END IF;
  EXECUTE format('SELECT id FROM public.%I WHERE %I=$1 AND user_id=$2 ORDER BY number FOR UPDATE', v_rows, v_fk) USING p_record, v_uid;
  EXECUTE format('SELECT jsonb_agg(jsonb_build_object(''id'',id,''number'',number,''amount'',amount,''dueDate'',due_date,''settled'',%I) ORDER BY number) FROM public.%I WHERE %I=$1 AND user_id=$2', v_flag, v_rows, v_fk) INTO v_snapshot USING p_record, v_uid;
  IF v_snapshot IS DISTINCT FROM p_expected THEN RAISE EXCEPTION 'As parcelas mudaram. Reabra a projeção.'; END IF;
  EXECUTE format('SELECT id, number, amount, due_date, %I AS settled, transaction_id FROM public.%I WHERE id=$1 AND %I=$2 AND user_id=$3', v_flag, v_rows, v_fk) INTO v_inst USING p_installment, p_record, v_uid;
  IF v_inst.id IS NULL OR v_inst.settled OR v_inst.transaction_id IS NOT NULL OR p_amount IS NULL OR p_amount::text IN ('NaN','Infinity','-Infinity') OR p_amount <> round(p_amount,2) OR p_amount <= 0 OR p_amount >= v_inst.amount THEN RAISE EXCEPTION 'Valor parcial inválido'; END IF;
  IF v_record.bank_id IS NOT NULL THEN
    PERFORM id FROM public.banks WHERE id=v_record.bank_id AND user_id=v_uid FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Banco não disponível'; END IF;
  END IF;
  v_remainder := round((v_inst.amount-p_amount)*100)::bigint;
  EXECUTE format('SELECT count(*) FROM public.%I WHERE %I=$1 AND user_id=$2 AND number>$3 AND NOT %I', v_rows,v_fk,v_flag) INTO v_count USING p_record,v_uid,v_inst.number;
  IF v_count > 0 THEN
    v_share := v_remainder/v_count; v_extra := v_remainder%v_count;
    FOR v_next IN EXECUTE format('SELECT id FROM public.%I WHERE %I=$1 AND user_id=$2 AND number>$3 AND NOT %I ORDER BY number',v_rows,v_fk,v_flag) USING p_record,v_uid,v_inst.number LOOP
      EXECUTE format('UPDATE public.%I SET amount=amount+$1 WHERE id=$2 AND user_id=$3',v_rows) USING (v_share+CASE WHEN v_index<v_extra THEN 1 ELSE 0 END)::numeric/100,v_next.id,v_uid;
      v_index := v_index+1;
    END LOOP;
  ELSE
    EXECUTE format('SELECT number,due_date FROM public.%I WHERE %I=$1 AND user_id=$2 ORDER BY number DESC LIMIT 1',v_rows,v_fk) INTO v_next USING p_record,v_uid;
    v_new_number := v_next.number+1;
    v_new_date := (v_next.due_date + interval '1 month')::date;
    EXECUTE format('INSERT INTO public.%I(user_id,%I,number,amount,due_date,%I) VALUES($1,$2,$3,$4,$5,false)',v_rows,v_fk,v_flag) USING v_uid,p_record,v_new_number,v_remainder::numeric/100,v_new_date;
    EXECUTE format('UPDATE public.%I SET installments_total=installments_total+1 WHERE id=$1 AND user_id=$2',v_parent) USING p_record,v_uid;
  END IF;
  INSERT INTO public.transactions(user_id,type,amount,description,date,category_id,bank_id,essential,payment_method,installment_no,installment_total,tag,applied_to_balance)
  VALUES(v_uid,CASE WHEN p_kind='debt' THEN 'expense' ELSE 'income' END,p_amount,v_record.name || ' · parcial (' || v_inst.number || '/' || (v_record.installments_total+CASE WHEN v_count=0 THEN 1 ELSE 0 END) || ')',p_date,v_record.category_id,v_record.bank_id,CASE WHEN p_kind='debt' THEN 'essential' ELSE NULL END,CASE WHEN p_kind='debt' AND v_record.bank_id IS NOT NULL THEN 'debit' WHEN p_kind='receivable' AND v_record.bank_id IS NULL THEN 'cash' ELSE NULL END,v_inst.number,v_record.installments_total+CASE WHEN v_count=0 THEN 1 ELSE 0 END,CASE WHEN p_kind='debt' THEN '__dv__:' ELSE '__rc__:' END || p_record::text,true) RETURNING id INTO v_tx;
  EXECUTE format('UPDATE public.%I SET amount=$1,%I=true,due_date=$2,transaction_id=$3 WHERE id=$4 AND user_id=$5',v_rows,v_flag) USING p_amount,p_date,v_tx,p_installment,v_uid;
  IF v_record.bank_id IS NOT NULL THEN
    UPDATE public.banks SET account_balance=account_balance+CASE WHEN p_kind='debt' THEN -p_amount ELSE p_amount END WHERE id=v_record.bank_id AND user_id=v_uid RETURNING to_jsonb(banks.*) INTO v_bank;
  END IF;
  EXECUTE format('SELECT to_jsonb(t.*) FROM public.%I t WHERE id=$1 AND user_id=$2',v_parent) INTO v_result USING p_record,v_uid;
  EXECUTE format('SELECT jsonb_agg(to_jsonb(t.*) ORDER BY number) FROM public.%I t WHERE %I=$1 AND user_id=$2',v_rows,v_fk) INTO v_installments USING p_record,v_uid;
  RETURN jsonb_build_object('record',v_result,'installments',v_installments,'transaction',(SELECT to_jsonb(t.*) FROM public.transactions t WHERE id=v_tx AND user_id=v_uid),'bank',v_bank);
END;
$$;
REVOKE ALL ON FUNCTION public.confirm_partial_installment(text,uuid,uuid,numeric,date,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_partial_installment(text,uuid,uuid,numeric,date,jsonb) TO authenticated;