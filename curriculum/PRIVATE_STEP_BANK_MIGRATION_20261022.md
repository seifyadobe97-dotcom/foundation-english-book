# STEP with Seify — private canonical bank migration (2026-10-22)

Canonical question payloads are no longer imported from public repository JSON into the deployed Edge Functions. Both banks were copied **unchanged** into `public.step_private_course_banks` in Supabase project `funltjxavowlnnfibhpl`.

- `ASGQPRSIM`: 6 stages, 21 stored questions (20 used in student practice).
- `ASGQAGREE`: 5 stages, 17 approved source-verified student MCQs.
- The RLS-protected table grants no read/write permissions to `anon`, `authenticated` or `PUBLIC`; `service_role` alone can select and update the payload.
- `step-course` resolves the requested whitelisted course code on each authenticated student request and grades on the server; `step-admin` resolves both after validating admin membership. Any missing private bank returns HTTP 503 rather than fabricated questions.
- Source-original JSON files are deleted from current `main`. CI uses independently fabricated question stems, distractors, rationales and keys under `tests/fixtures/private-banks` to preserve browser regression tests. These synthetic test questions are never served to students.
- **Historical exposure is irreversible by normal Git deletion.** Old original keys remain retrievable from previous public Git commits; the previously exposed questions **cannot be treated as unseen or high-stakes secure exam items**. Genuine confidential exams require a new privately sourced, reviewed question pool and appropriate Git history remediations before claiming secrecy.
- Draft release gate remains enforced for Subject–Verb Agreement. No student attempts, scores, profiles, reports or previously published Present Simple content are deleted.
- Simulated CI browser grading tests do not establish successful authenticated production writes. Before publishing Agreement, run opt-in test accounts through submit/read-back, reports and role/permission checks and confirm the GitHub Pages deployment.
