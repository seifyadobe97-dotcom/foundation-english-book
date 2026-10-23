# Lesson 17 — Passive Voice by Tense: Source review and protected draft

Audit: 2026-10-23. Logical position **117**, indicator `passive-voice-by-tense`, internal course code `ASGQPSVCORE`.

## Source evidence

- Audited bank `STEP_Grammar_Question_Bank_Classifications_Audited.pdf`, PDF **pages 48–57**. Nine source categories: `ASGQPSVPRSIM`, `ASGQPSVPRCONT`, `ASGQPSVPASIM`, `ASGQPSVPACONT`, `ASGQPSVPRPER`, `ASGQPSVPAPER`, `ASGQPSVFUSIM`, `ASGQPSVFUPER`, `ASGQSUPPOSED`.
- `STEP course book.pdf`, PDF **pages 69–72**, teaches receiver-of-action, **Be + V3**, present/past passive, modal/future and perfect passive. The more granular continuous/future perfect teaching is instructor-authored and is not represented as quoted book teaching.
- `TAJMEAAT 2026.pdf`: independently checked duplicate Lexus cars items **#278 p109** and **#383 p151**; strawberries **#162 p62** and **#387 p153**. Those compilation appearances are *not* counted as independent graded originals. Original PDF SHA-256 values verified against `step_source_documents`.

## Audit: 31 occurrences individually reviewed, not the whole source bank

**20 source-approved original multiple-choice items**, **2 ambiguous holds**, **4 source-editorial/out-of-scope holds**, **5 duplicates/near-duplicates**. **Only 19 of the approved items are in the Lesson17 private tense bank**; the separate `PSV-SUP01` item is reserved for Be Supposed To rather than being counted as a tense-subtest question. Source-verbatim stems, A–D options, keys and distractor explanations stay in private Supabase.

- **Unscored introductory stage:** Active vs Passive, with four instructor-written examples; no graded question assigned.
- Tense stage 1 Present Simple: `PSV-PPRS02`, `PSV-PPRS03`, `PSV-PPRS04`.
- Tense stage 2 Present Continuous: `PSV-PRC01`, `PSV-PRC02`.
- Tense stage 3 Past Simple: `PSV-PAS04`, `PSV-PAS07`, `PSV-PAS11`, `PSV-PAS16`.
- Tense stage 4 Past Continuous: `PSV-PAS08`, `PSV-PAC01`. Source bank originally classified `PSV-PAS08` under Past Simple, although its printed correct form is **was being lectured**. The source classification remains unchanged and the *teaching* assignment is corrected transparently.
- Tense stage 5 Present Perfect: `PSV-PRP01`, `PSV-PRP02`, `PSV-PRP09`.
- Tense stage 6 Past Perfect: `PSV-PAP02`, `PSV-PAP07`.
- Tense stage 7 Future: `PSV-FUS01`, `PSV-FUS02`.
- Tense stage 8 Future Perfect: `PSV-FUP01`.
- **Reserved outside Lesson17:** Be Supposed To Passive `PSV-SUP01`. This original remains approved in the source ledger, but is not included in Lesson17's scored tense practice.

### Held and duplicate decisions

- `PSV-FUS04` offers both **is going to be delivered** and **will be delivered**; a future delivery deadline alone does not distinguish them as a single correct answer.
- `PSV-FUS03` offers both **will be provided** and **are being provided** without enough tense context.
- `PSV-PAS13` is malformed (the original sentence says *By a famous English written in 1603*); `PSV-PAS17` near-repeats that template.
- `PSV-PAS10` makes an unverified claim about Taibah University's founding year; it is withheld pending factual verification, not treated as a confirmed factual error.
- `PSV-PRP08` is actually **Modal Perfect Passive**, deferred to Lesson18.
- `PSV-PPRS06` has repeated option-letter labels within the choices. Do not silently clean the original and treat it as a source-exact item.
- Taj duplicate occurrences are logged under `PSV-TAJ162`, `PSV-TAJ278`, `PSV-TAJ383`, `PSV-TAJ387`.

## Teaching, source integrity and release

- Nine admin-editable Arabic-first sections (one unscored introduction plus eight tense stages) with **36 instructor-created examples**, explanations, formulas, misconceptions, and answer-choice rationales.
- **19 source-approved tense originals** are assigned exactly once across the eight tense stages. The introductory Active/Passive stage has no scored item. **Future Perfect Passive has only one approved independent original**, making this an incomplete mastery set. The separate approved `PSV-SUP01` is outside this specific lesson.
- The private `step_private_course_banks` and `step_source_item_reviews` tables have RLS enabled and no direct `anon`/`authenticated` table privileges. The audit API `/passive-voice/audit` explicitly requires **owner** role, with JWT verification on the deployed Edge Function.
- **Current authoritative publication gate:** `supabase/migrations/20261023_step_lesson17_passive_tense_only_source_gate.sql` (latest applied migration) requires 20 independently verified **tense-only** originals, two or more per scored tense stage including **at least two Future Perfect Passive** items, unique assignments, exact A–D/source keys and wrong-choice rationales, plus normalized de-duplication across other lessons. The original generic publish guard also remains. **Lesson17 stays draft until the source gap is resolved.** The earlier `20261023_step_lesson17_passive_voice_source_gate.sql` is superseded and must not be treated as the current authority.
- Security QA: changing one printed correct letter in a test transaction **blocked publication and rolled back** under the earlier gate. The subsequently tightened **current** gate intentionally blocks release because only 19 tense originals and one Future Perfect Passive item are present. The valid-content rollback test under the earlier gate is no longer evidence that the current release condition is met. No student data was deleted or reset.
- Owner editor: `step-grammar-admin/studio.html?course=ASGQPSVCORE`; owner review: `step-grammar-admin/passive-voice-audit.html`; student after verified publication: `step-grammar-student/lesson.html?slug=passive-voice-by-tense`.
- Lessons 07, 12, 13, 14, 16, foundation and any future lessons remain unpublished unless separately approved.
