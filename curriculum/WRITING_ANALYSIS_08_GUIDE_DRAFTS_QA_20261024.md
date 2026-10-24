# Writing Analysis — eight lesson drafts: source and technical QA

**Project:** STEP WITH SEIFY · **Date:** 2026-10-24 · **Decision:** eight indicators remain in source-book-first order.

## Executed in production Supabase

Eight structured teaching guides were saved **as private drafts** in `public.step_indicator_guides`; each is accessible to the owner through `step-grammar-admin/guide.html?indicator=<slug>`. No student guide, question or new course was published. The user approved proceeding automatically lesson by lesson and requested a per-lesson report.

| Lesson | Indicator slug | Source | Guide modules | Status |
| --- | --- | --- | ---: | --- |
| 1. Punctuation | `punctuation` | STEP course book pp.101–103 | 5 | Draft saved |
| 2. Capitalization | `capitalization` | STEP course book pp.104–106 | 4 | Draft saved |
| 3. Sequencing | `sequencing` | STEP course book pp.107–109; audited bank ASGQINSERT pp.194–196 | 5 | Draft saved |
| 4. Logical Connectors | `logical-connectors` | STEP course book pp.110–112 | 5 | Draft saved |
| 5. Error Recognition | `error-recognition` | STEP course book pp.113–116 | 5 | Draft saved |
| 6. Sentence Combining | `sentence-combining` | Audited bank `ASGQCOMBINE`, p.187 | 4 | Draft saved |
| 7. Logical Sentence Completion | `logical-sentence-completion` | Audited bank `ASGQLOGCOMP`, p.197 | 3 | Draft saved |
| 8. Spelling and Word Recognition | `spelling-word-recognition` | Audited bank `ASGQSPELL`, p.198 | 4 | Draft saved |

**Verified totals** (read-only SQL after all writes):
- Writing Analysis: **8 indicators, 8 saved guide drafts, 35 modules**.
- No invalid modules by section title/intro/page/array-size structural checks; no duplicate module IDs.
- **0** Writing indicators marked published, **0** Writing guide published snapshots, **0** Writing `legacy_course_code` assignments. Student publication unchanged.
- Grammar published indicators: **45**, unchanged.
- Historical data unchanged: **70** part attempts, **10** exam attempts, **259** recorded question details, **191** simulated-item reviews.
- An oversized first attempt to save one draft was rejected at the tool boundary. The same content was saved in small, guarded, idempotent operations and the resulting four modules were verified.

## Editorial notes per lesson

1. Punctuation: covers full stop, comma/list, nonessential appositive, colon, question/exclamation marks. The source uses a serial comma; do not teach it as an absolute rule in every English style.
2. Capitalization: preserves the source's four rule groups. Days/months and names differ from ordinary seasons and general subject names.
3. Sequencing: preserves four source rules; `ASGQINSERT` is taught as an in-lesson bank subtype, **not** a ninth unit. Distinguish paragraph sequencing from sentence-internal Word Order in Grammar.
4. Logical Connectors: reason, result, contrast, condition/purpose, contextual choices; distinguish clause-taking and noun-phrase-taking connectors.
5. Error Recognition: five source trap families, with an explicit editorial warning that the book's `informations ... are` example contains **more than one grammatical issue**, so it must not be released as a single-error scored item without reconstruction and review.
6. Sentence Combining: the two classified bank items are not enough to assess mastery; supplemental instructional examples are marked instructor-created.
7. Logical Sentence Completion: only one classified bank example is present. Draft explains textual consistency, not automatic link-word selection.
8. Spelling and Word Recognition: only one classified bank example is present. Draft separates spelling from Capitalization and Grammar, with instructor-created examples labeled.

## Publication gate for next phase

The **teaching drafts** have been staged; **a guide draft is not a released interactive lesson**. Next steps, in order:
1. Item-by-item audit of the source book / audited bank / TAJMEAAT samples, including ambiguous or defective option sets, provenance and duplicates.
2. Supply four-choice formative and graded questions across each module; if source coverage is insufficient, build and editorially validate simulated alternatives. Keep simulated status in the existing owner-only review workflow; do not present editorial provenance to students.
3. Assemble protected lesson/course banks **in private Supabase only**, bind them to the corresponding Writing indicators and confirm end-to-end student backend routing, mastery and scoring tests; do not assume Grammar-only routes already support Writing.
4. Publish a Writing indicator only after the complete guide, private bank, progress flow and security regression gates pass. Preserve the published Grammar courses, original question IDs, attempts, scores and source confidentiality.

**No original question stems, alternatives, answer keys or student identity data are included in this public repository report.**
