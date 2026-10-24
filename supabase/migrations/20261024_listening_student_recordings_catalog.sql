-- Two owner-supplied Listening exercises; staged pending verified private MP3 upload.
alter table public.step_listening_clips add column if not exists sample_code text unique;
alter table public.step_listening_groups add column if not exists sample_code text unique;
insert into public.step_listening_clips (sample_code,title,duration_seconds,transcript,review_state)
values
('record-1','Final exam schedule',27.216,$t$Teacher: That's all for today and study hard for your final exams. Do you have any questions before I leave?
Student: Yes, Mrs. Smith. When is our final exam?
Teacher: It is on Monday 26th December.
Student: Are all the 6 units we have studied included in the exam?
Teacher: No, just the last 2 units.
Student: Really?? Oh, thank you, teacher.
Teacher: You are welcome. Just study hard and good luck to you all.$t$,'draft'),
('record-2','Eating habits lecture',31.416,$t$Lecturer: Good morning all of you. The main idea of today's lecture is changes in eating habits.
Student: Excuse me professor. Can I ask you about something before you start?
Lecturer: Of course, go ahead.
Student: What is the worst eating habit among Americans?
Lecturer: The worst eating habit among Americans is that they eat a huge amount of beef.
Student: And what should be done about that?
Lecturer: I think Americans should stop eating huge amounts of beef.
Student: Thank you professor.
Lecturer: I'm happy to help.$t$,'draft')
on conflict (sample_code) do nothing;
insert into public.step_listening_groups(clip_id,sample_code,title_ar,title_en,seconds_per_question,review_state)
select id,sample_code,
case sample_code when 'record-1' then 'موعد الاختبار والوحدات' else 'تغيّر العادات الغذائية' end,
case sample_code when 'record-1' then 'Final exam schedule' else 'Eating habits lecture' end,
15,'draft'
from public.step_listening_clips where sample_code in ('record-1','record-2')
on conflict (sample_code) do nothing;
insert into public.step_listening_items(group_id,position,question_text,options,correct_choice,explanation_ar,wrong_reasons_ar,review_state)
select g.id,q.pos,q.question,q.options::jsonb,q.correct,q.explanation,q.reasons::jsonb,'approved'
from (values
('record-1',1,'Which exact date does Mrs. Smith mention for the final exam?','{"A":"Wednesday","B":"Next Monday (no exact date)","C":"Next week (no exact date)","D":"Monday 26th December"}','D','المدرّسة ذكرت Monday 26th December. اختار التاريخ المحدد الذي ورد في المقطع.','{"A":"مش الأربعاء.","B":"Next Monday غير محدد من غير تاريخ مرجعي.","C":"Next week أوسع من الإجابة الدقيقة."}'),
('record-1',2,'How many units must the students study for the test?','{"A":"2","B":"5","C":"6","D":"26"}','A','قالت المدرّسة: just the last 2 units، أي آخر وحدتين فقط.','{"B":"لم تذكر خمس وحدات.","C":"ست وحدات هي إجمالي ما درسوه، مش المطلوب للاختبار.","D":"ده رقم غير وارد."}'),
('record-2',1,'What is the main idea in the lecture?','{"A":"Health in America","B":"Changes in eating habits","C":"The American beef industry","D":"Traditional foods"}','B','المحاضر ذكر إن الفكرة الرئيسية هي changes in eating habits.','{"A":"السؤال عن الموضوع الأساسي مش الصحة عمومًا.","C":"اللحم البقري مثال، مش عنوان المحاضرة.","D":"الأكل التقليدي مش الفكرة الأساسية."}'),
('record-2',2,'What does the lecturer recommend about eating beef?','{"A":"Stop eating huge amounts of beef","B":"Increase the amount of beef","C":"Eat only a small amount of vegetables","D":"Become vegetarians"}','A','المحاضر قال stop eating huge amounts of beef؛ نصح بإيقاف الإفراط، مش الامتناع عن اللحم نهائيًا.','{"B":"قال stop eating huge amounts، مش increase.","C":"ما ذكرش تقليل الخضروات.","D":"لم يطلب التحول للنظام النباتي."}')
) q(sample,pos,question,options,correct,explanation,reasons)
join public.step_listening_groups g on g.sample_code=q.sample
on conflict (group_id,position) do nothing;
