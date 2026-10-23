# Lesson 19 — Pronouns | Verified original source audit
**Date:** 2026-10-23 | **Indicator:** `pronouns`, position **119**, code `ASGQPRONCORE`.

## Materials
- `STEP course book.pdf`, **PDF pages 9–12**: possessive adjectives versus independent possessive pronouns, reflexive pronouns, `by + self`, and book examples.
- `STEP_Grammar_Question_Bank_Classifications_Audited.pdf`, **PDF pages 89–101**: subject, object, possessive, reflexive, reciprocal, indefinite and demonstrative/other determiner categories.
- `TAJMEAAT 2026.pdf` is an internal corroborating source; repeated variants do not inflate the independent question count.

## Review reconciliation
**27 individually reviewed source items**, each registered in the private `step_source_item_reviews` table.

- **24 independently source-approved originals** in the private `ASGQPRONCORE` question bank:
  - Subject pronouns: **3** (PRN-SUB01, PRN-SUB02, PRN-SUB03).
  - Object pronouns: **3** (PRN-OBJ03, PRN-OBJ09, PRN-OBJ10).
  - Possessives: **7** (PRN-POSS01, PRN-POSS02, PRN-POSS03, PRN-POSS04, PRN-POSS05, PRN-POSS10, PRN-POSS17).
  - Reflexives: **5** (PRN-REF01, PRN-REF04, PRN-REF05, PRN-REF07, PRN-REF18).
  - Indefinites: **3** (PRN-INDEF01, PRN-INDEF03, PRN-INDEF04).
  - Demonstratives and other determiners: **3** (PRN-DEM01, PRN-DEM02, PRN-DEM03).
- **3 ambiguity holds**, kept out of grading:
  - `PRN-POSS15`: source options can permit *mine* and *it* without a unique intended referent.
  - `PRN-REF30`: singular *herself* reading of a sequential introduction cannot be safely ruled out in the source context.
  - `PRN-REC01`: both *each other* and *one another* are accepted for reciprocal reference; source does not have a single defensible correct answer.
- No source questions or answer keys are committed to public GitHub.

## Built lesson
- **8 edited instructional stages**, **32 instructor-created teaching examples**, **24 original source-exact MCQs**.
- Seven graded areas: subject, object, possessive adjectives, independent possessive pronouns, reflexive, indefinite, and demonstrative/other determiner.
- Reciprocal pronouns are fully explained but **unscored** due to the ambiguity in the only reviewed original.
- Each graded question retains the exact private source stem, A–D options, reviewed answer, contextual explanation and three specific distractor explanations.
- All content, including illustrations, is editable in `step-grammar-admin/studio.html?course=ASGQPRONCORE`.
- The source exam bank and student response records are distinct; no student scores were migrated or reset.

## Release rule
Database trigger `step_lesson19_pronouns_gate` blocks publishing unless:
- At least **20 source-approved exact, independent questions** are attached only once.
- All **8 stages** each contain **4 or more examples**, and every graded stage has at least 2 original items.
- All **6 source classifications** are covered and source stems, options and keys match the review ledger exactly.
- Each question has four options, a sufficient explanation and reasons for the three wrong options.
- The reciprocal stage remains unscored, and duplicates/overlaps between lesson banks are rejected.
- Publication status must be confirmed from the live database, with CI and student route checks.

**Lesson 18 remains draft** pending at least twelve source-approved independent Modal Passive questions and three Modal Perfect Passive originals.
