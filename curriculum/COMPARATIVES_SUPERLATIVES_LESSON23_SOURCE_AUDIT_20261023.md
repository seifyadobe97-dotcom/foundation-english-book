# Lesson 23 — Comparatives & Superlatives | Original source review

**2026-10-23** · `comparatives-superlatives`, position **123**, private `ASGQCOMPSUP`.

## Sources and reconciliation
- `STEP_Grammar_Question_Bank_Classifications_Audited.pdf` PDF pages **123–126**, classifications `ASGQCOMP` (12 questions) and `ASGQSUP` (7 questions).
- `STEP course book.pdf` PDF pages **29–30**: comparatives (-er/more/less), equality (as...as), superlatives (-est/most), and irregular best.
- **19 originals individually reviewed; 18 independently approved and source-exact:** COMP-001..012 in the `CMP-###` ID convention (12) and SUP-001..006 (6). In private Supabase ledger these are `CMP-001` through `CMP-012` and `SUP-001` through `SUP-006`.
- **1 ambiguity hold:** `SUP-007` (comparison of two languages with phrasing encouraging comparative versus superlative; printed `easiest` is not the only defensible grammatical framing). Hold from scoring.

## Implementation
- **5 stages**, **20 original instructor teaching examples**, **18 reviewed exact-source scored MCQs**, each with complete individual distractor reasons.
- Stages cover -er/than, less and much with comparative, as...as, superlative adjectives including irregular forms, and superlative adverbs with optional the.
- Admin Studio: `step-grammar-admin/studio.html?course=ASGQCOMPSUP`.
- Source and answers strictly private in Supabase RLS-protected bank `step_private_course_banks`, with a separate review ledger `step_source_item_reviews`.
- Trigger `step_lesson23_comp_sup_gate` requires all 18 source-exact items (12 comparative and 6 superlative), unique assignment, >=2 scored originals per stage, >=4 instructor examples per stage, no cross-lesson question overlap and full three-distractor explanations.
- Publication requires green CI and a successful live DB status read; content creation alone does not imply a release.
