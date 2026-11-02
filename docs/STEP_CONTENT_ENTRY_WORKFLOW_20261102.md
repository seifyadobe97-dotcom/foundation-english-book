# STEP Content Entry — controlled continuous authoring (2026-11-02)

## New page
\`step-grammar-admin/content-intake.html\`

The owner manages contributors by the **username of an existing active account** from this page. Contributors are stored in **step_content_contributors**, not **step_admin_accounts**, so they cannot access student reports, modify course releases, retrieve private bank content, or exercise owner endpoints. The browser uses a public Supabase anon key and **user JWT**, never service-role keys.

## Content lifecycle
1. A contributor or owner chooses Grammar/Writing lesson + section (or Reading passage + paragraph / Listening approved clip), enters original or authored question stem, A-D choices, suggested key, Arabic explanation and **separate Arabic explanation for every wrong alternative**.
2. Save one question or paste/import JSON containing 1–30 items. SQL enforces lengths, complete keys, allowed target, source reference and approved clip / section existence. Duplicate question stems against the same target are skipped; there is a uniqueness constraint for race protection.
3. New entries are **pending_review** only. Contributors can list **only their own entries**; the owner can list all entries.
4. The owner reviews content and documents a substantive review note, then **approves** or **rejects**. Approval is internal, NOT publication to students.
5. The owner may transfer an approved Grammar/Writing question into the existing Studio draft editor or to a *draft* Reading passage, where the item remains **unpublished**. The existing independent publishing/source-audit gates still apply. **Listening** requires audio/question grouping verification before transfer; it is deliberately staged only.
6. NEVER circumvent the owner-approved original-source review gate, or silently call a synthetic question a scanned original. Source questions without documented source page/key remain held for review.

No student scores, exams, answers, or private canonical bank contents are written by this workflow. Existing historic grades stay unchanged.

## ChatGPT import

When owner supplies new source Word/PDF material, ChatGPT can review the user-provided files and prepare a UTF-8 JSON package in exactly this schema:

\`\`\`json
{
  "items": [
    {
      "axis": "grammar",
      "target": "COURSE_CODE_FROM_OWNER_CATALOG",
      "part_index": 0,
      "origin_kind": "authored",
      "source_reference": "Source filename / page, or Authored by instructor",
      "question": "What is the subject in this sample sentence?",
      "options": {
        "A": "The first preposition",
        "B": "The main subject",
        "C": "The last adverb",
        "D": "The verb suffix"
      },
      "correct": "B",
      "explanation_ar": "الإجابة الصحيحة هي الفاعل الحقيقي للجملة، وليس أي اسم آخر.",
      "wrong_reasons": {
        "A": "حرف الجر ليس الفاعل المطلوب.",
        "C": "الظرف الأخير لا يمثل الفاعل.",
        "D": "نهاية الفعل ليست فاعل الجملة."
      }
    }
  ]
}
\`\`\`

**Field rules:** \`axis\` is \`grammar\`, \`writing-analysis\`, \`reading-comprehension\`, or \`listening\`. \`target\` must be a real item from the owner catalog (course code for Grammar/Writing; passage slug for Reading; approved sample_code for Listening). \`part_index\` is **0-based** for Grammar/Writing, **1-based** for Reading paragraphs, and **0** for Listening audio. \`origin_kind\` is \`original\`, \`simulated\` or \`authored\`. Always provide A–D and a 3-entry \`wrong_reasons\` object for the three incorrect letters **only**.

A generated or uploaded package is not an assertion of answer-key validity. Owner-led review is required before any downstream publication. The JSON is a one-click upload from the admin page and can also be inserted into the staging RPC with owner authorization. GitHub commits are **not** necessary for each question.

## Role assignment
- Create a normal authenticated account first via established secure account flow.
- The owner enters that active account's username on the Content Entry page and grants Content Entry only.
- Owner may revoke access at any time. Existing contributor entries are preserved for audit and cannot be edited/published by a revoked user.
- Staff **do not** receive full admin accounts or owner role, even if the user asks for "data entry".
- No real contributor was created in this release.

## Release conditions and limitations
- Manual QA: owner and contributor browser flows tested with synthetic login/RPC responses on mobile and desktop.
- Auth: verified owner and contributor role boundaries with transaction-scoped SQL, including denial of direct intake table reads and denial of contributor approval/publishing; test transactions rolled back.
- Real browser login, third-party mobile device playback and load tests still remain in production readiness issue #54.
- New questions created in the intake queue are **not** automatically student-visible. For Grammar and Writing, the canonical source-ledger validation remains required to publish the transferred Studio draft. Listening also needs reviewed recording-group integration. These gates must remain explicit until an owner-approved publishing policy is implemented.
