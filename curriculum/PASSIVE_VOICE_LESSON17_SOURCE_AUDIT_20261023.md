# Lesson 17 — Passive Voice by Tense: Source review and publication record

Audit: 2026-10-23. Logical position **117**, indicator `passive-voice-by-tense`, internal course code `ASGQPSVCORE`.

## Source evidence

- Audited bank `STEP_Grammar_Question_Bank_Classifications_Audited.pdf`, PDF **pages 48–57**. Nine source categories: `ASGQPSVPRSIM`, `ASGQPSVPRCONT`, `ASGQPSVPASIM`, `ASGQPSVPACONT`, `ASGQPSVPRPER`, `ASGQPSVPAPER`, `ASGQPSVFUSIM`, `ASGQPSVFUPER`, `ASGQSUPPOSED`.
- `STEP course book.pdf`, PDF **pages 69–72**, teaches receiver-of-action, **Be + V3**, present/past passive, modal/future and perfect passive. The more granular continuous/future perfect teaching is instructor-authored and is not represented as quoted book teaching.
- `TAJMEAAT 2026.pdf`: independently checked duplicate Lexus cars items **#278 p109** and **#383 p151**; strawberries **#162 p62** and **#387 p153**. Those compilation appearances are *not* counted as independent graded originals. Original PDF SHA-256 values verified against `step_source_documents`.

## Audit: 31 occurrences individually reviewed, not the whole source bank

**20 approved original multiple-choice items**, **2 ambiguous holds**, **4 source-editorial/out-of-scope holds**, **5 duplicates/near-duplicates**. Every approved question has source-verbatim stem, A–D options, printed key and independent wrong-answer explanations kept in private Supabase.

- Stage 1 Present Simple: `PSV-PPRS02`, `PSV-PPRS03`, `PSV-PPRS04`.
- Stage 2 Present Continuous: `PSV-PRC01`, `PSV-PRC02`.
- Stage 3 Past Simple: `PSV-PAS04`, `PSV-PAS07`, `PSV-PAS11`, `PSV-PAS16`.
- Stage 4 Past Continuous: `PSV-PAS08`, `PSV-PAC01`. Source bank originally classified `PSV-PAS08` under Past Simple, although its printed correct form is **was being lectured**. The source classification remains unchanged and the *teaching* assignment is corrected transparently.
- Stage 5 Present Perfect: `PSV-PRP01`, `PSV-PRP02`, `PSV-PRP09`.
- Stage 6 Past Perfect: `PSV-PAP02`, `PSV-PAP07`.
- Stage 7 Future: `PSV-FUS01`, `PSV-FUS02`.
- Stage 8 Future Perfect: `PSV-FUP01`.
- Stage 9 Be Supposed To Passive: `PSV-SUP01`.

### Held and duplicate decisions

- `PSV-FUS04` offers both **is going to be delivered** and **will be delivered**; a future delivery deadline alone does not distinguish them as a single correct answer.
- `PSV-FUS03` offers both **will be provided** and **are being provided** without enough tense context.
- `PSV-PAS13` is malformed (the original sentence says *By a famous English written in 1603*); `PSV-PAS17` near-repeats that template.
- `PSV-PAS10` makes an unverified claim about Taibah University's founding year; it is withheld pending factual verification, not treated as a confirmed factual error.
- `PSV-PRP08` is actually **Modal Perfect Passive**, deferred to Lesson18.
- `PSV-PPRS06` has repeated option-letter labels within the choices. Do not silently clean the original and treat it as a source-exact item.
- Taj duplicate occurrences are logged under `PSV-TAJ162`, `PSV-TAJ278`, `PSV-TAJ383`, `PSV-TAJ387`.

## Teaching, source integrity and release

- Nine admin-editable Arabic-first sections with **36 instructor-created examples**, explanations, formulas, misconceptions, and answer-choice rationales.
- All 20 approved originals are assigned to exactly one teaching stage. Future Perfect Passive and Supposed To each have **one** approved source item; don't describe these as comprehensive mastery subtests.
- The private `step_private_course_banks` and `step_source_item_reviews` tables have RLS enabled and no direct `anon`/`authenticated` table privileges. The audit API `/passive-voice/audit` explicitly requires **owner** role, with JWT verification on the deployed Edge Function.
- Dedicated database trigger `step_guard_lesson17_passive_by_tense_publish` checks at least 20 source-exact approved originals, A–D choices, original printed keys, full distractor explanations, normalized de-duplication, and source-category coverage across all nine illustrated stages; the generic grammar publish gate also remains.
- Security QA: changing one printed correct letter in a test transaction **blocked publication and rolled back**; valid content passed the same gate in an explicit transaction subsequently rolled back. No student data was deleted or reset.
- Owner editor: `step-grammar-admin/studio.html?course=ASGQPSVCORE`; owner review: `step-grammar-admin/passive-voice-audit.html`; student after verified publication: `step-grammar-student/lesson.html?slug=passive-voice-by-tense`.
- Lessons 07, 12, 13, 14, 16, foundation and any future lessons remain unpublished unless separately approved.
