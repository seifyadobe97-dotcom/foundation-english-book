# Lesson 02 — Source audit and release gate (internal only)

Audit date: 2026-10-22. Target: `subject-verb-agreement` / `ASGQAGREE`.

## Evidence and limitation

The original PDFs were not available in the current conversation attachments or searchable Library. Supabase `step_source_documents` stores document hashes and extraction metadata, but not the PDF bytes. Consequently the original PDF page references have **not been independently rechecked during this handoff**. Prior reviewer notes state "PDF checked"; those are historical assertions, not a substitute for a fresh document-to-question comparison. Do not mark a new source-validation gate PASS until exact source PDFs (matching stored hashes) are accessible and inspected.

## Existing inventory (checked against live database)

- Course indicator exists already: `subject-verb-agreement`, `legacy_course_code=ASGQAGREE`. Do not create a duplicate.
- Bank classification `ASGQAGREE` points to the existing indicator, with first PDF page 109.
- 20 item review records classified `ASGQAGREE`: 17 previously approved, 2 rejected, 1 duplicate.
- Published JSON bank contains exactly 17 original A/B/C/D questions and three unique wrong-choice rationales each.
- `AG-B11` source typo, `AG-B12` wrong classification, `AG-B13` duplicate: remain excluded.
- B06 concerns a habitual action with I; assigned to singular/plural main-verb stage rather than Do/Does stage; wording, options and key unchanged.
- Underlying approval data and source locators are restricted to admin Supabase API / internal files.

## Deployment gate

Before re-opening the indicator to students:
1. Obtain all three source PDFs and compare their SHA-256 hashes against `step_source_documents`.
2. Independently inspect STEP book pages 4–8, bank pages 109–111, and candidate compilation questions.
3. Reconcile every current item against original stem, A/B/C/D order and answer key; record exclusions, duplicate fingerprints, tense-vs-agreement mapping, and option-level rationale.
4. Check actual authenticated student grading, database persistence, admin access, progress, mobile and desktop, reports, and the latest GitHub Pages run.
5. Only then update `step_curriculum_indicators.status` from `draft` to `published` using the existing indicator.

Draft status is enforced server-side by the Agreement course API. Never rely on hiding a navigation link as the release boundary. This change does not delete or update any student attempts, profiles, reports or follow-ups.
