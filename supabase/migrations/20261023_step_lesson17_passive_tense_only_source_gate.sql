-- Applied on Supabase live project 2026-10-23. No copyrighted source question text, printed keys or student data here.
-- This migration is safe on existing Lesson17 drafts and is idempotent for already-converted courses.
UPDATE public.step_private_course_banks AS b
SET payload=jsonb_set(jsonb_set(jsonb_set(b.payload,
 '{sections}',jsonb_build_array('{"id":"active-vs-passive","gold":{"body":"[[Object → Subject]] + [[be بنفس الزمن + V3]]","title":"قاعدة التحويل"},"rule":["Active: Subject + Verb + Object","Passive: Object + be (tense) + V3","by + agent (optional)"],"short":"في [[Active]] الفاعل بيعمل الحدث؛ في [[Passive]] الشيء اللي وقع عليه الفعل بيبقى Subject. ننقل [[Object → Subject]]، ونحافظ على الزمن، ونستخدم [[be + V3]].","tiles":[{"icon":"1","text":"مين عمل الفعل؟","label":"Active"},{"icon":"2","text":"مين وقع عليه؟","label":"Passive"},{"icon":"3","text":"احفظ الزمن","label":"Tense"}],"title":"01 · Active vs Passive: تحويل المفعول لفاعل","visual":{"tip":"[[Object → Subject]] ثم [[be + V3]] مع الحفاظ على الزمن.","cards":[["Object","[[the email]]","يبقى Subject","1"],["Tense","[[past]]","نفس الزمن","2"],["Structure","[[was sent]]","be + V3","3"]],"extra":{"heading":"فصل الشرح عن الاختبار","paragraphs":["الأمثلة في المرحلة دي تعليمية من إعداد المدرس، ومش أسئلة أصلية من البنك.","Be Supposed To وModal Passive خارج أسئلة الدرس الحالي؛ الاختبار هنا للأزمنة فقط.","مش كل جملة تبدأ بجماد مبني للمجهول، ولا لازم نشوف by في كل جملة."]},"table":{"rows":[["Present Simple","She writes the letter.","The letter is written."],["Past Simple","She wrote the letter.","The letter was written."],["Future","She will write the letter.","The letter will be written."]],"headers":["Tense","Active","Passive"]},"title":"01 · Active vs Passive: تحويل المفعول لفاعل","detail":"في [[Active]] الفاعل بيعمل الحدث؛ في [[Passive]] الشيء اللي وقع عليه الفعل بيبقى Subject. ننقل [[Object → Subject]]، ونحافظ على الزمن، ونستخدم [[be + V3]]. مثال: [[The assistant sent the email]] ⟶ [[The email was sent]].","warning":{"why":"بعد be لازم التصريف الثالث V3.","wrong":"The reports wrote yesterday.","correct":"The reports were written yesterday."},"examples":[["مثال 1","Active: The teacher [[checks]] the answers.","المعلم بيعمل الفعل."],["مثال 2","Passive: The answers [[are checked]] by the teacher.","الإجابات جمع، فبنستخدم are + checked."],["مثال 3","Active: Sara [[wrote]] the report.","الفاعل Sara والزمن ماضي."],["مثال 4","Passive: The report [[was written]] by Sara.","المفعول بقى فاعل، والزمن فضل ماضي."]],"formulas":[["Active","Sara","wrote","the report"],["Passive","The report","was written","by Sara"]],"keywords":[["Object → Subject","نقل المفعول"],["be + V3","صيغة المجهول"],["by","اختياري"],["Tense marker","اختيار الزمن"]]},"mistake":{"why":"الـreports وقع عليها الفعل؛ فنقول [[were written]] مش wrote.","right":"The reports were written yesterday.","wrong":"The reports wrote yesterday."},"titleAr":"01 · Active vs Passive: تحويل المفعول لفاعل","duration":"8–10 دقائق","examples":[{"ar":"المعلم بيعمل الفعل.","en":"Active: The teacher [[checks]] the answers."},{"ar":"الإجابات جمع، فبنستخدم are + checked.","en":"Passive: The answers [[are checked]] by the teacher."},{"ar":"الفاعل Sara والزمن ماضي.","en":"Active: Sara [[wrote]] the report."},{"ar":"المفعول بقى فاعل، والزمن فضل ماضي.","en":"Passive: The report [[was written]] by Sara."}],"subtitle":"في [[Active]] الفاعل بيعمل الحدث؛ في [[Passive]] الشيء اللي وقع عليه الفعل بيبقى Subject. ننقل [[Object → Subject]]، ونحافظ على الزمن، ونستخدم [[be + V3]].","description":"في [[Active]] الفاعل بيعمل الحدث؛ في [[Passive]] الشيء اللي وقع عليه الفعل بيبقى Subject. ننقل [[Object → Subject]]، ونحافظ على الزمن، ونستخدم [[be + V3]]. وجود [[by]] اختياري؛ ووجود اسم غير عاقل مش دليل كافي بمفرده.","questionIds":[]}'::jsonb) ||
 (SELECT jsonb_agg(s.item || jsonb_build_object(
  'title',lpad((s.ord+1)::text,2,'0') || substring(s.item->>'title' from 3),
  'titleAr',lpad((s.ord+1)::text,2,'0') || substring(s.item->>'titleAr' from 3),
  'visual',(s.item->'visual') || jsonb_build_object('title',lpad((s.ord+1)::text,2,'0') || substring(s.item->>'title' from 3))
 ) ORDER BY s.ord)
 FROM jsonb_array_elements(b.payload->'sections') WITH ORDINALITY s(item,ord) WHERE s.ord<=8),true),
 '{questions}',(b.payload->'questions') - 'PSV-SUP01'::text,true),
 '{editorial}',coalesce(b.payload->'editorial','{}'::jsonb)||jsonb_build_object(
  'releaseStatus','admin_only_draft_source_gap','studentReleaseReady',false,
  'approvedOriginals',19,'minimumReleaseQuestions',20,'minimumFuturePerfectQuestions',2,
  'teachingStages',9,'examTenseStages',8,'excludedAdjacent','Be Supposed To + Modal Passive kept for another lesson',
  'adminDecision','Nineteen source-approved independent tense questions; future perfect has one only; release blocked'),true),
 updated_at=now()
WHERE b.course_code='ASGQPSVCORE'
 AND EXISTS(SELECT 1 FROM public.step_curriculum_indicators i WHERE i.slug='passive-voice-by-tense' AND i.status='draft')
 AND jsonb_array_length(b.payload->'sections')=9 AND b.payload->'questions' ? 'PSV-SUP01';

CREATE OR REPLACE FUNCTION public.step_guard_lesson17_passive_by_tense_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE b jsonb; total int; matching int; assigned int; unique_ids int; covered int; overlap_count int; own_duplicates int;
BEGIN
 IF NEW.slug <> 'passive-voice-by-tense' OR NEW.status <> 'published'
 OR (TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code)
 THEN RETURN NEW; END IF;
 IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQPSVCORE'
 THEN RAISE EXCEPTION 'Lesson17 needs the original audited private bank' USING ERRCODE='23514'; END IF;
 SELECT payload INTO b FROM public.step_private_course_banks WHERE course_code='ASGQPSVCORE';
 IF b IS NULL OR jsonb_typeof(b->'questions') <> 'object'
 OR jsonb_typeof(b->'sections') <> 'array' OR jsonb_array_length(b->'sections') <> 9
 OR b->'sections'->0->>'id' <> 'active-vs-passive' OR b->'questions' ? 'PSV-SUP01'
 THEN RAISE EXCEPTION 'Lesson17 needs an unscored Active/Passive introduction and eight true tense stages; exclude semi-modals' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO total FROM jsonb_each(b->'questions');
 IF total < 20 THEN
 RAISE EXCEPTION 'Lesson17 remains draft: at least 20 independently reviewed original tense items required, found %',total USING ERRCODE='23514'; END IF;
 IF jsonb_array_length(b->'sections'->0->'questionIds') <> 0
 THEN RAISE EXCEPTION 'Lesson17 Active/Passive introduction cannot contain scored exam questions' USING ERRCODE='23514';END IF;
 SELECT count(*),count(DISTINCT j.id) INTO assigned,unique_ids
 FROM jsonb_array_elements(b->'sections') s(section)
 CROSS JOIN LATERAL jsonb_array_elements_text(s.section->'questionIds') j(id);
 SELECT count(*) INTO covered FROM jsonb_array_elements(b->'sections') WITH ORDINALITY s(section,n)
 WHERE n>1 AND jsonb_typeof(s.section->'questionIds')='array'
 AND jsonb_array_length(s.section->'questionIds') >= 2
 AND jsonb_typeof(s.section->'visual')='object'
 AND jsonb_array_length(s.section->'visual'->'examples') = 4;
 IF assigned<>total OR unique_ids<>total OR covered<>8
 THEN RAISE EXCEPTION 'Lesson17 needs unique original questions plus at least two items and four worked examples in each tense stage' USING ERRCODE='23514'; END IF;
 IF jsonb_array_length(
 (SELECT s.section->'questionIds' FROM jsonb_array_elements(b->'sections') s(section)
 WHERE s.section->>'id'='future-perfect')
 ) < 2
 THEN RAISE EXCEPTION 'Lesson17 future perfect has fewer than two independent original questions' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO matching FROM jsonb_each(b->'questions') q(id,item)
 JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.review_status='approved' AND r.document_key='STEP_AUDITED_BANK_2026'
 AND r.original_category_code IN ('ASGQPSVPRSIM','ASGQPSVPRCONT','ASGQPSVPASIM','ASGQPSVPACONT','ASGQPSVPRPER','ASGQPSVPAPER','ASGQPSVFUSIM','ASGQPSVFUPER')
 AND r.original_stem=q.item->>'text' AND r.original_options=q.item->'options'
 AND r.printed_key=q.item->>'correct'
 AND jsonb_typeof(q.item->'options')='object' AND q.item->'options' ?& ARRAY['A','B','C','D']
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'options'))=4
 AND jsonb_typeof(q.item->'wrongReasons')='object'
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'wrongReasons'))=3
 AND NOT(q.item->'wrongReasons' ? (q.item->>'correct'))
 AND length(coalesce(q.item->>'explanation',''))>=12;
 IF matching<>total THEN RAISE EXCEPTION 'Lesson17 cannot publish unaudited, altered, or inadequately explained original MCQs' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO own_duplicates FROM (
 SELECT lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')) stem
 FROM jsonb_each(b->'questions') q(id,item) GROUP BY 1 HAVING count(*)>1
 ) repeated;
 IF own_duplicates>0 THEN RAISE EXCEPTION 'Lesson17 contains repeated source stems' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO overlap_count FROM jsonb_each(b->'questions') q(id,item)
 WHERE EXISTS(
 SELECT 1 FROM public.step_private_course_banks other
 CROSS JOIN LATERAL jsonb_each(other.payload->'questions') otherq(id,item)
 WHERE other.course_code<>'ASGQPSVCORE'
 AND lower(regexp_replace(otherq.item->>'text','[^a-z0-9]','','gi'))=
 lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi'))
 );
 IF overlap_count>0 THEN RAISE EXCEPTION 'Lesson17 reuses % original stems from another lesson',overlap_count USING ERRCODE='23514';END IF;
 RETURN NEW;
END;
$function$

REVOKE ALL ON FUNCTION public.step_guard_lesson17_passive_by_tense_publish() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS step_lesson17_passive_by_tense_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson17_passive_by_tense_gate BEFORE INSERT OR UPDATE OF status,legacy_course_code
 ON public.step_curriculum_indicators FOR EACH ROW
 EXECUTE FUNCTION public.step_guard_lesson17_passive_by_tense_publish();
