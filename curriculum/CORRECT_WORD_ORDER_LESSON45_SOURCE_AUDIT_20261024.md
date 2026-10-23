# Lesson 45 — Correct Word Order | Selected original source audit

**2026-10-24** · grammar indicator `correct-word-order` (position **145**) · private bank `ASGQWORDORDER` · current release **DRAFT pending CI**.

## Primary source and correct source identity
Source: `STEP_Grammar_Question_Bank_Classifications_Audited.pdf`, category `ASGQWOR`, printed PDF pages **145–157**. This category includes **61 printed question occurrences**.

A crucial data-quality characteristic: many originals share the *exact same generic instruction stem*, such as choosing the sentence with correct word order. Therefore, an independent exam question must be identified by **its source ID plus the full A–D option set**, not by generic instruction wording alone. The production trigger detects internal and cross-course duplicate questions by a normalized **stem and exact option set**. Stem-only duplicate detection would falsely collapse distinct original exam questions.

## Selected source verification
**13 individually selected original question occurrences reviewed** across rendered pages 145, 147, 148, 151, 152 and 154.
- **12 approved original source-exact graded items:** WORD-001, 007, 008, 011, 012, 013, 016, 027, 032, 042, 043, 045.
- **1 editorial hold:** WORD-044 contains identical distractors A/B. Its printed D key is not altered, but the item is omitted from scoring to avoid a lower-quality multiple-choice original.
- **48 other original occurrences were not individually approved in this pass**; no claim of a full 61-item audit or an automatic source score is made.

## Four owner-editable teaching stages
**16 instructor-created worked examples** and **12 original scored MCQs**:
1. Embedded questions (normal `WH + subject + verb` order): 2.
2. Natural S–V–O, complements and modifiers: 4.
3. Sequence, destination and purpose: 4.
4. Polite requests and imperative word order: 2.

All original source texts, four exact options and printed answer keys remain exclusively in protected Supabase tables. Each scored original has three specific wrong-option explanations; no invented training examples are graded.

## Gate and QA
DB trigger `step_lesson45_word_order_gate` requires >=12 source-approved distinct originals, >=2 scored examples and >=4 worked examples in each stage, exact text/options/keys and distractor feedback, uniqueness of complete question/option sets, and zero cross-course reuse. Direct SQL verification: **12/12 source exact, four stages ready, zero full-question duplicates internally and across other banks**.

Owner Studio editor: `step-grammar-admin/studio.html?course=ASGQWORDORDER`. The draft remains hidden from students until GitHub CI for the updated commit passes and database `published` status is explicitly verified.
