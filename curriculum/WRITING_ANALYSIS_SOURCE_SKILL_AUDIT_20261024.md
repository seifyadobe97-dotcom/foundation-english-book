# STEP WITH SEIFY — source-based Writing Analysis refinement (2026-10-24)

## Inspected source coverage
- **STEP course book.pdf** PDF pp. 101–116: Punctuation (101–103), Capitalization (104–106), Paragraph Sequencing (107–109), Logical Connectors (110–112), Error Recognition (113–116).
- **STEP_Grammar_Question_Bank_Classifications_Audited.pdf**: ASGQCOMBINE p.187, ASGQPARORDER pp.188–194, ASGQINSERT pp.194–196, ASGQLOGCOMP p.197, ASGQSENT pp.197–198, ASGQSPELL p.198, ASGQWOR p.145. Pages are PDF page numbers.
- **TAJMEAAT 2026.pdf**: grammar-coded samples exist, including correct sentence word order, conjunctions and morphology; item wording/functional target determines axis, not a paper's overall grammar label.

## Confirmed classification decisions

| Source category | New primary skill | Reason |
|---|---|---|
| ASGQINSERT | Writing Analysis / sequencing | Insert a phrase or clause at its semantically coherent location within an existing paragraph |
| ASGQCOMBINE | Writing Analysis / sentence-combining (new draft) | Recast two sentences as one concise accurate sentence preserving their meaning |
| ASGQLOGCOMP | Writing Analysis / logical-sentence-completion (new draft) | Select contextually consistent continuation, not merely a conjunction form |
| ASGQSPELL | Writing Analysis / spelling-word-recognition (new draft) | Recognize spelling and accurate written word shape |

**Unmoved:** ASGQSENT remains needs_review: six samples mix possessive-adjective vs contraction choice and auxiliary selection, so a single lesson-level mapping could misrepresent item-level grammar targets. Grammar ASGQWOR (sentence-internal syntax) remains distinct from ASGQPARORDER (paragraph cohesion). The 45 published Grammar lessons and their teaching unit IDs, source review ledger, private banks, simulation origins, recorded grades and progress remain untouched.

## Rollout contract
1. PR checks on a feature branch; no public deployment before green.
2. Apply additive Supabase migration and verify category mapping, RLS, status, attempts and bank counts.
3. Deploy the updated admin Edge Function (owner-only taxonomy reassignment with reason and immutable-course guard); verify authorization.
4. Merge PR to main after tests; verify Pages workflow and student/admin live links.
5. Writing Analysis indicators stay **draft**; a taxonomy mapping is not a publishable private course.

No copyrighted source questions or answer keys have been copied into the public repo.
