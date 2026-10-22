# STEP with Seify — Exercise integrity policy

## Student experience
- All scored and formative exercise questions are **four-option multiple choice (A/B/C/D)**, presented left-to-right.
- Teaching explanations, adaptive examples and sentence diagrams may be written or adapted by the instructor; **teaching examples are not test questions**.
- Student-facing screens show only the question, alternatives and Arabic corrective feedback. Do not expose original file names, page numbers, compilation identifiers, model numbers, item-bank IDs or editorial review notes.
- Not-yet-approved questions must not be made available as graded or formative exercises. Continue teaching the topic through explanations and examples where question coverage is still being reviewed.

## Editorial-only controls
- Source provenance is held separately in a restricted Supabase register named `step_foundation_source_ledger`, with RLS and no direct `anon` or `authenticated` table privileges.
- Before publication the owner/editor verifies each source question against its supplied original, including the complete four alternatives, correct key, skill fit, ambiguity and right to use it.
- The lesson author may add Arabic explanation for why every option is wrong or correct, but must preserve original item stem, four options, key and ordering.
- Do not describe an independently built STEP preparation platform as an official ETEC/STEP product or promise an official score equivalence.
- Protect question-bank answer keys for secure exams on the server. Browser-based foundation practice and its score are formative only.

**Internal operational note:** The existing original source bank and historical Git commits were authored while the repository was public. Hiding source labels from the learner UI and creating a protected register does **not** make an existing public GitHub source file confidential. Completing source confidentiality requires migrating remaining bank/source files to private storage and evaluating repository history and deployments.
