-- Separate CONTENT ENTRY access. Never give data-entry people STEP admin privileges.
create table if not exists public.step_content_contributors(
 user_id uuid primary key references auth.users(id) on delete cascade,
 granted_by uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
alter table public.step_content_contributors enable row level security;
revoke all on public.step_content_contributors from public,anon,authenticated;

create table if not exists public.step_question_intake(
 id uuid primary key default gen_random_uuid(),
 axis_code text not null check(axis_code in ('grammar','writing-analysis','reading-comprehension','listening')),
 target_code text not null check(length(target_code) between 3 and 120),
 part_index integer not null check(part_index between 0 and 100),
 question_text text not null check(length(question_text) between 10 and 2000),
 options jsonb not null check(jsonb_typeof(options)='object' and options ?& array['A','B','C','D']),
 proposed_correct text not null check(proposed_correct in ('A','B','C','D')),
 explanation_ar text not null check(length(explanation_ar) between 8 and 2500),
 wrong_reasons jsonb not null check(jsonb_typeof(wrong_reasons)='object'),
 source_reference text not null check(length(source_reference) between 3 and 500),
 origin_kind text not null check(origin_kind in ('original','simulated','authored')),
 status text not null default 'pending_review'
   check(status in ('pending_review','approved','rejected','transferred')),
 review_note text not null default '',
 created_by uuid not null references auth.users(id),
 reviewed_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 reviewed_at timestamptz,
 transferred_at timestamptz,
 transferred_question_id text
);
create index if not exists step_question_intake_review_order on public.step_question_intake(status,created_at desc);
create index if not exists step_question_intake_author_order on public.step_question_intake(created_by,created_at desc);
create unique index if not exists step_question_intake_active_fingerprint
 on public.step_question_intake(axis_code,target_code,lower(btrim(question_text)))
 where status<>'rejected';
alter table public.step_question_intake enable row level security;
revoke all on public.step_question_intake from public,anon,authenticated;

create schema if not exists step_content_internal;
revoke all on schema step_content_internal from public,anon;
grant usage on schema step_content_internal to authenticated;

create or replace function step_content_internal.handle_intake(p_action text,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path=''
as $code$
declare
 v_actor uuid:=auth.uid(); v_owner boolean; v_contributor boolean;
 v_data jsonb:=coalesce(p_payload,'{}'::jsonb);
 v_rows jsonb; v_row jsonb; v_options jsonb; v_wrong jsonb;
 v_axis text; v_target text; v_question text; v_exp text; v_correct text;
 v_source text; v_origin text; v_part int; v_key text; v_item public.step_question_intake%rowtype;
 v_count int:=0; v_skipped int:=0; v_username text; v_uid uuid;
 v_filter text; v_before timestamptz; v_before_id uuid; v_cursor jsonb;
 v_passage public.step_reading_passages%rowtype;
 v_bank jsonb; v_draft_id text; v_status text; v_note text;
begin
 if v_actor is null then raise exception 'سجّل الدخول الأول' using errcode='42501'; end if;
 select exists(select 1 from public.step_admin_accounts where user_id=v_actor and role='owner')
 into v_owner;
 select exists(select 1 from public.step_content_contributors where user_id=v_actor)
 into v_contributor;
 if not v_owner and not v_contributor then
  raise exception 'محتاج صلاحية مدخل محتوى من صاحب المنصة' using errcode='42501';
 end if;
 if length(v_data::text)>180000 then raise exception 'حجم الدفعة أكبر من المسموح' using errcode='22023';end if;

 if p_action='catalog' then
  return jsonb_build_object(
   'role',case when v_owner then 'owner' else 'contributor' end,
   'courses',coalesce((select jsonb_agg(jsonb_build_object('axis',i.axis_code,'code',i.legacy_course_code,
      'title',i.title_ar,'sections',jsonb_array_length(b.payload->'sections')))
     from public.step_curriculum_indicators i
     join public.step_private_course_banks b on b.course_code=i.legacy_course_code
     where i.axis_code in ('grammar','writing-analysis') and i.status in ('published','draft')), '[]'::jsonb),
   'passages',coalesce((select jsonb_agg(jsonb_build_object('axis','reading-comprehension','code',slug,
      'title',title_ar,'sections',jsonb_array_length(paragraphs),'status',status))
      from public.step_reading_passages where status in ('draft','approved')),'[]'::jsonb),
   'clips',coalesce((select jsonb_agg(jsonb_build_object('axis','listening','code',sample_code,
      'title',title,'sections',1)) from public.step_listening_clips
      where review_state='approved' and sample_code is not null),'[]'::jsonb));
 end if;

 if p_action='list' then
  v_filter:=coalesce(v_data->>'status','all');
  if v_filter not in ('all','pending_review','approved','rejected','transferred') then
   raise exception 'حالة فلترة غير صحيحة' using errcode='22023';end if;
  if v_data ? 'before_at' or v_data ? 'before_id' then
   if coalesce(v_data->>'before_id','') !~*
    '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or
    coalesce(v_data->>'before_at','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T' then
    raise exception 'مؤشر الصفحة غير صحيح' using errcode='22023';end if;
   v_before:=(v_data->>'before_at')::timestamptz;
   v_before_id:=(v_data->>'before_id')::uuid;
  end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc,x.id desc),'[]'::jsonb)
   into v_rows from (
    select q.id,q.axis_code,q.target_code,q.part_index,q.question_text,
     q.options,q.proposed_correct,q.explanation_ar,q.wrong_reasons,q.source_reference,
     q.origin_kind,q.status,q.review_note,q.created_at,q.created_by,q.transferred_question_id
    from public.step_question_intake q
    where (v_owner or q.created_by=v_actor)
      and (v_filter='all' or q.status=v_filter)
      and (v_before is null or (q.created_at,q.id)<(v_before,v_before_id))
    order by q.created_at desc,q.id desc limit 101) x;
  if jsonb_array_length(v_rows)>100 then
   v_cursor:=jsonb_build_object('before_at',v_rows->99->>'created_at',
    'before_id',v_rows->99->>'id');
   select jsonb_agg(value order by ordinality) into v_rows
    from jsonb_array_elements(v_rows) with ordinality where ordinality<=100;
  else
   v_cursor:=null;
  end if;
  return jsonb_build_object('role',case when v_owner then 'owner' else 'contributor' end,
   'items',v_rows,'next',v_cursor);
 end if;

 if p_action='contributors' then
  if not v_owner then raise exception 'إدارة المدخلين لصاحب المنصة فقط' using errcode='42501';end if;
  return jsonb_build_object('contributors',coalesce((select jsonb_agg(
    jsonb_build_object('user_id',c.user_id,'username',p.username,'created_at',c.created_at))
    from public.step_content_contributors c
    left join public.step_student_profiles p on p.user_id=c.user_id),'[]'::jsonb));
 end if;
 if p_action in ('grant','revoke') then
  if not v_owner then raise exception 'إدارة المدخلين لصاحب المنصة فقط' using errcode='42501';end if;
  v_username:=btrim(coalesce(v_data->>'username',''));
  if length(v_username) not between 3 and 100 then
   raise exception 'أدخل اسم مستخدم مسجّل بالمنصة' using errcode='22023';end if;
  select user_id into v_uid from public.step_student_profiles
   where lower(username)=lower(v_username) and is_active=true;
  if v_uid is null then raise exception 'الحساب غير موجود أو غير نشط' using errcode='22023';end if;
  if exists(select 1 from public.step_admin_accounts where user_id=v_uid) then
    raise exception 'حسابات الأدمن تُدار منفصلة عن صلاحية الداتا انتري' using errcode='22023';end if;
  if p_action='grant' then
   insert into public.step_content_contributors(user_id,granted_by)
    values(v_uid,v_actor) on conflict(user_id) do nothing;
  else
   delete from public.step_content_contributors where user_id=v_uid;
  end if;
  return jsonb_build_object('saved',true,'username',v_username,'access',p_action);
 end if;

 if p_action='submit_batch' then
  v_rows:=v_data->'items';
  if jsonb_typeof(v_rows) is distinct from 'array' then
   raise exception 'قدّم مجموعة أسئلة في items' using errcode='22023';end if;
  if jsonb_array_length(v_rows) not between 1 and 30 then
   raise exception 'الدفعة من 1 إلى 30 سؤالًا' using errcode='22023';end if;
  for v_row in select value from jsonb_array_elements(v_rows) loop
   v_axis:=v_row->>'axis';v_target:=btrim(coalesce(v_row->>'target',''));
   v_question:=btrim(coalesce(v_row->>'question',''));
   v_exp:=btrim(coalesce(v_row->>'explanation_ar',''));
   v_source:=btrim(coalesce(v_row->>'source_reference',''));
   v_origin:=v_row->>'origin_kind';v_correct:=v_row->>'correct';
   v_options:=v_row->'options';v_wrong:=v_row->'wrong_reasons';
   if coalesce(v_row->>'part_index','') !~ '^[0-9]{1,3}$' then
    raise exception 'رقم المرحلة/الفقرة غير صحيح' using errcode='22023';end if;
   v_part:=(v_row->>'part_index')::int;
   if v_axis not in ('grammar','writing-analysis','reading-comprehension','listening') or
      length(v_target) not between 3 and 120 or
      length(v_question) not between 10 and 2000 or
      length(v_exp) not between 8 and 2500 or
      length(v_source) not between 3 and 500 or
      v_origin not in ('original','simulated','authored') or
      v_correct not in ('A','B','C','D') or
      jsonb_typeof(v_options) is distinct from 'object' or
      jsonb_typeof(v_wrong) is distinct from 'object' or
      v_part not between 0 and 100 then
    raise exception 'سؤال غير مكتمل: راجع النص والمصدر والتصنيف والتفسير' using errcode='22023';
   end if;
   for v_key in select unnest(array['A','B','C','D']) loop
    if length(btrim(coalesce(v_options->>v_key,''))) not between 1 and 500 then
     raise exception 'الاختيارات الأربعة مطلوبة' using errcode='22023';end if;
    if v_key<>v_correct and length(btrim(coalesce(v_wrong->>v_key,''))) not between 8 and 1000 then
     raise exception 'مطلوب سبب واضح لخطأ كل بديل غير صحيح' using errcode='22023';end if;
   end loop;
   if v_wrong ? v_correct then
    raise exception 'لا تضع تفسير خطأ تحت الاختيار الصحيح' using errcode='22023';end if;
   if v_axis in ('grammar','writing-analysis') then
    select b.payload into v_bank from public.step_curriculum_indicators i
     join public.step_private_course_banks b on b.course_code=i.legacy_course_code
     where i.axis_code=v_axis and i.legacy_course_code=v_target
       and i.status in ('published','draft') limit 1;
    if v_bank is null or v_part>=jsonb_array_length(v_bank->'sections') then
     raise exception 'الدرس أو المرحلة غير موجودين في المنهج' using errcode='22023';end if;
   elsif v_axis='reading-comprehension' then
    select * into v_passage from public.step_reading_passages
      where slug=v_target and status in ('draft','approved');
    if not found or v_part not between 1 and jsonb_array_length(v_passage.paragraphs) then
     raise exception 'القطعة أو رقم الفقرة غير صحيح' using errcode='22023';end if;
   else
    if v_part<>0 or not exists(select 1 from public.step_listening_clips
       where sample_code=v_target and review_state='approved') then
     raise exception 'الاستماع يحتاج تسجيلًا معتمدًا ورقم مرحلة 0' using errcode='22023';end if;
   end if;
   if exists(select 1 from public.step_question_intake where axis_code=v_axis
     and target_code=v_target and lower(btrim(question_text))=lower(v_question)
     and status<>'rejected') then
    v_skipped:=v_skipped+1;continue;
   end if;
   insert into public.step_question_intake
    (axis_code,target_code,part_index,question_text,options,proposed_correct,
     explanation_ar,wrong_reasons,source_reference,origin_kind,status,created_by)
   values(v_axis,v_target,v_part,v_question,
    jsonb_build_object('A',btrim(v_options->>'A'),'B',btrim(v_options->>'B'),
     'C',btrim(v_options->>'C'),'D',btrim(v_options->>'D')),
    v_correct,v_exp,v_wrong,v_source,v_origin,'pending_review',v_actor);
   v_count:=v_count+1;
   v_bank:=null;
  end loop;
  return jsonb_build_object('saved',v_count,'duplicates_skipped',v_skipped,'status','pending_review');
 end if;

 if p_action in ('approve','reject','transfer') then
  if not v_owner then raise exception 'المراجعة والنشر من صلاحيات صاحب المنصة فقط' using errcode='42501';end if;
  if coalesce(v_data->>'id','') !~*
    '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
   raise exception 'معرّف السؤال غير صالح' using errcode='22023';end if;
  select * into v_item from public.step_question_intake
    where id=(v_data->>'id')::uuid for update;
  if not found then raise exception 'السؤال مش موجود' using errcode='22023';end if;
  if p_action='approve' or p_action='reject' then
   if v_item.status<>'pending_review' then
    raise exception 'السؤال اتراجع بالفعل؛ أضف نسخة جديدة للتعديل' using errcode='22023';end if;
   v_note:=btrim(coalesce(v_data->>'note',''));
   if length(v_note)<8 or length(v_note)>1200 then
    raise exception 'سجل سبب المراجعة (8 أحرف على الأقل)' using errcode='22023';end if;
   v_status:=case when p_action='approve' then 'approved' else 'rejected' end;
   update public.step_question_intake set status=v_status,review_note=v_note,
    reviewed_by=v_actor,reviewed_at=now() where id=v_item.id;
   return jsonb_build_object('saved',true,'status',v_status);
  end if;
  if v_item.status<>'approved' then
   raise exception 'اعتمد السؤال أولًا بعد مراجعة المصدر' using errcode='22023';end if;
  if v_item.axis_code in ('grammar','writing-analysis') then
   select b.payload into v_bank from public.step_curriculum_indicators i
     join public.step_private_course_banks b on b.course_code=i.legacy_course_code
     where i.legacy_course_code=v_item.target_code and i.axis_code=v_item.axis_code
      and i.status in ('published','draft') limit 1;
   if v_bank is null or v_item.part_index>=jsonb_array_length(v_bank->'sections') then
    raise exception 'الدرس لم يعد صالحًا للإدخال' using errcode='22023';end if;
   v_draft_id:='STEP-NEW-'||gen_random_uuid()::text;
   insert into public.step_question_editor_drafts
    (id,course_code,draft,updated_at,updated_by)
   values(v_draft_id,v_item.target_code,
    jsonb_build_object('part_index',v_item.part_index,'text',v_item.question_text,
     'options',v_item.options,'correct',v_item.proposed_correct,
     'explanation',v_item.explanation_ar,'wrongReasons',v_item.wrong_reasons),
    now(),v_actor);
  elsif v_item.axis_code='reading-comprehension' then
   select * into v_passage from public.step_reading_passages
    where slug=v_item.target_code for update;
   if not found or v_passage.status<>'draft' then
    raise exception 'إضافة أسئلة القراءة تحتاج قطعة مسودة؛ منشور الطلاب لا يتغير' using errcode='22023';end if;
   if exists(select 1 from public.step_reading_attempts where passage_id=v_passage.id) then
    raise exception 'القطعة مرتبطة بدرجات، ولا يمكن تعديلها' using errcode='22023';end if;
   select coalesce(max(position),0)+1 into v_part
      from public.step_reading_items where passage_id=v_passage.id;
   if v_part>50 then raise exception 'وصلت القطعة للحد الأقصى من الأسئلة' using errcode='22023';end if;
   insert into public.step_reading_items(passage_id,position,question_text,options,
     correct_choice,explanation_ar,paragraph_number,review_state,editorial_notes)
   values(v_passage.id,v_part,v_item.question_text,v_item.options,v_item.proposed_correct,
     v_item.explanation_ar,v_item.part_index,'needs_review',
     left('مدخل محتوى · '||v_item.source_reference||' · '||v_item.review_note,1000))
   returning id::text into v_draft_id;
  else
   raise exception 'أسئلة الاستماع تظل في قائمة المراجعة لحين ربطها باختبار التسجيل المعتمد' using errcode='22023';
  end if;
  update public.step_question_intake set status='transferred',transferred_question_id=v_draft_id,
    transferred_at=now() where id=v_item.id;
  return jsonb_build_object('saved',true,'status','transferred',
    'draft_question_id',v_draft_id,'published',false);
 end if;
 raise exception 'عملية غير معروفة' using errcode='22023';
end $code$;

revoke all on function step_content_internal.handle_intake(text,jsonb) from public,anon,authenticated;
grant execute on function step_content_internal.handle_intake(text,jsonb) to authenticated;

create or replace function public.step_content_intake(p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language sql security invoker set search_path=''
as $entry$
 select step_content_internal.handle_intake(p_action,p_payload);
$entry$;
revoke all on function public.step_content_intake(text,jsonb) from public,anon,authenticated;
grant execute on function public.step_content_intake(text,jsonb) to authenticated;
