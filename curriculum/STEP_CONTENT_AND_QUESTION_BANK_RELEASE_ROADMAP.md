# STEP with Seify — Curriculum, Questions & Compilations Delivery Roadmap

**Established:** 2026-10-22 | **Scope:** finish and validate all STEP curriculum streams, item banks and source compilations.
**Foundation training status:** paused for students and deferred until curriculum and assessment workflows are completed. Its source files stay in GitHub; they are excluded from public Pages builds. No account, attempt or future draft is reset.

## Verified project baseline (live Supabase, 2026-10-22)

| Metric | Verified value | Interpretation |
|---|---:|---|
| Indicators | 47 | 42 Grammar + 5 Writing Analysis |
| Published indicators | 1 | Present Simple only |
| Draft indicators | 46 | not production ready |
| Bank classification headings | 91 | classification **headings**, not 91 validated individual questions |
| Provisional indicator mappings | 75 | still require detailed review |
| Mappings requiring adjudication | 16 | must remain flagged, not auto-assigned |
| Question-edit records | 0 | no evidence of completed additional editorial review |
| Detailed question-answer events | 14 | insufficient for calibrated statistical item analysis |

**Known defect:** Grammar indicator position 203 is assigned to both `present-simple` and `present-continuous`. Reconcile source syllabus order and position IDs before enforcing sequential navigation.

## Strategic release priorities

### Phase A: lock source-of-truth and scope (editorial gate)
1. Identify the actual **owner-provided PDF(s)** and original STEP compilations. Do not silently swap in generic or AI-generated questions.
2. Verify the **91 bank category headings** against the audited 234-page Grammar Question Bank Classification source.
3. Reconcile the 16 `needs_review` categories to an existing indicator **only where defensible**; otherwise create a new indicator or keep unmapped, with explicit editorial rationale.
4. Reconcile order and definitions of 42 Grammar indicators; keep the five Writing Analysis indicators in their source-book order (Punctuation → Capitalization → Sequencing → Logical Connectors → Error Recognition), independently of the separate `Correct Word Order` bank category.
5. Preserve Reading and Listening as distinct STEP axes and determine which supplied source(s) contain approved items and audio assets; do not infer book coverage where files are unavailable.
6. All provenance notes stay inside editor-only systems, **never in student UI or public Pages artifact**. Assess repo/public Git history exposure separately.

### Phase B: extract, classify, and review every source question (item gate)
Build an item register for **every actual question occurrence**, not just category headings:

- `source_document`, source page, bank heading, printed question number, **page-local occurrence anchor** if needed;
- immutable item ID, original question stem, original **A/B/C/D** options and ordering;
- keyed option and evidence for the key; `source_licence` and editorial status;
- main indicator, objective/subskill, optional secondary objective and misconception IDs;
- quality disposition: `approved`, `corrected_with_evidence`, `ambiguous_hold`, `incorrect_key_hold`, `duplicate`, `needs_source_verification`, `not_suitable`;
- reviewed distractor-specific Arabic reasons, correct-option rationale, audit author/version and issue notes;
- planned use: formative practice, secure independent check, mock, or retired.

**Never** publish an ambiguous or unverified item, fabricate a missing stem/option, or automatically substitute an assistant-authored item. Do not mix category counts with actual item counts.

### Phase C: ship one complete indicator at a time (learning + assessment)
Choose the next **source-supported Grammar indicator** (likely Subject–Verb Agreement if original questions are sufficient). For every release:
1. Clear learner-friendly Arabic teaching and authentic English examples; teaching examples may be adapted from source context but **never presented as unchanged source MCQs**.
2. Clear English sentence flow LTR, highlight relevant parts and distinguish main vs auxiliary actions.
3. Source-verified, **four-choice A/B/C/D** questions: question and choices identical to supplied source.
4. Selected-answer feedback: *why this option is wrong* + the correct option + *why it is correct*.
5. Separate guided practice, unseen assessment bank (where available), explicit time rules, teacher-only source provenance.
6. Admin workflow: drafts → subject/editorial review → peer QA → published; video slot optional.
7. Indicator-specific reports and intervention assignments, with small-sample qualification.
8. Mobile/browser testing, server grading, permissions and smoke tests before publication.

### Phase D: bank-scale operations and management
- Editorial review queue by **indicator, category, source document, status, duplicate group, and priority**.
- Ingestion QA checks for four options, missing key, inconsistent rationale, same-text same-page duplicates, leakage to student assets, and missing LTR/mobile support.
- Teacher dashboard coverage: audited items/target, still pending, suspended for ambiguity, tested on mobile, used by lesson/practice/mock, protected server-only keys.
- Revision history, exam exposure tracking, downloadable editor QA reports.
- Defer adaptive IRT score prediction and high-impact automated mastery judgements until real reliability/validity evidence exists.

## Release blockers / dependencies

- The original **STEP course book PDF and complete compiled question bank** are not directly available from indexed current-project files or this public repository during this pass. Historical source-ledger metadata exists, but cannot substitute for independently rechecking rendered original items. Access to those original sources is necessary before we truthfully assert question-level source completeness.
- The repo is publicly readable today. Hiding foundation from Pages does **not** delete old Git history or make source registers in GitHub private. Sensitive source texts and grading keys should move to private storage before any high-stakes secured exam release.
- The 75 mapped headings are provisional—not item-level verified.
- No additions to student-visible questions until approved at both subject-matter and measurement-appropriateness gates.

## Decision-ready next sprint
**Deliverable:** `STEP Source-to-Indicator Reconciliation Ledger v1` covering the full 91-heading classification and 47-indicator curriculum, with 16 pending mappings explicitly adjudicated where possible, duplicate ordering corrected only after source comparison, and a reproducible question extraction format.

**Exit gate:** A signed-off category crosswalk plus a reviewed inventory of real **item occurrences per indicator**. **Next production indicator** is selected based on audited item coverage and pedagogical sequence, not only its current title or assumed popularity.

The paused Foundation route must continue to return 404/410 and must not be linked from the student portal. Reopening it is a separate owner-approved release decision.
