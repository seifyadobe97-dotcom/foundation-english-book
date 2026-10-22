# STEP Platform — reusable lessons, editorial safety and learner UX (2026-10-22)

## Admin studio
- Every course with a private canonical bank and mapped curriculum indicator is discoverable using authenticated `/studio/catalog`; old hardcoded dropdowns no longer control what is editable.
- An owner can edit visual explanations, section data, answer choices, distractor explanations, metadata and videos. Unsaved inputs display a warning on course/section/tab switches and when leaving.
- Owner can locally preview entered changes before saving. Preview uses escaped text; it is not a claim of publication.
- Save a draft; publish separately. Metadata now also uses a private draft table.
- The authenticated owner-only history lists course, visual, section and question revisions, timestamps and actor identities and restores selected revisions server-side. History begins at migration activation; edits before that date cannot be invented.
- Immutable historic learner attempts, section identifiers and canonical original source material are not changed by restoring an edit. Restoring a published override changes only the current presentation/grading override, not historic recorded scores. Owner should check implications before using a restore.

## New lesson enrollment
- A new grammar lesson requires a private validated `step_private_course_banks` payload, linked published curriculum indicator and original-source-approved items. An indicator cannot publish an unaudited pool.
- Published lessons appear from the catalog in the student learning path; previously hardcoded first-three links retain their individual lesson engines. Future lessons use `lesson.html?slug=<indicator-slug>` with the same authenticated, server-graded training API, and `teachingUnits` returned without answer keys.
- New draft lessons remain hidden from students until both source audit and publication have passed.
- Historical source question keys previously on public Git branches are **not** confidential high-stakes items.

## Student interface
- Focus on the next available stage, compact progress across the live course catalog, clear lesson status, mobile-friendly cards, collapsed optional maps/stages, and reduced-motion support.
- Student grade computations and persistence remain server-side; interface cosmetics do not change the scoring algorithm.

## Safety and test
- Tables `step_studio_revision_history`, `step_course_metadata_drafts` and original banks have RLS with no direct anon/authenticated grants. Restore SQL RPCs are service-role-only and owner-gated by `step-admin`.
- Keep prior Present Simple and Agreement attempt records unchanged.
