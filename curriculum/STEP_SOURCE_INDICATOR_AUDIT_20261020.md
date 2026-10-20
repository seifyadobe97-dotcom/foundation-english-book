# STEP curriculum: source-verified indicator alignment (2026-10-20)

## Source documents
1. `STEP course book.pdf` — 154 pages. Original student-course book. Writing Analysis is on pp. **101–116**.
2. `STEP_Grammar_Question_Bank_Classifications_Audited.pdf` — 234 pages. Source for **91** coded bank-category headings and question-text groups.

## Learning axes
1. Reading Comprehension — no bank indicators imported yet.
2. Listening — no bank indicators imported yet.
3. Grammar — **42 lesson indicators** inherited from the prior curriculum map (1 published, 41 draft). These pedagogical lesson units are not one-to-one with bank-category headings.
4. Writing Analysis — **five book-defined lesson indicators**, all drafts.

## Five writing indicators, in exact source-book sequence

| # | Book section (English) | Book section (Arabic) | Source pages | Database slug | Related bank classification |
|---|---|---|---|---|---|
| 1 | Punctuation | علامات الترقيم | 101–103 | `punctuation` | `ASGQPUN` |
| 2 | Capitalization | الحروف الكبيرة | 104–106 | `capitalization` | `ASGQCAP` |
| 3 | Sequencing | ترتيب الجمل وتكوين الفقرات | 107–109 | `sequencing` | `ASGQPARORDER` |
| 4 | Logical Connectors | الروابط المنطقية | 110–112 | `logical-connectors` | Additional cross-reference to connector categories |
| 5 | Error Recognition | اكتشاف الأخطاء النحوية | 113–116 | `error-recognition` | `ASGQERR` |

**Material correction:** the book's third Writing Analysis section is *Sequencing of four sentences into a logical paragraph*, **not** the grammatical *Correct Word Order* category `ASGQWOR`. The latter remains separately flagged for mapping review.

## Bank crosswalk status
- **91** question-bank classification codes preserved verbatim with first page number.
- **75** categories mapped *provisionally* to an existing teaching indicator, including grammar categories that share a single lesson.
- **16** categories left unmapped until the institute decides whether to place them under an existing lesson or create a separate indicator:
  `ASGQCONMIX`, `ASGQINVCON`, `ASGQMODCONT`, `ASGQPARTPER`, `ASGQLIKEAS`, `ASGQWOR`, `ASGQCOMBINE`, `ASGQINSERT`, `ASGQLOGCOMP`, `ASGQSENT`, `ASGQSPELL`, `ASGQQFORM`, `ASGQQWH`, `ASGQNOUNCL`, `ASGQSUGG`, `ASGQINV`.

Provisional category matches do not constitute a question-level review of answers, explanations, duplicates, or rights to republish. **No additional questions were made visible to students.**

## Data safety and editorial workflow
- Present Simple stays published with course code `ASGQPRSIM` (legacy course `ASGQPRSIM`), and existing student attempt tables are unchanged.
- Newly mapped indicators remain **draft**.
- Bank source classification table has RLS enabled and no anonymous/student privileges.
- The admin page `step-grammar-admin/curriculum.html` displays category codes and unmatched headings.
- Only the authorized **owner** can link a bank classification to an indicator.
- Source-of-truth migration and SQL seed files are under `supabase/migrations/`.
