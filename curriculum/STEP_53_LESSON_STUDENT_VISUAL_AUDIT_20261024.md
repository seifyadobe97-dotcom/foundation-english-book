# STEP student lesson rendering — complete published curriculum audit

**Date:** 2026-10-24 · **Scope:** 45 published Grammar lessons + 8 published Writing Analysis lessons. All original source questions, answer keys, course IDs, scores, and historical attempts are left unchanged.

## Reproduced bug and underlying cause

Screenshots supplied by the owner show (1) First Conditional blue/green/amber formula boxes with the first filled by an Arabic editorial note and the others empty, and (2) a comparison table where English clause headings are not explained in Arabic and reading direction mixes LTR English with RTL Arabic.

The underlying shared player `step-grammar-student/lesson-player.js` previously **destructured every formula into [label, first, second, third]**, while multiple protected course banks correctly store **two-element [rule, explanation]** formula entries. This generated exactly two empty visual boxes and two meaningless arrows in every affected rule.

## Read-only audit of all 53 published lessons

Validated from Supabase `step_curriculum_indicators`, private course bank sections, published teaching overrides:

| Metric | Verified |
| --- | ---: |
| Published lesson count | 53 |
| Grammar lesson stages | 228 |
| Writing Analysis lesson stages | 35 |
| Total published stages | 263 |
| Two-element formula rows previously rendered as broken three-box diagrams | 393 |
| Four-element true sentence diagram rows | 242 |
| Malformed formula array lengths | 0 |
| Malformed card structures | 0 |
| Malformed teaching example structures | 0 |
| Comparison tables with missing data rows | 0 |
| Comparison table rows with mismatched columns | 0 |
| Grammar stages with missing visual payload | 15, exclusively the three legacy introductory lessons using their separate rendering paths |
| Generic Grammar stages missing both required teaching title/detail | 0 |
| Source-audit panels explicitly headed `تدقيق` in the bank | 50 |

There are 635 rule/diagram rows across 213 modern Grammar teaching stages. Legacy dedicated courses have their own existing browser tests and layouts. Writing 35 stages are sourced from published protected Writing guides rather than the bank's `section.visual`; missing section visuals in those protected bank records are expected, **not missing published explanations**.

## Implemented cross-course player fixes

1. **Two-field formula handling:** show one complete English LTR rule or English pair and a separate Arabic supporting explanation; never invent an empty subject/verb/complement structure.
2. **Four-field formulas:** preserve the actual three elements in left-to-right reading order, with arrows and Arabic visual part captions.
3. **Teaching concept cards:** Arabic role labels first, English terminology in a smaller second line; explicit Condition = الشرط, Result = النتيجة, etc. Keep each real English formula LTR.
4. **Comparison tables:** keep columns in declared source order but force consistent LTR table reading with translated relevant headings such as جملة الشرط (If clause) / جملة النتيجة (Main clause). Per-cell Arabic text stays RTL; English text stays LTR, including mobile stacked layout.
5. **Student-facing source confidentiality:** remove teacher-only audit metadata from the student API teaching payload and optional panels (without deleting or rewriting protected Supabase bank/editor records).
6. **Fault tolerance:** never render null/empty cards, examples, keywords or structurally incomplete tables as empty decorative UI.
7. **Regression coverage:** synthetic Playwright sample includes both formula shapes, Arabic/English table header descriptions, correct reading direction, hidden internal audit, practice questions, grading and 390px/1280px layouts.

## Publication / safety gate

These fixes concern **presentation and API redaction**, not pedagogy edits or source questions. The original stored banks, teacher-facing notes, reviewed simulations, attempts and examination grades must be preserved. Deploy static client only after STEP and release QA pass. Deploy matching `step-course` Supabase function before verifying the final learner API and page.

This audit checks structural completeness for every stage and browser renders for representative schemas and pre-existing per-lesson Playwright fixtures. It is **not a claim** that each of the 263 stages was individually screenshot-reviewed, nor a replacement for a complete source-led pedagogical re-audit.
