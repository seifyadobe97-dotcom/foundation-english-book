-- STEP Reading v2: Supabase PostgREST RPC instead of the unreliable Reading Edge Function.
-- Source passages and 5 reviewed Old Birds questions remain intact; no Grammar/Writing/Listening data changed.
-- Tables keep RLS enabled and revoked direct authenticated/anon access.
create schema if not exists step_reading_internal;
revoke all on schema step_reading_internal from public, anon;
grant usage on schema step_reading_internal to authenticated;

create or replace function step_reading_internal.dispatch(p_action text, p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=''
as $reading$
declare
  v_uid uuid := auth.uid();
  v_owner boolean := false;
  v_student boolean := false;
  v_passage public.step_reading_passages%rowtype;
  v_attempt public.step_reading_attempts%rowtype;
  v_questions jsonb;
  v_result jsonb;
  v_history jsonb;
  v_reviews jsonb := '[]'::jsonb;
  v_ids uuid[];
  v_q record;
  v_input jsonb := coalesce(p_payload,'{}'::jsonb);
  v_answers jsonb;
  v_opts jsonb;
  v_pick text;
  v_slug text;
  v_mode text;
  v_n integer := 0;
  v_correct integer := 0;
  v_total integer := 0;
  v_practice integer := 0;
  v_exam integer := 0;
  v_practice_correct integer := 0;
  v_practice_total integer := 0;
  v_exam_correct integer := 0;
  v_exam_total integer := 0;
  v_due timestamptz;
  v_paragraph smallint;
  v_key text;
begin
 if v_uid is null then raise exception 'يرجى تسجيل الدخول أولاً' using errcode='28000'; end if;
 select exists(select 1 from public.step_admin_accounts where user_id=v_uid and role='owner') into v_owner;
 select exists(select 1 from public.step_student_profiles where user_id=v_uid and is_active=true) into v_student;
 if p_action in ('admin_catalog','admin_grades','admin_review') then
   if not v_owner then raise exception 'هذه الصفحة لصاحب المنصة فقط' using errcode='42501'; end if;
 elsif p_action in ('catalog','begin','submit','progress') then
   if not v_student then raise exception 'حساب الطالب غير مفعل' using errcode='42501'; end if;
 else
   raise exception 'عملية غير مدعومة' using errcode='22023';
 end if;

 if p_action='catalog' then
   select coalesce(jsonb_agg(jsonb_build_object('slug',p.slug,'title',p.title_en,'titleAr',p.title_ar,
     'seconds',p.exam_seconds,'questionCount',(select count(*) from public.step_reading_items i where i.passage_id=p.id and i.review_state='approved'))
      order by p.created_at),'[]'::jsonb)
   into v_result
   from public.step_reading_passages p where p.status='approved'
     and exists(select 1 from public.step_reading_items i where i.passage_id=p.id and i.review_state='approved');
   return jsonb_build_object('passages',v_result);
 end if;

 if p_action='admin_catalog' then
   select coalesce(jsonb_agg(to_jsonb(p)||jsonb_build_object('items',
     (select coalesce(jsonb_agg(to_jsonb(i) order by i.position),'[]'::jsonb)
      from public.step_reading_items i where i.passage_id=p.id))
      order by p.created_at),'[]'::jsonb) into v_result
   from public.step_reading_passages p;
   return jsonb_build_object('passages',v_result);
 end if;

 if p_action='begin' then
   v_slug:=v_input->>'slug'; v_mode:=v_input->>'mode';
   if v_mode not in ('practice','exam') or length(coalesce(v_slug,''))>150 then
     raise exception 'اختيار القراءة غير صحيح' using errcode='22023';
   end if;
   select * into v_passage from public.step_reading_passages
     where slug=v_slug and status='approved';
   if not found then raise exception 'قطعة القراءة غير متاحة' using errcode='22023'; end if;
   select coalesce(array_agg(i.id order by i.position),array[]::uuid[]),
     coalesce(jsonb_agg(jsonb_build_object('id',i.id,'number',i.position,'text',i.question_text,'options',i.options)
       order by i.position),'[]'::jsonb)
     into v_ids,v_questions
     from public.step_reading_items i where i.passage_id=v_passage.id and i.review_state='approved';
   if cardinality(v_ids)=0 then raise exception 'الأسئلة تحت المراجعة' using errcode='22023'; end if;
   v_due:=case when v_mode='exam' then now()+make_interval(secs=>v_passage.exam_seconds) else null end;
   insert into public.step_reading_attempts(user_id,passage_id,mode,state,due_at,item_ids)
    values(v_uid,v_passage.id,v_mode,'in_progress',v_due,v_ids) returning * into v_attempt;
   return jsonb_build_object('attemptId',v_attempt.id,'title',v_passage.title_en,
      'titleAr',v_passage.title_ar,'paragraphs',v_passage.paragraphs,'questions',v_questions,
      'mode',v_mode,'dueAt',v_due,'examSeconds',v_passage.exam_seconds);
 end if;

 if p_action='submit' then
   if coalesce(v_input->>'attemptId','') !~* '^[a-f0-9-]{36}$' then
     raise exception 'معرّف المحاولة غير صالح' using errcode='22023';
   end if;
   v_answers:=v_input->'answers';
   if jsonb_typeof(v_answers) is distinct from 'object' then
     raise exception 'اختيارات الإجابة غير صالحة' using errcode='22023';
   end if;
   select * into v_attempt from public.step_reading_attempts
    where id=(v_input->>'attemptId')::uuid and user_id=v_uid for update;
   if not found or v_attempt.state<>'in_progress' then
     raise exception 'المحاولة منتهية أو غير متاحة' using errcode='22023';
   end if;
   if v_attempt.mode='exam' and now()>v_attempt.due_at+interval '30 seconds' then
     raise exception 'انتهى وقت المحاكاة' using errcode='22023';
   end if;
   if exists(select 1 from jsonb_object_keys(v_answers) answer_key
       where not exists(select 1 from unnest(v_attempt.item_ids) x where x::text=answer_key)) then
     raise exception 'إجابة غير معروفة' using errcode='22023';
   end if;
   for v_q in select id,position,correct_choice,explanation_ar,paragraph_number
     from public.step_reading_items where id=any(v_attempt.item_ids) order by position
   loop
      v_pick:=v_answers->>(v_q.id::text);
      if v_pick is not null and v_pick not in ('A','B','C','D') then
        raise exception 'اختيار غير صالح' using errcode='22023';
      end if;
      if v_attempt.mode='practice' and v_pick is null then
        raise exception 'جاوب على كل الأسئلة قبل التصحيح' using errcode='22023';
      end if;
      v_n:=v_n+1;
      if v_pick=v_q.correct_choice then v_correct:=v_correct+1; end if;
      insert into public.step_reading_responses
         (attempt_id,item_id,selected_choice,correct_choice_snapshot,is_correct)
       values(v_attempt.id,v_q.id,v_pick,v_q.correct_choice,coalesce(v_pick=v_q.correct_choice,false));
      if v_attempt.mode='practice' then
        v_reviews:=v_reviews||jsonb_build_array(jsonb_build_object(
         'id',v_q.id,'number',v_q.position,'selected',v_pick,
         'correct',v_q.correct_choice,'isCorrect',coalesce(v_pick=v_q.correct_choice,false),
         'explanation',v_q.explanation_ar,'paragraph',v_q.paragraph_number));
      end if;
   end loop;
   if v_n<>cardinality(v_attempt.item_ids) then
     raise exception 'تغيّرت الأسئلة أثناء المحاولة' using errcode='22023';
   end if;
   update public.step_reading_attempts set state='submitted',submitted_at=now(),
      correct_count=v_correct,total_questions=v_n where id=v_attempt.id;
   v_result:=jsonb_build_object('saved',true,'correct',v_correct,'total',v_n,'mode',v_attempt.mode);
   if v_attempt.mode='practice' then v_result:=v_result||jsonb_build_object('review',v_reviews); end if;
   return v_result;
 end if;

 if p_action='progress' then
   select count(*),coalesce(sum(correct_count),0),coalesce(sum(total_questions),0),
      count(*) filter(where mode='practice'),count(*) filter(where mode='exam'),
      coalesce(sum(correct_count) filter(where mode='practice'),0),
      coalesce(sum(total_questions) filter(where mode='practice'),0),
      coalesce(sum(correct_count) filter(where mode='exam'),0),
      coalesce(sum(total_questions) filter(where mode='exam'),0)
    into v_n,v_correct,v_total,v_practice,v_exam,v_practice_correct,v_practice_total,v_exam_correct,v_exam_total
    from public.step_reading_attempts where user_id=v_uid and state='submitted';
   select coalesce(jsonb_agg(jsonb_build_object('mode',h.mode,'correct',h.correct_count,
      'total',h.total_questions,'at',h.submitted_at) order by h.submitted_at desc),'[]'::jsonb)
    into v_history from (select mode,correct_count,total_questions,submitted_at
      from public.step_reading_attempts where user_id=v_uid and state='submitted'
      order by submitted_at desc limit 20) h;
   return jsonb_build_object('completed',v_n,'correct',v_correct,'total',v_total,
      'byMode',jsonb_build_object(
        'practice',jsonb_build_object('attempts',v_practice,'correct',v_practice_correct,'total',v_practice_total),
        'exam',jsonb_build_object('attempts',v_exam,'correct',v_exam_correct,'total',v_exam_total)),
      'history',v_history);
 end if;

 if p_action='admin_grades' then
   select coalesce(jsonb_agg(row_data order by (row_data->>'username')),'[]'::jsonb)
     into v_result from (
       select jsonb_build_object('username',coalesce(sp.username,'طالب'),
         'attempts',count(*),'practice',count(*) filter(where a.mode='practice'),
         'exam',count(*) filter(where a.mode='exam'),
         'correct',coalesce(sum(a.correct_count),0),
         'total',coalesce(sum(a.total_questions),0),
         'percent',case when sum(a.total_questions)>0
                     then round(100.0*sum(a.correct_count)/sum(a.total_questions)) else 0 end) row_data
       from public.step_reading_attempts a
       left join public.step_student_profiles sp on sp.user_id=a.user_id
       where a.state='submitted' group by a.user_id,sp.username
     ) z;
   select count(*) into v_n from public.step_reading_attempts where state='submitted';
   return jsonb_build_object('students',v_result,'completed',v_n);
 end if;

 if p_action='admin_review' then
   if coalesce(v_input->>'id','') !~* '^[a-f0-9-]{36}$' then
     raise exception 'رقم السؤال غير صالح' using errcode='22023';
   end if;
   select * into v_q from public.step_reading_items
     where id=(v_input->>'id')::uuid for update;
   if not found or v_q.review_state='approved' then
     raise exception 'لا يمكن تعديل سؤال معتمد حفاظاً على نتائج الطلاب' using errcode='22023';
   end if;
   v_opts:=v_input->'options';
   v_key:=v_input->>'correct_choice';
   if jsonb_typeof(v_opts) is distinct from 'object' or v_key not in ('A','B','C','D')
     or length(trim(coalesce(v_input->>'question_text','')))<12
     or length(trim(coalesce(v_input->>'explanation_ar','')))<12 then
       raise exception 'معلومات السؤال أو الإجابة ناقصة' using errcode='22023';
   end if;
   for v_key in select unnest(array['A','B','C','D']) loop
     if length(trim(coalesce(v_opts->>v_key,'')))<1 or length(v_opts->>v_key)>600 then
       raise exception 'راجع الاختيارات الأربعة' using errcode='22023';
     end if;
   end loop;
   v_paragraph:=coalesce((v_input->>'paragraph_number')::smallint,0);
   if v_paragraph<1 or v_paragraph>100 then raise exception 'رقم الفقرة غير صالح' using errcode='22023'; end if;
   if coalesce((v_input->>'approve')::boolean,false) and v_q.position=2 and
       v_opts->>'D'='They now know what the birds looked like.' then
     raise exception 'صياغة D الأصلية في السؤال الثاني محتاجة تصحيح قبل النشر' using errcode='22023';
   end if;
   update public.step_reading_items set
     question_text=trim(v_input->>'question_text'),options=v_opts,
     correct_choice=v_input->>'correct_choice',explanation_ar=trim(v_input->>'explanation_ar'),
     paragraph_number=v_paragraph,editorial_notes=left(coalesce(v_input->>'editorial_notes',''),1000),
     review_state=case when coalesce((v_input->>'approve')::boolean,false) then 'approved' else 'needs_review' end
     where id=v_q.id;
   return jsonb_build_object('saved',true,
      'status',case when coalesce((v_input->>'approve')::boolean,false) then 'approved' else 'needs_review' end);
 end if;

 raise exception 'عملية غير مدعومة' using errcode='22023';
end
$reading$;

revoke all on function step_reading_internal.dispatch(text,jsonb) from public,anon,authenticated;
grant execute on function step_reading_internal.dispatch(text,jsonb) to authenticated;

create or replace function public.step_reading_request(p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language sql security invoker set search_path=''
as $wrapper$ select step_reading_internal.dispatch(p_action,p_payload); $wrapper$;
revoke all on function public.step_reading_request(text,jsonb) from public,anon,authenticated;
grant execute on function public.step_reading_request(text,jsonb) to authenticated;

-- Read-only and graded data remain inaccessible via direct PostgREST tables.
revoke all on public.step_reading_passages,public.step_reading_items,
 public.step_reading_attempts,public.step_reading_responses from anon,authenticated;
alter table public.step_reading_passages enable row level security;
alter table public.step_reading_items enable row level security;
alter table public.step_reading_attempts enable row level security;
alter table public.step_reading_responses enable row level security;
