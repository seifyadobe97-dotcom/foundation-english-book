# Lesson 14 — Used To / Be Used To / Get Used To — private audited draft

Verified on 2026-10-23 against exact locally supplied PDF SHA-256 files:
- Audited bank `STEP_Grammar_Question_Bank_Classifications_Audited.pdf` pp. **141–143**, category `ASGQUSED`: **14 printed items**.
- `TAJMEAAT 2026.pdf` pp. **8, 37–38, 99, 112, 114–115, 141**, category `SGTUSED`: **7 duplicate printed occurrences** #20, 94, 252, 285, 291, 357, 358. Originals have same or near-identical stems, except some reordered answer options.
- `STEP course book.pdf` pp. **52–54** explicitly contrasts **used to + base verb** and **be used to + V-ing** and discusses `didn't use to`. **Get used to** is named in a solution heuristic but has no substantive independent teaching section or classified scored item; seven-section expansion is teacher-authored, not source-extracted.
- SHA-256 identity matches three existing private `step_source_documents` rows: bank `3a50d4e3...`, book `13f212a0...`, Taj `94228432...`.

## Audited decisions
**21 total reviewed source occurrences**: 10 independent approved bank items, 9 duplicate/near-clone occurrences (2 bank, 7 compilation), 2 holds.
- Approved private originals: `UST-B01`, `UST-B02`, `UST-B04`, `UST-B05`, `UST-B06`, `UST-B10`, `UST-B11`, `UST-B12`, `UST-B13`, `UST-B14`.
- Bank #3 `UST-B03` is misclassified (tests word order/infinitive purpose, not used to).
- Bank #7 `UST-B07` has unidiomatic original `every evening dinner`; hold rather than silently repair.
- Bank #8 `UST-B08` is a close clone of bank #5 (changed name and profession, same distractor template). Bank #9 `UST-B09` is a near-clone of bank #2 (first-person former state, same key and pattern).
- Important nuance: bank #6 and #12 supply `used to + verb` as their only structurally sound options but **do not explicitly establish that the habit has stopped in the present**; explanations do not invent that claim.
- None of the 10 approved questions independently assesses `be used to` or `get used to`.

## Lesson and publication
- Supabase indicator `used-to-be-used-to-get-used-to`, grammar position 114, private bank `ASGQUSED`, status **draft**.
- Seven admin-editable Arabic-first sections and **28 teacher-written examples**: old habits, former states, past cues, negative/question, be used to, get used to, and three-way comparison.
- Ten source-exact bank MCQs assigned uniquely to old-habit/old-state/contrast stages for **internal review only**. No source MCQs on be/get used to, so grading must not be made public.
- Table `step_source_item_reviews.lesson14_construction_code` is nullable and validated for `used_to_past`, `be_used_to`, `get_used_to`; ten approved original items have `used_to_past`.
- Dedicated source gate `step_guard_lesson14_used_to_publish` checks >=9 independently source-verified unique MCQs, >=3 per each of three construction tags, >=3 specifically assigned to each be/get used to section, all seven illustrated stages covered, exact original A–D options and printed keys, 3 wrong-answer reasons per item. The current source set **cannot pass**; direct early publish attempt was rejected and status remained draft.
- Private evidence visible to owner at `step-grammar-admin/used-to-audit.html`; Studio `step-grammar-admin/studio.html?course=ASGQUSED`; student route intentionally inaccessible until published.
- No original source question or key exposed in GitHub or student-safe Pages. Preserve all prior student attempts and lessons 07,12,13,14 and Foundation as draft.
