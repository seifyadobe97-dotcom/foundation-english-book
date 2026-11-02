-- STEP WITH SEIFY: independent owner-only Reading passage authoring.
-- Existing published passages and historic grades remain untouched.
create or replace function step_reading_internal.admin_manage(
 p_action text, p_payload jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path=''
as $reading_admin$
declare
 v_uid uuid := auth.uid();
 v_data jsonb := coalesce(p_payload,'{}'::jsonb);
 v_passage public.step_reading_passages%rowtype;
 v_id uuid;
 v_paragraphs jsonb;
 v_options jsonb;
 v_title_en text;
 v_title_ar text;
 v_source text;
 v_question text;
 v_explanation text;
 v_correct text;
 v_slug text;
 v_note text;
 v_paragraph_number int;
 v_position int;
 v_count int;
 v_pending int;
 v_key text;
begin
 if v_uid is null or not exists(
  select 1 from public.step_admin_accounts where user_id=v_uid and role='owner'
 ) then raise exception 'إدارة قطع القراءة متاحة لصاحب المنصة فقط'
  using errcode='42501'; end if;
 if p_action not in ('create_passage','update_passage','add_question','publish_passage','archive_passage') then
  raise exception 'عملية غير معروفة' using errcode='22023'; end if;
 if length(v_data::text)>180000 then
  raise exception 'حجم البيانات أكبر من المسموح' using errcode='22023'; end if;

 if p_action in ('create_passage','update_passage') then
  v_title_en:=btrim(coalesce(v_data->>'title_en',''));
  v_title_ar:=btrim(coalesce(v_data->>'title_ar',''));
  v_source:=btrim(coalesce(v_data->>'source_label',''));
  v_paragraphs:=v_data->'paragraphs';
  if length(v_title_en) not between 3 and 200 or
     length(v_title_ar) not between 3 and 240 or
     length(v_source) not between 2 and 240 or
     jsonb_typeof(v_paragraphs) is distinct from 'array' then
   raise exception 'عنوان القطعة والمصدر والنص مطلوبين'
    using errcode='22023'; end if;
  if jsonb_array_length(v_paragraphs) not between 1 and 80 or
     coalesce((select bool_and(jsonb_typeof(x)='string' and
         length(btrim(x#>>'{}')) between 8 and 7500)
       from jsonb_array_elements(v_paragraphs) as x),false) is not true then
   raise exception 'قسّم القطعة إلى فقرات نصية واضحة (1 إلى 80 فقرة)'
    using errcode='22023'; end if;
  if p_action='create_passage' then
   v_slug:='reading-'||replace(gen_random_uuid()::text,'-','');
   insert into public.step_reading_passages
     (slug,title_en,title_ar,paragraphs,source_label,status)
   values(v_slug,v_title_en,v_title_ar,v_paragraphs,v_source,'draft')
   returning id into v_id;
   return jsonb_build_object('saved',true,'id',v_id,'slug',v_slug,'status','draft');
  end if;
 end if;

 if coalesce(v_data->>'id','') !~*
   '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
  raise exception 'معرّف القطعة غير صالح' using errcode='22023'; end if;
 v_id:=(v_data->>'id')::uuid;
 select * into v_passage from public.step_reading_passages
  where id=v_id for update;
 if not found then raise exception 'قطعة القراءة غير موجودة' using errcode='22023'; end if;

 if p_action='archive_passage' then
  if v_passage.status='archived' then return jsonb_build_object('saved',true,'status','archived');end if;
  update public.step_reading_passages set status='archived' where id=v_id;
  return jsonb_build_object('saved',true,'status','archived');
 end if;

 if v_passage.status<>'draft' then
  raise exception 'القطعة المنشورة لا تتعدل حفاظًا على نتائج الطلاب؛ أنشئ قطعة جديدة للمراجعة'
   using errcode='22023'; end if;
 if exists(select 1 from public.step_reading_attempts where passage_id=v_id) then
  raise exception 'القطعة مرتبطة بمحاولة محفوظة، ومش مسموح تعديلها' using errcode='22023'; end if;

 if p_action='update_passage' then
  update public.step_reading_passages
   set title_en=v_title_en,title_ar=v_title_ar,source_label=v_source,
       paragraphs=v_paragraphs
   where id=v_id;
  return jsonb_build_object('saved',true,'id',v_id,'status','draft');
 end if;

 if p_action='add_question' then
  v_question:=btrim(coalesce(v_data->>'question_text',''));
  v_explanation:=btrim(coalesce(v_data->>'explanation_ar',''));
  v_correct:=v_data->>'correct_choice';
  v_note:=left(coalesce(v_data->>'editorial_notes','Awaiting owner review'),1000);
  v_options:=v_data->'options';
  v_paragraph_number:=case when coalesce(v_data->>'paragraph_number','') ~ '^[0-9]{1,3}$'
    then (v_data->>'paragraph_number')::int else 0 end;
  if length(v_question) not between 10 and 1500 or
     length(v_explanation) not between 8 and 4000 or
     v_correct not in ('A','B','C','D') or
     jsonb_typeof(v_options) is distinct from 'object' or
     v_paragraph_number not between 1 and jsonb_array_length(v_passage.paragraphs) then
   raise exception 'راجع نص السؤال والاختيارات والإجابة والتفسير والفقرة'
    using errcode='22023';end if;
  for v_key in select unnest(array['A','B','C','D']) loop
   if length(btrim(coalesce(v_options->>v_key,''))) not between 1 and 600 then
    raise exception 'لازم تدخل الاختيارات الأربعة كاملة' using errcode='22023'; end if;
  end loop;
  v_options:=jsonb_build_object('A',btrim(v_options->>'A'),'B',btrim(v_options->>'B'),
    'C',btrim(v_options->>'C'),'D',btrim(v_options->>'D'));
  select coalesce(max(position),0)+1 into v_position
    from public.step_reading_items where passage_id=v_id;
  if v_position>50 then raise exception 'الحد الأقصى 50 سؤال لكل قطعة' using errcode='22023';end if;
  insert into public.step_reading_items
    (passage_id,position,question_text,options,correct_choice,
     explanation_ar,paragraph_number,review_state,editorial_notes)
  values (v_id,v_position,v_question,v_options,v_correct,v_explanation,
    v_paragraph_number,'needs_review',v_note);
  return jsonb_build_object('saved',true,'position',v_position,'status','needs_review');
 end if;

 if p_action='publish_passage' then
  select count(*),count(*) filter(where review_state<>'approved')
   into v_count,v_pending from public.step_reading_items where passage_id=v_id;
  if v_count=0 or v_pending>0 then
   raise exception 'اعتمد كل أسئلة القطعة الأول قبل نشرها (فيه % أسئلة للمراجعة)',v_pending
    using errcode='22023'; end if;
  update public.step_reading_passages set status='approved' where id=v_id;
  return jsonb_build_object('saved',true,'status','approved','questionCount',v_count);
 end if;
 raise exception 'عملية غير مدعومة' using errcode='22023';
end
$reading_admin$;

revoke all on function step_reading_internal.admin_manage(text,jsonb)
 from public,anon,authenticated;
grant execute on function step_reading_internal.admin_manage(text,jsonb) to authenticated;

create or replace function public.step_reading_admin(p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language sql security invoker set search_path=''
as $reading_wrapper$
select step_reading_internal.admin_manage(p_action,p_payload);
$reading_wrapper$;
revoke all on function public.step_reading_admin(text,jsonb)
 from public,anon,authenticated;
grant execute on function public.step_reading_admin(text,jsonb) to authenticated;
