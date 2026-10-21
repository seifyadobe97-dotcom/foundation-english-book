# STEP with Seify — Scientific Assessment & Measurement Framework
**Status:** v0.1 — project design standard, **not** external certification.
**Baseline snapshot:** 2026-10-22. **Owner:** STEP with Seify.
**Intent:** Make all diagnostic, formative and summative scores interpretable, actionable, auditable and fair.

> This is an independent STEP preparation and learning platform. Alignment to ETEC's STEP and CEFR must be demonstrated with documented content mapping; it must **not** claim official endorsement, score equivalence, or accredited psychometric validity until externally substantiated.

## 1. Where the pilot stands
Verified from the project's live Supabase database (aggregate counts only):
- 47 curriculum indicators; **1 published**, **46 drafts**.
- 21 recorded practice attempts; 1 final-exam attempt.
- 14 question-level events recorded; 2 follow-up assignments.
- Current Present Simple published learning path: 6 learning sections with 20 vetted active questions; not a sufficiently broad or independent instrument for reliable standardized proficiency estimates.
- The GitHub repository is public, and an answer-containing lesson JSON file is versioned in that public repository. **Critical risk:** moving keys to a private server-controlled item bank is a release prerequisite before using the platform for secure, scored assessments. Merely hiding IDs in the UI is not question-bank security.

Historic totals, grades and accounts are preserved. Do not backfill unobserved durations or answers.

## 2. Reference standards and what they mean
1. **AERA/APA/NCME Standards for Educational and Psychological Testing (2014)** — explicit intended score uses; documentation for validity arguments, reliability/precision, fairness and consequences. https://www.testingstandards.net/
2. **ITC/ATP Guidelines for Technology-Based Assessment (updated July 2025)** — assessment construction, secure digital delivery, scoring, accessibility, fairness, privacy. https://www.intestcom.org/page/16
3. **Education Endowment Foundation — Teacher Feedback to Improve Pupil Learning (2021)** — assessment-driven, specific, actionable feedback and opportunities to act on it. https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/feedback
4. **CAST UDL Guidelines 3.0 (2024)** and WCAG 2.2 principles — accessible pathways, comprehension, response and assessment conditions. https://udlguidelines.cast.org/
5. **ETEC STEP official product page** — official test purpose and CEFR reference; independently validate any detailed test blueprint against ETEC's published information. https://etec.gov.sa/en/eservices-catalogue/individual/p-a04fa4d4-429a-4b95-9b7f-c50f0571d07c

Following a standard is **not equivalent** to certification by its publishers.

## 3. Measurement architecture (per axis → indicator → micro-skill)
Every published **indicator** gets a signed-off measurement specification:
- **Construct:** the exact English ability being inferred, including *what the score must not be used to infer*.
- **Learning outcomes:** observable statements (e.g., chooses bare infinitive after 'does'; distinguishes habitual present from a current action).
- **Sub-skill taxonomy / Q-matrix:** objective IDs and misconception IDs linked many-to-many to each item; one item may offer evidence for more than one skill.
- **Table of specifications (test blueprint):** target distributions of sub-skills, item formats, linguistic contexts, expected cognitive demand, and provisional difficulty.
- **Evidence model:** Claim → acceptable evidence → item/test task → marking rationale → confidence → recommended teaching action.
- **Assessment purposes** kept distinct:
  - **Diagnostic pre-check:** assess prior knowledge using unseen items before instruction.
  - **Formative practice:** low-stakes feedback on **every** selected option, including why distractors fail; no false claim that repeated practice equals exam readiness.
  - **Independent post-check:** secure unseen/parallel-form items, with a documented proficiency decision method.
  - **Delayed retention check:** different items revisiting the target after a defined interval; strengthens claims of retained learning.
  - **Mock STEP assessment:** construct-aligned broader assessment, scored separately from local indicator mastery. Do not map mock scores to official STEP scores without a formal linking study.

For Present Simple, map each of its six current learning sections and all 20 published practice questions to the specific objectives and misconceptions. Add independent unseen items for diagnosis/post/retention. Twenty repeated practice items are **not** sufficient evidence for a general English proficiency claim.

## 4. Bank governance and item validation
Required internal (admin-only) metadata per item:
`item_id`, `item_version`, `indicator_id`, `objective_ids`, `misconception_ids`,
`format`, `language`, `cognitive_demand`, `difficulty_provisional`, `source_licence`,
`answer_key`, `correct_rationale`, `distractor_rationales`, `editorial_status`,
`reviewer`, `reviewed_at`, `status`, `retired_reason`, `form_memberships`.

Publish only after two distinct checks: **subject-matter accuracy** and **measurement quality**:
- Unambiguously answerable; no unsupported, multiple-equal, mis-keyed or context-dependent item.
- Linguistically authentic, level-appropriate, unbiased wording; correct rendering on Arabic/English RTL/LTR and mobile.
- Each wrong answer maps to a *plausible, identifiable misconception*, not merely a random alternative.
- Explanations teach the rule and why the specific selected option is incorrect.
- Locked versioning: edits after a student's attempt must not silently change the historical meaning of that attempt.
- Bank diversity, separate practice and scored forms, and item-exposure monitoring.

Separate the **private answer key** and grading from all public website and public GitHub artifacts. The learner receives keys/explanations only *after server-side grading*.

## 5. Assessment event ledger and scoring
Capture an append-only, server-validated attempt event with:
`student_id`, `indicator_id`, `skill/objective IDs`, `assessment_id`, `form_id`,
`item_id`, `item_version`, `attempt_id`, `item_order`,
`selected_option`, `is_correct`, `submitted_at`, `active_elapsed_ms` (nullable),
`choice_changes`, `assessment_context` (diagnostic/formative/post/retention/mock),
`accommodation` (when applicable and consented), `telemetry_quality`.

- Idempotent submission keys; immutable answer/score audit; versioned marking decisions.
- **Do not silently drop telemetry failures.** Surface completeness rates and retry safely; grade correctness must not depend on telemetry.
- The time measured in the browser is **approximate interaction time** (network, tab visibility, assistive technology, distractions, revisits). Never label a learner slow, low-ability or cheating from elapsed time alone.
- Differentiate *time limit* (assessment administration setting) from *time spent* (descriptive observation). Accommodations and pause rules must be explicit.
- Avoid treating unanswered, skipped, exposed, repeated and first-seen responses as equivalent observations.

## 6. Psychometrics: progressive maturity, not fabricated precision
**Pilot stage:** show descriptive data: attempts, unique items, percentage correct, timing coverage, median interaction time, and uncertainty/small-sample warnings. Existing thresholds (e.g., 5 responses/3 distinct items) are a conservative *UI triage heuristic*, **not** a validated cut score.

**After sufficiently diverse, representative real responses:**
- Classical Test Theory: per-item facility/difficulty (p-value), item-total / point-biserial discrimination where applicable, and distractor-selection behaviour.
- Review reliability/precision on properly defined *tests/forms* (e.g., appropriate internal consistency and standard error), **not** on a tiny heterogeneous handful of tasks.
- Detect miskeys, ambiguous items, misfitting items, changed item functioning, and possible exposure effects; human review precedes any automatic retirement.
- Check fairness and differential item functioning only when group definitions, legal basis, sample size and privacy protections make that analysis supportable.
- Standard-setting panels (e.g., modified Angoff) should define defensible mastery cuts, reviewed against consequences. Never invent 80% as a universal validated standard.
- Consider IRT/Rasch or computerized adaptive testing **only after** enough calibrated item data, model-fit analysis, and stable administration conditions. Neither IRT nor AI guarantees accuracy on a tiny bank.

## 7. Reports must be per indicator, with transparent confidence
The hierarchy is: **Axis → Indicator → Student → Objective/sub-skill → Evidence → Intervention → Follow-up**.

**Indicator dashboard:** published state; blueprint completion; counts of distinct items and students; coverage; answer-event completeness; score distributions and uncertainty; question difficulty/discrimination with sample-size warnings; misconception frequency; item review queue; trend by cohorts with privacy limits.

**Student report within the chosen indicator:**
- Verified assessments attempted and dates; unique unseen tasks versus repeated practice.
- Objective-level strengths/opportunities with **sample coverage and confidence status**.
- Every recommendation explains *what evidence caused it* (missed distractor concept, multiple distinct items, repeated over time).
- Before/after comparison using **parallel or distinct items** when possible, and delayed retention later; initial differences are provisional, not causal proof of teaching impact.
- Response-time observations separated from mastery; no unvalidated personality, intelligence or attention labels.
- Action plan with teacher review, assigned video/lesson/practice, deadline, learner acknowledgment, post-check, and resolution or escalation.
- Explicit empty/unavailable state for indicators with no validated scored items. Do **not** borrow other indicators' results.

Use grades and privacy-safe aggregations by default. No unnecessary student ranking or public data comparisons.

## 8. Formative intervention engine
For a repeatedly observed misconception:
1. Explain the concept in learner-friendly Arabic, with a short English example.
2. Provide targeted Seify video / guided example / contrasting example.
3. Give fresh, *unseen* practice with selected-option feedback.
4. Verify in a new independent post-check, and revisit retention later.
5. Notify the instructor when the evidence remains insufficient or indicates persistent difficulty.

Use transparent, deterministic rules initially. Any AI-generated intervention or commentary must cite its evidence and undergo teacher approval in high-impact contexts. AI is never the authority for a score or diagnosis.

## 9. Safety, accessibility, governance
- Data protection by design: collect necessary events only, publish retention/erasure policy, restrict instructor access to authorized students, audit every modification, and design safeguards for minors.
- Ensure WCAG 2.2-aligned keyboard operation, screen readers, focus order, high contrast, captions/transcripts for videos, accessible listening controls, and time accommodations.
- Preserve accounts and historical results. Schema and item revisions must be additive and auditable; no implicit reset.
- Protect copyrighted/licensed item source material and keep source provenance admin-only.
- Explicitly distinguish **an educational preparation platform** from **an ETEC-endorsed official test**.

## 10. Release gates and evidence acceptance
**Scientific blueprint gate (before publishing an indicator):**
- 100% of scored questions mapped to documented objectives and reviewed item versions.
- 100% of published items pass accuracy, unique key, distractor rationale, accessibility and provenance audits.
- Defined test purpose, form assembly rule, feedback rule and initial provisional mastery policy.
- Separate unseen diagnostic/post sets or an explicit warning that valid change cannot yet be measured.

**Operational gate:**
- Authenticated, restricted, server-side grading; keys not accessible from public repo/site.
- Automated desktop/mobile accessibility and Arabic/English bidi regression tests; real authenticated student/admin end-to-end smoke test.
- Recorded item-level answers and server grades reconcile; reliable telemetry coverage tracked and missing data labeled.
- Security, permissions, privacy and export/retention reviewed.

**Psychometric gate (before using scores for consequential decisions):**
- Documented representative sample and model assumptions, form/item analysis, reliability/precision, fairness review, standard setting, and an explicit validity argument appropriate to the intended use.
- No assertion of official STEP score prediction without evidence from a separate linking/validation study.

## 11. Recommended implementation sequence
**Release A — Foundations:** item/objective Q-matrix, formal blueprint for Present Simple, private key migration, item and test versioning, event completeness diagnostics, assessment types, quality-gate tests.

**Release B — Measure → teach → measure:** independent diagnostic/post/retention forms, concept-specific distractor explanations, item-targeted teacher interventions, student follow-up confirmation, before/after evidence based on distinct items.

**Release C — Reporting and QA:** per-indicator dashboard, confidence-aware individual reporting, cohort QA, item metrics when samples permit, dashboards of measurement coverage and question review queues.

**Release D — Scale:** operationalize the validated template for remaining Grammar and Writing Analysis indicators, then Reading and Listening; expand reliable bank; consider adaptive difficulty and psychometric calibration only with adequate data.

## 12. Scientific documentation to keep alongside the code
- Assessment purpose and interpretation statement for each test.
- Skills taxonomy, Q-matrix, blueprint and form specification (versioned).
- Item review register and adjudicated answer-key ledger.
- Scoring rules, standard-setting study, data dictionary and administration instructions.
- Fairness/accessibility checklists, measurement precision report and validity evidence log.
- Pilot impact report, revision history and adverse-event handling.

**Next immediate deliverable:** complete the Present Simple `Assessment Blueprint v1` and `Q-matrix v1` from the actual vetted content, then secure answer keys and create independent pre/post items **before** labelling any student's mastery as established.
