# STEP WITH SEIFY — Writing Analysis / Grammar curriculum separation

**Reviewed:** 2026-10-24

## Curriculum axes

- **Grammar:** 45 published grammar lessons, including actual word order within the sentence and syntactic conjunctions.
- **Writing Analysis:** existing, separate axis with five draft lesson indicators. These five are **not** student-published yet.

| Writing Analysis lesson indicator | Book reference in the existing curriculum | Bank mapping |
| --- | --- | --- |
| Punctuation `punctuation` | STEP course book.pdf, pp. 101–103 | `ASGQPUN` |
| Capitalization `capitalization` | pp. 104–106 | `ASGQCAP` |
| Paragraph Sequencing `sequencing` | pp. 107–109 | `ASGQPARORDER` |
| Logical Connectors `logical-connectors` | pp. 110–112 | `ASGQLINKCAUSE`, `ASGQLINKRES`, `ASGQLINKCONTRAST`, `ASGQLINKTIME`, `ASGQLINK` |
| Error Recognition `error-recognition` | pp. 113–116 | `ASGQERR` |

The five connector categories previously had **Grammar as primary classification** and Writing Analysis as a secondary link. Their **primary classification now points to `logical-connectors`** and the Grammar course `conjunctions-and-connectors` remains a **secondary reference**. We did **not** remove or rewrite its published teaching units, question bank, answer keys, or students' historical progress.

**Do not mistakenly conflate these skills:** `ASGQWOR` (correct word order in a sentence) remains Grammar Lesson 45. `ASGQPARORDER` (sentence order within a paragraph) belongs to Writing Analysis sequencing. They are not interchangeable.

Five unresolved category records `ASGQCOMBINE`, `ASGQINSERT`, `ASGQLOGCOMP`, `ASGQSENT` and `ASGQSPELL` are presented in the Writing Analysis admin tab as **editorial candidates, not approved mappings**. They remain `needs_review` in Supabase; other unresolved grammar source categories stay in the Grammar review queue.

## Admin and student safeguards

The admin curriculum shows separate **Grammar** and **Writing Analysis** source-index counts, with labels for primary classification vs secondary cross-reference. Dedicated admin shortcuts open the requested axis directly using `curriculum.html?axis=grammar` and `curriculum.html?axis=writing-analysis`.

The five Writing Analysis lesson indicators remain draft, preserving the existing publish controls; until their actual source-verified content and questions are added and approved they must **not** appear as ready-made student lessons. No newly invented bank questions or unapproved examples were inserted by this classification correction.

## Non-destructive verification

Before correction: 45 Grammar lessons published, 5 Writing Analysis indicators draft, and 70 historical part attempts. After correction, all counts remained unchanged. Query `step_question_bank_classifications` to verify the five primary/secondary mappings, and re-run the STEP admin portal tests before GitHub Pages release.
