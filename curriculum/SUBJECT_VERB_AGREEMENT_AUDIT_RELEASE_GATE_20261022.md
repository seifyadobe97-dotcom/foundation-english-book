# Lesson 02 — original-source reconciliation (internal instructor audit)

Date: 2026-10-22. Indicator: `subject-verb-agreement` / bank category `ASGQAGREE`.
**Source-file verification passed; full secure student release is still on hold.**

## Original PDFs received and cryptographically verified

Three user-provided PDF files were opened and independently checked against the SHA-256 values already stored in `step_source_documents`. No filenames or page numbers were inferred.

| Source | PDF pages | SHA-256 verified |
|---|---:|---|
| STEP course book.pdf | 154 | `13f212a0b707eb2d087a2f05437facd655db7aeca90bbfc49e3a1e79471043ac` |
| STEP_Grammar_Question_Bank_Classifications_Audited.pdf | 234 | `3a50d4e3bec92fb50e826d6a4c6410ac259bfda1b713c923f8542bdba6e7889c` |
| TAJMEAAT 2026.pdf | 182 | `94228432ab860fe4d0bed9d82240cff6b06803a33b24288c5d0e37120cd4ff9a` |

Review surfaces inspected: STEP book PDF pages 4–8 (rendered page 8 visually), bank PDF pages 109–111 (including rendered page 111), compilation PDF pages 68, 126–127 and 140. The compilation has no dedicated `ASGQAGREE` category; it uses `SGTPRSI` for the relevant source occurrences. Do not reclassify those original printed labels.

## Current operational bank, verified against originals

- Operational student lesson continues to contain **17 unique four-choice (A/B/C/D) exercises**: 10 from the category bank, 7 from the course book. Every operational question is represented by an `approved` source review and has a separate rationale for each of its three incorrect options.
- The 10 bank questions come from PDF pages 109–111, question numbers 1–10. The 7 book questions come from book page 8, numbers 1, 4, 5, 7, 8, 9 and 10.
- No original operational question text, option order, or printed answer key was changed during this reconciliation.
- Already withheld bank occurrences **AG-B11** (printed typo 'Physic'), **AG-B12** (possessive orthography, not agreement) and **AG-B13** (repetition of AG-B07) retain their existing rejected/duplicate states. Their actual four options and printed answers have now been stored in the *private* review table, not shown to the learner.
- Book PDF page 8 **AG-C02** (Physics relative-clause variant) remains `in_review`: near duplicate of AG-B04; no blind automatic inclusion.
- Book PDF page 8 **AG-C03** (bookseller/relative pronoun) is `duplicate`: same four answers and sentence as AG-B08 except blank glyph.
- Book PDF page 8 **AG-C06** (average adult brain) is **rejected** for this platform: **only three printed answer options (A/B/C), no D**, confirmed by visual inspection. Do not create a synthetic fourth option. Its options and printed key are retained in the private ledger.
- Exact cross-document repeats from compilation: **TAJ2026-177** (PDF p68) mirrors AG-B02; **TAJ2026-321** (PDF pp126–127) mirrors AG-B04; **TAJ2026-355** (PDF p140) mirrors AG-B03. They are catalogued as private duplicate records, not student exercises. The compilation's original classification `SGTPRSI` is preserved.

The lesson-specific private source audit now covers **26 occurrences**: 23 book/bank records (17 approved, 6 withheld) plus 3 compilation duplicates. The shared review ledger still contains unrelated records for other lessons. No student records were deleted or modified.

## Existing teaching alignment

Book pp4–7 organize subject agreement around singular subjects, plural subjects, **I** exception, **One of**, deceptive subjects (Physics / Mathematics / News), gerunds used as subjects, and the three-step answering procedure including Do/Does. The interactive five-stage presentation covers those competencies, and additionally makes BE / HAVE / DO, questions, negatives, and passive constructions explicit for weak learners. These expanded explanations are pedagogical teaching copy, **not invented source questions**. The original book’s mnemonic "singular loves s" must not be taught as a universal rule for past BE or modal constructions.

## Remaining release checks (draft remains enforced by the Edge Function)

1. Protect answer keys and secure exam material: **the GitHub repository is public and currently contains server-side question JSON with keys**. This pre-existing exposure makes GitHub an unsuitable location for secure exam keys. Migrate keys into private Supabase storage and remove new exposure before treating exams as secure. Merely marking a file as "internal" in a public repo does not protect it; past Git history may also retain older keys.
2. Verify authenticated student endpoints, grading persistence, access by non-admins, per-indicator reports, and admin preview with authorized test accounts; browser mocks alone do not validate production data writes.
3. Confirm latest GitHub Actions quality gates and Pages deploy, plus ensure the paused Foundation path is actually unavailable on public Pages.
4. Only after those checks, publish the existing indicator by changing its current `draft` status to `published`, retaining `legacy_course_code=ASGQAGREE`; do not create duplicate indicators.

The draft restriction in the Supabase `step-course` Edge Function is server-enforced. Present Simple data and student history remain untouched.
