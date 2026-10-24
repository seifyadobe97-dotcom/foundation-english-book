-- STEP WITH SEIFY — Writing Analysis taxonomy correction, 2026-10-24
-- Classification move ONLY. Existing published Grammar lessons, private question banks,
-- graded attempts and source-exact reviews are intentionally untouched.
-- Book chapter skills: Punctuation, Capitalization, Paragraph Sequencing,
-- Logical Connectors, and Error Recognition.
-- Grammar "Correct Word Order" (word order inside a sentence, ASGQWOR)
-- is DIFFERENT from Writing Analysis "Paragraph Ordering" (ASGQPARORDER).
-- Linking Words can support grammar teaching too, so keep a secondary reference
-- while the PRIMARY bank classification moves into Writing Analysis.
UPDATE public.step_question_bank_classifications
SET indicator_slug='logical-connectors',
    related_indicator_slug='conjunctions-and-connectors',
    updated_at=now()
WHERE code IN('ASGQLINKCAUSE','ASGQLINKRES','ASGQLINKCONTRAST','ASGQLINKTIME','ASGQLINK')
  AND indicator_slug='conjunctions-and-connectors'
  AND related_indicator_slug='logical-connectors';
-- The existing Writing Analysis classifications ASGQPUN, ASGQCAP, ASGQPARORDER,
-- ASGQERR already map directly to their Writing Analysis indicators.
-- Uncategorized sentence-combining, insertion, spelling and logical-completion
-- rows remain needs_review until the content is individually audited.
-- Writing Analysis lesson indicators remain drafts: taxonomy ≠ student release.
