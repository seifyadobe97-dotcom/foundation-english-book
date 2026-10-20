-- Secure reporting views: accessible to the server's service role only.
-- Use security_invoker so caller privileges apply to underlying tables.
create or replace view public.step_admin_overview
with (security_invoker = true) as
select
 (select count(*) from public.step_student_profiles)::bigint as students_total,
 (select count(*) from public.step_student_profiles where is_active)::bigint as students_active,
 (select count(*) from (
   select user_id from public.step_part_attempts
   where course_code = 'ASGQPRSIM'
   group by user_id
   having count(distinct part_index) filter (where passed) >= 6
 ) finished)::bigint as students_completed,
 (select count(distinct user_id) from public.step_exam_attempts
  where course_code='ASGQPRSIM')::bigint as students_exam_taken,
 (select count(*) from public.step_part_attempts
  where course_code='ASGQPRSIM')::bigint as practice_attempts,
 (select count(*) from public.step_exam_attempts
  where course_code='ASGQPRSIM')::bigint as exam_attempts,
 (select round(avg(correct_count::numeric * 100 / nullif(total_questions,0)),1)
  from public.step_exam_attempts where course_code='ASGQPRSIM') as avg_exam_percent;
revoke all on public.step_admin_overview from public,anon,authenticated;
grant select on public.step_admin_overview to service_role;

create or replace view public.step_admin_part_statistics
with (security_invoker = true) as
select step.part_index,
 count(a.*)::bigint as attempts,
 count(distinct a.user_id)::bigint as students_tried,
 count(distinct a.user_id) filter (where a.passed)::bigint as students_passed,
 round(avg(a.correct_count::numeric * 100 / nullif(a.total_questions,0)),1) as avg_score_percent
from generate_series(0,5) as step(part_index)
left join public.step_part_attempts a
 on a.part_index=step.part_index and a.course_code='ASGQPRSIM'
group by step.part_index
order by step.part_index;
revoke all on public.step_admin_part_statistics from public,anon,authenticated;
grant select on public.step_admin_part_statistics to service_role;