# Lesson 12 — Past Perfect Continuous (Private Teaching Draft, 2026-10-23)

## Source findings

Original PDFs verified against existing private SHA-256 values in `step_source_documents`:
- Audited bank `STEP_Grammar_Question_Bank_Classifications_Audited.pdf`, **PDF p.27–28**, category `ASGQPAPERCONT`, **three printed questions total**.
- `TAJMEAAT 2026.pdf`, **PDF p.119**, item 303 contains `had been studying` in the *given stem*, but its question actually assesses **want + object + to-infinitive**; this cannot be repurposed as Past Perfect Continuous assessment.
- `STEP course book.pdf`, **PDF p.58–60**, describes **Past Perfect Simple** (`had + V3`), not a separate Past Perfect Continuous lesson. All teaching examples for Lesson 12 are independently instructor-authored, not quoted as official question-bank items.

## Conservative original-question review

- Bank #1 `PAPC-B01`, bank #2 `PAPC-B02`: approved exact-source items. Both source stems, four options, printed keys and explanations are stored privately; their role is **internal review only** until the lesson is published.
- Bank #3 `PAPC-B03`: **editorial hold**; original stem says walking **in the train** for several hours, which produces anomalous semantics in context. Don't silently substitute rain or sitting.
- Compilation #303 `PAPC-T303`: **out-of-scope hold**; the tense appears only in contextual background, not in the blank being tested.
- Consequently **two** suitable source items out of **three** true category questions; one additional cross-classification instance noted. This is not enough for a representative graded examination.
- No original source text, lettered distractors, printed keys, or private PDFs committed into GitHub.

## Instructor-created lesson: 5 stages, 20 examples
1. Subject + **had been + V-ing**, affirmative / negative / question.
2. Duration before a past decision.
3. Extended waiting before a past arrival.
4. **Since/For** preceding a past reference.
5. Past Simple vs Past Continuous vs Past Perfect Continuous, with stative-verb and completed-count nuances.

## Release and security gates
- Supabase `ASGQPAPERCONT` private bank mapped to indicator `past-perfect-continuous`, logical position **112**; indicator remains `draft`.
- Dedicated release trigger `step_guard_lesson12_past_perfect_continuous_publish` requires **at least five independently approved, source-verbatim questions**, complete A–D options and printed key, 3 wrong-option rationales, and one unique question across each of the five teaching stages. Existing generic grammar publication gate applies as well.
- Verified via a rejected attempt to publish with two questions: the indicator stayed draft and the trigger remained active.
- Owner-only source review: `step-grammar-admin/past-perfect-continuous-audit.html`.
- Owner editor: `step-grammar-admin/studio.html?course=ASGQPAPERCONT`.
- The student route `lesson.html?slug=past-perfect-continuous` must remain inaccessible while the indicator is draft. The student API enforces `indicator.status === published`.
- Preserve all prior published lessons and student exam attempts. Future Arrangements Lesson 07 and Foundation Sentence Elements also remain drafts.
