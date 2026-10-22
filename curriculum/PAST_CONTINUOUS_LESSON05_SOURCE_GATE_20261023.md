# STEP with Seify — Past Continuous Lesson 05 — Source Audit & Release Gate
Date: 2026-10-23

## Original sources and scope
- STEP course book, PDF pages **55–57**: Past Continuous explanations, negative / question forms, nine source questions on p. 57.
- STEP_Grammar_Question_Bank_Classifications_Audited.pdf, PDF pages **22–25**, original category `ASGQPACONT`: 19 source question occurrences. The exact original options and printed keys remain in **private Supabase**.
- TAJMEAAT 2026 checked for matching stems; no additional item admitted without unique page-verifiable provenance.
- **28 source occurrences audited:** 10 approved, 7 duplicates, 11 `ambiguous_hold`. The active course has 10 source-verbatim, four-option questions with explicit explanation and three answer-specific wrong-choice explanations.
- Fundamental editorial caution: **while does not automatically entail Past Continuous**. Questions for which past simple is also a grammatical reading are held; no guessed replacement options or fabricated tests.
- Five Arabic-first teacher-authored teaching sections, 2 real-bank MCQs per section: formation (was/were + V-ing), background while, interruption when, negative/questions, historical going-to plans and tense comparison. Explanatory examples are original teaching material, not claimed source MCQs.
- Student URL: `step-grammar-student/lesson.html?slug=past-continuous`. Server route `step-course/lesson/past-continuous` enforces indicator `published` status, active student profile and JWT. The bank remains in Supabase `step_private_course_banks`; never place source keys in public GitHub.
- Admin Studio course code `ASGQPACONT`; private source audit under `step-grammar-admin/past-continuous-audit.html`. Existing grades, student profiles and lesson order must be preserved.
- Gate to publish: exact 10/10 bank-ledger text/options/key consistency; 5 teaching units; 10 distinct assigned IDs; both browser and release gates green; updated authenticated admin Edge Function; verify no direct anon/authenticated SELECT on the private bank.
- Browser tests use synthetic mock questions only, not source-original exams. Real authenticated grading/persistence requires a separate student-account end-to-end check.
