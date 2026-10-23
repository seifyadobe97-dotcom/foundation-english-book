# Lesson 18 — Modal Passive & Modal Perfect Passive | Source audit
**Release decision (2026-10-23): HOLD — owner-only editable draft; not released to students.**

## Audited provenance
- Primary original source: `STEP_Grammar_Question_Bank_Classifications_Audited.pdf`, **PDF pages 70–72**.
- Printed category `ASGQMODPASS` (7 entries, pages 70–71) and `ASGQMODPERPASS` (4 entries, pages 71–72).
- Related `ASGQMODPER` on page 71 is **active modal perfect**, excluded from Modal Passive grading.
- Compilation `TAJMEAAT 2026.pdf` repeats airport, conditional savings, and washing-machine patterns; repeated occurrences are not independent scored items.
- Teaching grammar follows modal passive formation (`modal + be + V3`); modal perfect passive (`modal + have been + V3`) is explicitly separated and expanded with instructor-written examples. Source book is not treated as proof of unverified exam question quality.

## Editorial register (IDs only — no private questions or keys)
| Category | IDs | Count |
|---|---|---:|
| Independent approved; in the private bank | MPASS-01, MPASS-02, MPASS-03, MPASS-04, MPASS-07, MPPER-01 | **6** |
| Ambiguous hold | MPASS-05, MPPER-03 | **2** |
| Duplicate / insufficient independent variation | MPASS-06, MPPER-02, MPPER-04 | **3** |
| Total individually reviewed | | **11** |

### Why the holds matter
- `MPASS-05`: future deadline does not clearly settle `be` versus `have been` construction without an anchored time of speech.
- `MPASS-06`: same near-template as previous question, also repeated in compilations.
- `MPPER-02`: same counterfactual construction and the same four answer choices as the preceding item; near-exact clone.
- `MPPER-03`/`MPPER-04`: same subject/stem in nearly identical question form; apparent newness does not alone establish which past event must have occurred.

## Implemented curriculum
- Mapped canonical grammar indicator `modal-passive` at **position 118** to private `ASGQMODPASSCORE`.
- **6 stages** with **24 instructor-created worked examples** and **6 approved source-exact original questions**.
- Grammar content: active/passive transformation, should/must passive, may/can passive, tense contrast, unreal past conditional passive, and past-deduction passive.
- Questions have four options, reviewed key, explanatory answer, and specific reasons for all three distractors.
- Private bank and source audit ledger are subject to **RLS; no public or authenticated direct read policy**.
- Studio direct editor: `step-grammar-admin/studio.html?course=ASGQMODPASSCORE`.
- Student access remains unavailable because canonical indicator stays `draft`; Foundation is unaffected.

## Publish gate
- Backed by the function `step_guard_lesson18_modal_passive_publish` and DB trigger `step_lesson18_modal_passive_gate` on the canonical indicator.
- To publish, requires **at least 12** independent verified source items, **at least 3** independently reviewed Modal Perfect Passive questions, **at least 2 items** in each assessed skill stage, six 4-example stages, four choices plus correct key and explanations, source-exact text/options/answers and no repeated stems within or across lessons.
- This is a **conservative quality threshold**, not a claim the current source contains enough questions.
- Negative publication test passed: attempted publish rejected; status remains `draft`.
- Snapshot before and after: **70** part attempts, **10** exam attempts, **259** question attempt details, unchanged.

**Next curriculum item:** Lesson 19 — Pronouns. Audit its own pages before including questions; do not source invented stems.
