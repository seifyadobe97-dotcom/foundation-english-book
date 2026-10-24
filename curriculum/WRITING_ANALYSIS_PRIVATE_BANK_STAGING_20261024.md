# STEP Writing Analysis — private staged question banks and release gates

**Date:** 2026-10-24. **Owner decision:** keep 8 Writing indicators, with 5 book chapters first and 3 additional bank-sourced skills. **Status:** INTERNAL DRAFT / NOT PUBLISHED.

## Live Supabase state (verified with read-only SQL)

| Writing order | Indicator slug | Protected code | Lesson stages | New simulated items |
| ---: | --- | --- | ---: | ---: |
| 1 | `punctuation` | `ASGQWAPUN01` | 5 | 16 |
| 2 | `capitalization` | `ASGQWACAP01` | 4 | 12 |
| 3 | `sequencing` | `ASGQWASEQ01` | 5 | 15 |
| 4 | `logical-connectors` | `ASGQWALINK01` | 5 | 15 |
| 5 | `error-recognition` | `ASGQWAERR01` | 5 | 15 |
| 6 | `sentence-combining` | `ASGQWACOMB01` | 4 | 12 |
| 7 | `logical-sentence-completion` | `ASGQWALCOMP01` | 3 | 9 |
| 8 | `spelling-word-recognition` | `ASGQWASPELL01` | 4 | 12 |
| **Total** | **8** | **8 private banks** | **35** | **106** |

### Editorial provenance and current limitations

- The sources driving the lesson taxonomy are the **STEP course book.pdf** Writing Analysis chapter (PDF pp.101–116), the audited grammar/question bank categories (`ASGQPUN`, `ASGQCAP`, `ASGQPARORDER`, `ASGQINSERT`, `ASGQLINK*`, `ASGQERR`, `ASGQCOMBINE`, `ASGQLOGCOMP`, `ASGQSPELL`), and **TAJMEAAT 2026.pdf** for later item-by-item classification checks.
- All **106 current private questions were newly written as instructional simulations**, not claimed as copied, verified authentic exam questions or already approved originals. `origin="simulated"` in the protected payload; `approval_status="draft"` in the private `step_simulated_item_reviews` table. The wording, four alternatives, canonical letter, reason for each wrong option and stage match are preserved in restricted tables. The admin-only classification flag must never be exposed to the learner.
- Deliberately did not import the book's double-error `informations ... are` assessment as a one-error question. Original bank questions and TAJMEAAT items are **not yet imported into these Writing course banks**. Their exact texts/keys remain outside the public repository and require page-specific verification before use.
- Quality refinements during staging: adjusted three sentence-insertion prompts that initially revealed the insertion slot, randomized their correct-option positions, clarified three contextual spelling questions to prevent valid-word ambiguity, and added an exclamation-mark-specific item in Punctuation. The first attempted code `WAPUNCORE` was rejected by the database regex; the corrected `ASGQ...` codes were successfully saved. A construction-time JavaScript typo was corrected without partial writes.

### Database technical QA as of latest read

- 8 indicators are still `draft`; **0 Writing courses are published**.
- All 8 indicators are linked to dedicated, service-role-private question banks.
- All 106 question IDs are uniquely referenced by their stages; **0 dangling IDs**.
- All checked questions have 4 distinct options, a single stored key and 3 wrong-choice explanation fields; **0 schema invalid items**.
- Every protected simulated review row matches its bank copy for text, alternatives and correct key; **0 review drift**.
- All 35 stages have at least 3 questions.
- 45 Grammar indicators remain published and untouched; historical totals remain 70 part attempts, 10 exam attempts, 259 answer records.
- **This structural QA does not replace manual linguistic/content/source-item review.** All 106 item approval statuses remain draft; do not call them classroom-ready or publish to students until reviewed.

### Integration contract

- Admin Studio catalogue now includes the linked private Writing banks, labeled separately from Grammar. Owner can inspect and edit their sections, visualization content, questions and review history.
- Student `step-course/lesson/{slug}` backend only permits **published** Writing indicators, additionally requiring a published guide and item-by-item approval matching question text, options and key for simulations. Original items, if subsequently added, require their private approved source ledger proof. Unapproved items cannot be released by simply flipping indicator status.
- Student dashboard has a separate Writing Analysis section for published and successfully fetched lessons; with 0 published Writing indicators it stays hidden. Foundation remains paused.
- A dedicated regression test checks the above release barriers. No private question text or correct answer is included in GitHub.

### Next steps: content audit and publication

1. Conduct manual question-level audit for the 106 simulations: verify distractors, one best answer, natural language, exact skill and source similarity. Approve/revise/hold each item in the private reviews ledger.
2. Review authentic candidate items from STEP book, audited bank and TAJMEAAT against their original PDF page, multiple answers, duplicated questions, and published course taxonomy. Preserve authentic stems, options and verified keys privately.
3. Upgrade any thin/risky modules with source-vetted items or instructor simulations, add richer responsive teaching visuals and Arabic rationales, and test the student journey.
4. Publish per Writing lesson **only when** guide, bank content, admin approval, authenticated student tests, source rights and QA gates all pass; do not rewrite historic student progress.

Internal-only editorial metadata remains in this document; no user data or answer-bearing source content enters the public repository.
