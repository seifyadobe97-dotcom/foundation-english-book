# STEP Reading rebuild — 2026-10-26

## Why replaced
The original Reading Edge Function had repeated Firefox NetworkError reports. Browser preflight was received while the subsequent GET did not arrive. The previous frontend and its Edge backend have therefore been **retired** rather than repeatedly patched.

## New design
- Student: `step-grammar-student/reading-v2.html` (Old Birds source passages, mobile-first English LTR reading, Arabic feedback, practice, simulated 10-minute timer and stored scores).
- Owner: `step-grammar-admin/reading-v2.html` (full source review, 5 questions, question 2 held, results).
- Legacy Reading paths redirect to v2, without contacting the failed Edge API.
- Backend: **Supabase PostgREST RPC** `public.step_reading_request(p_action,p_payload)`, an invoker wrapper to the private schema function `step_reading_internal.dispatch`. Standard Supabase JS browser session authentication; no custom CORS or Edge Function endpoint. Role and ownership are validated on every call.
- Admin actions: `admin_catalog`, `admin_grades`, `admin_review`.
- Student actions: `catalog`, `begin`, `submit`, `progress`.
- Source: original `Old Birds – SRCLH5Q.docx` text in existing database, **8 paragraphs, 5 source questions**. Four approved, the original Q2 held because key D overclaims what the fossil shows. No edits to the source or answer history.
- Existing Reading attempts before rebuild: zero, existing Reading responses: zero. No student data was deleted. Grammar, Writing, Listening and their score data untouched.
- Source answer keys are never sent to learners before submission. Server stores responses, grades against private answer keys and saves immutable question ID snapshot at attempt start. Practice shows evidence; timed simulation returns score without answer keys.
- Owner can review the unapproved Q2 only. Already approved items are locked to preserve grading history.
- Old `step-reading-live` function returns HTTP 410 and exposes no data.
- Authenticated students and owner are identified with `auth.uid()` using Supabase Auth, plus verified active-student/admin records; anonymous callers cannot execute the public wrapper. Direct table access and answer keys remain revoked.
- New RPC SQL stored in `supabase/migrations/20261026_rebuild_reading_secure_rpc.sql`. Authenticated privilege tests passed for student catalog and owner catalog; live REST CORS/anonymous security smoke added to CI.

## Notes
The ten-minute simulation is an educational trial duration, not an official STEP timing claim. Repeat attempts are tracked separately, and results are independent of the other curriculum axes. For new readings, insert audited paragraphs and questions into existing private database tables without modifying the secure RPC.
