-- Source: platform test.docx, final SAD exercise. Only questions, answers and transcript are staged;
-- the MP3 was not supplied. Keep clip/group in draft until owner uploads licensed audio.
insert into public.step_listening_clips (sample_code,title,transcript,rights_notes,review_state)
values (
'record-3','Seasonal Affective Disorder (SAD)',
$t$Lecturer: Our lecture today is about SAD, or Seasonal Affective Disorder. It is a type of depression that's related to changes in seasons. Now, before I proceed, do you have any questions?
Student: Yes, Sir. I want to know why SAD is seasonal.
Lecturer: SAD is a seasonal disorder (Q1) as it happens in dark months when days get shorter and the sky is more often cloudy. Student: What causes SAD?
Lecturer: (Q2) No one really knows what starts it, but luckily they have found a treatment. It is called the light box treatment. It can offer relief. But sometimes it needs to be combined with other medications to be more effective.
Student: How does it work? Lecturer: Well, light boxes are designed to deliver a therapeutic dose of bright light to treat symptoms of SAD. A light box mimics outdoor light. It's thought that this type of light may cause a chemical change in the brain that lifts your mood and eases other symptoms of SAD, such as being tired most of the time and sleeping too much.
Student: How much does it cost? Lecturer: I don't know (Q3) because scientists are still testing it.$t$,
null,'draft')
on conflict (sample_code) do nothing;
insert into public.step_listening_groups(clip_id,sample_code,title_ar,title_en,seconds_per_question,review_state)
select id,'record-3','الاضطراب العاطفي الموسمي (SAD)','Seasonal Affective Disorder (SAD)',15,'draft'
from public.step_listening_clips where sample_code='record-3'
on conflict(sample_code) do nothing;
insert into public.step_listening_items(group_id,position,question_text,options,correct_choice,explanation_ar,wrong_reasons_ar,review_state)
select g.id,s.pos,s.question,s.options::jsonb,s.correct,s.explanation,s.reasons::jsonb,'approved'
from (values
('record-3',1,'What information proves SAD is seasonal?',
 '{"A":"It depends on one''s mood.","B":"It happens in dark months.","C":"It happens all year round.","D":"It happens only two months a year."}',
 'B','المحاضر قال إن الحالة بتحصل في الشهور المظلمة لما النهار بيقصر والسماء بتكون غائمة غالبًا.',
 '{"A":"السكريبت بيربط الموسمية بالشهور المظلمة، مش بالحالة المزاجية وحدها.","C":"السكريبت ما قالش إنها مستمرة طوال السنة.","D":"مفيش تحديد بشهرين فقط في السكريبت."}'),
('record-3',2,'What does the professor think is the reason for differences in SAD symptoms?',
 '{"A":"different seasons","B":"less light","C":"unknown","D":"outdoor light"}',
 'C','الإجابة المعتمدة في الوورد هي unknown، والمُحاضر قال: No one really knows what starts it.',
 '{"A":"الوورد اختار unknown رغم ذكر تغير الفصول.","B":"السكريبت ذكر قِصر النهار ولكنه قال إن السبب غير معروف.","D":"الضوء الخارجي اتذكر في شرح العلاج، مش كإجابة عن السبب."}'),
('record-3',3,'What does the professor say about the light box treatment?',
 '{"A":"It''s being tested","B":"It''s reliable","C":"It''s the only treatment","D":"It''s failed"}',
 'A','المُحاضر قال إن العلماء لسه بيختبروا العلاج (scientists are still testing it).',
 '{"B":"السكريبت ما أكدش إن العلاج موثوق بصورة نهائية.","C":"المُحاضر ذكر إنه أحيانًا يتجمع مع أدوية تانية.","D":"ما قالش إن العلاج فشل."}')
) s(sample,pos,question,options,correct,explanation,reasons)
join public.step_listening_groups g on g.sample_code=s.sample
on conflict (group_id,position) do nothing;