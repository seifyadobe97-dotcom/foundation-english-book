
create table if not exists public.step_reading_passages (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique,
 title_en text not null, title_ar text not null,
 paragraphs jsonb not null check(jsonb_typeof(paragraphs)='array'),
 source_label text not null,
 status text not null default 'draft' check (status in ('draft','approved','archived')),
 exam_seconds integer not null default 600 check(exam_seconds between 60 and 7200),
 created_at timestamptz not null default now()
);
create table if not exists public.step_reading_items (
 id uuid primary key default gen_random_uuid(),
 passage_id uuid not null references public.step_reading_passages(id) on delete restrict,
 position smallint not null check(position between 1 and 50),
 question_text text not null,
 options jsonb not null check(jsonb_typeof(options)='object' and options ?& array['A','B','C','D']),
 correct_choice text not null check(correct_choice in ('A','B','C','D')),
 explanation_ar text not null, paragraph_number smallint not null check(paragraph_number between 1 and 100),
 review_state text not null default 'needs_review' check(review_state in ('needs_review','approved','rejected')),
 editorial_notes text not null default '',
 unique(passage_id,position)
);
create table if not exists public.step_reading_attempts (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete restrict,
 passage_id uuid not null references public.step_reading_passages(id) on delete restrict,
 mode text not null check(mode in ('practice','exam')),
 state text not null default 'in_progress' check(state in ('in_progress','submitted')),
 started_at timestamptz not null default now(),
 due_at timestamptz,
 submitted_at timestamptz,
 correct_count integer, total_questions integer
);
create table if not exists public.step_reading_responses (
 id uuid primary key default gen_random_uuid(),
 attempt_id uuid not null references public.step_reading_attempts(id) on delete restrict,
 item_id uuid not null references public.step_reading_items(id) on delete restrict,
 selected_choice text check(selected_choice is null or selected_choice in ('A','B','C','D')),
 correct_choice_snapshot text not null check(correct_choice_snapshot in ('A','B','C','D')),
 is_correct boolean not null,
 created_at timestamptz not null default now(),
 unique(attempt_id,item_id)
);
create index if not exists step_reading_attempts_user_time_idx on public.step_reading_attempts(user_id,submitted_at desc);
create index if not exists step_reading_items_passage_status_idx on public.step_reading_items(passage_id,review_state,position);
alter table public.step_reading_passages enable row level security;
alter table public.step_reading_items enable row level security;
alter table public.step_reading_attempts enable row level security;
alter table public.step_reading_responses enable row level security;
revoke all on public.step_reading_passages,public.step_reading_items,public.step_reading_attempts,public.step_reading_responses from anon,authenticated;

insert into public.step_reading_passages(slug,title_en,title_ar,paragraphs,source_label,status,exam_seconds)
values ('old-birds-srclh5q','Old Birds','الطيور العملاقة القديمة',
jsonb_build_array('1- Giant birds of the past have names that speak for themselves. The elephant bird, a native of Madagascar and the largest known giant bird, stood at over nine feet tall and weighed in at a whopping 1,000 pounds or more, until it went extinct about 1,000 years ago. Australia''s mihirung, nicknamed "thunder bird," which disappeared nearly 50,000 years ago, is thought to have been nearly seven feet tall and weighed between 500 and 1,000 pounds. But until now, no one had ever found evidence of these towering avians in Europe.',
'2- A team of paleontologists dug up the fossil—an unusually large femur—in Taurida Cave, located on the Crimean Peninsula in the northern Black Sea. The cave was only discovered last June when the construction of a new highway revealed its entrance. Initial expeditions last summer led to exciting finds, including the bones and teeth of extinct mammoth relatives. Of course, the team didn''t expect to find large birds, since there had never been evidence of their existence in Europe.',
'3- "When these bones reached me, I felt like I was holding something belonging to elephant birds from Madagascar," paleontologist Nikita Zelenkov of the Borissiak Paleontological Institute, who led the study, says in an email. "This was the most surprising [part] for me, such an incredible size. We did not expect [that]."',
'4- Based on the femur''s dimensions, the team calculated that the bird would have weighed around 992 pounds—as much as an adult polar bear—making it the third largest bird ever recorded.',
'5- Although the bone was similar in size to an elephant bird''s femur, it was more slender and elongated, like a larger version of the modern ostrich (Struthio camelus). "The main difference from Struthio is the notable robustness. There are also some less visible details, like the shape or orientation of particular surfaces, which indicate a different morphology from ostriches," Zelenkov says.',
'6- The femur''s shape also gives us clues about what the world was like when Pachystruthio was alive. Its similarities to the bones of a modern ostrich suggest that enormous bird was a good runner, which could imply that it lived among large carnivorous mammals like the giant cheetah or saber-toothed cats. This idea is supported by the earlier findings of nearby bones and fossils.',
'7- Perhaps most notably, the team hypothesizes that Pachystruthio was present when Homo erectus arrived in Europe during the Early Pleistocene and possibly arrived via the same route. Knowing that the two ancient species could have coexisted introduces a world of new questions for scientists.',
'8- "The thought that some of the largest birds to have ever existed were not found in Europe until so recently is revelatory," Daniel Field, a paleontologist at the University of Cambridge who was not involved in the new research, says in an email. "[It] raises exciting questions about the factors that gave rise to these giant birds, and the factors that drove them to extinction."'),
'Old Birds – SRCLH5Q.docx','approved',600)
on conflict(slug) do nothing;
insert into public.step_reading_items(passage_id,position,question_text,options,correct_choice,explanation_ar,paragraph_number,review_state,editorial_notes)
select id,1,'What two phrases does the writer use to say that the birds were very large?','{"A":"giant birds and elephant bird","B":"elephant bird and thunder bird","C":"giant bird and towering avian","D":"paleontologists and femur"}'::jsonb,'C','في الفقرة الأولى استخدم الكاتب وصفين بيدلوا على ضخامة الطيور: giant birds وtowering avians. أسماء الطيور مش هي التعبيرين المقصودين.',1,'approved','Source key C; expression has minor singular/plural variation.'
from public.step_reading_passages where slug='old-birds-srclh5q'
on conflict(passage_id,position) do nothing;
insert into public.step_reading_items(passage_id,position,question_text,options,correct_choice,explanation_ar,paragraph_number,review_state,editorial_notes)
select id,2,'How are researchers'' views since the new discovery different from the views held before?','{"A":"They would never know what the ancient birds looked like.","B":"They were working in Taurida Cave before the construction of a highway.","C":"The femur found was of a modern ostrich.","D":"They now know what the birds looked like."}'::jsonb,'D','الملف الأصلي يختار D، لكن اكتشاف عظمة فخذ واحدة بيسمح باستنتاجات عن حجم الطائر وشكل بعض أجزائه، مش معرفة مظهره بالكامل.',5,'needs_review','Hold: Word''s D overstates evidence from single femur; reword answer D to ''They have gained clues about the birds’ size and structure'' before approval.'
from public.step_reading_passages where slug='old-birds-srclh5q'
on conflict(passage_id,position) do nothing;
insert into public.step_reading_items(passage_id,position,question_text,options,correct_choice,explanation_ar,paragraph_number,review_state,editorial_notes)
select id,3,'What can we understand about the giant bird of Crimea from Paragraph (2)?','{"A":"Researchers believe that it was small and slow.","B":"Researchers did not find all the bones.","C":"Researchers believe it to be the largest bird on earth.","D":"Researchers believe that it used to eat giant mammals."}'::jsonb,'B','الفقرة الثانية بتقول إن الاكتشاف كان عظمة فخذ ضخمة (femur)، مش هيكل عظمي كامل؛ بالتالي الاختيار B هو الاستنتاج الأقرب للنص.',2,'approved','Source key B; inferred from partial fossil find.'
from public.step_reading_passages where slug='old-birds-srclh5q'
on conflict(passage_id,position) do nothing;
insert into public.step_reading_items(passage_id,position,question_text,options,correct_choice,explanation_ar,paragraph_number,review_state,editorial_notes)
select id,4,'Which of the following does the writer say is a fact?','{"A":"The Elephant bird was over nine feet tall.","B":"The elephant bird lived only in Europe.","C":"Thunder birds weighed at least 1000 pounds","D":"Taurida Cave was discovered during the removal of a forest."}'::jsonb,'A','الفقرة الأولى قالت حرفيًا إن elephant bird كان طوله أكثر من تسعة أقدام: stood at over nine feet tall.',1,'approved','Source key A.'
from public.step_reading_passages where slug='old-birds-srclh5q'
on conflict(passage_id,position) do nothing;
insert into public.step_reading_items(passage_id,position,question_text,options,correct_choice,explanation_ar,paragraph_number,review_state,editorial_notes)
select id,5,'What can be understood about Daniel Field from paragraph (8)?','{"A":"He studies fossils.","B":"He studies animals.","C":"He studies caves and their formation.","D":"He studies modern birds."}'::jsonb,'A','الفقرة الثامنة بتصف Daniel Field إنه paleontologist، ودي مهنة عالم الحفريات اللي بيدرس البقايا القديمة.',8,'approved','Source key A.'
from public.step_reading_passages where slug='old-birds-srclh5q'
on conflict(passage_id,position) do nothing;
-- Reading discovery lives in its isolated authenticated catalogue and the existing student hub.
-- Existing indicator table currently restricts axis to Grammar/Writing; leave that constraint unchanged.
