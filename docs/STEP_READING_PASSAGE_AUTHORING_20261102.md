# Reading — owner passage manager and source-review workflow

The Reading section uses complete **passages**, not Listening-style standalone audio questions.

## Current authoring workflow
1. Open the authenticated owner page `step-grammar-admin/reading-v2.html`.
2. Enter the English and Arabic titles, **source identification** and full English passage separated by blank lines into paragraphs.
3. Save as **draft**. No student sees it.
4. Open the draft in the Reading library, edit the text or metadata, then add the multiple-choice questions (A–D), proposed key, Arabic explanation and supporting paragraph.
5. Each new question is **needs_review**. Use the existing reviewer editor to audit, edit and approve individual questions.
6. Publication becomes available only when the passage has at least one question and **all questions have been approved**.
7. The passage becomes visible to active students; Reading attempts and results remain server-graded and are stored separately from Grammar, Writing and Listening.

Published passages cannot be edited by the draft-management RPC. Attempt-linked passages are protected from rewrites. To correct substantive issues in a published source, create a revised draft and explicitly reconcile existing students' grades instead of overwriting them. Existing Old Birds is left untouched, including its unapproved Q2 and existing Reading attempts.

## Source file ingestion by the assistant
When the owner provides a new Word, PDF or ZIP file in chat, inspect it first and keep a source inventory, then:
- Preserve passage text, original paragraph order, question stem, A–D choices and source-provided answer keys.
- Check each proposed key against its passage; identify ambiguities and unsupported answer keys instead of silently changing them.
- Explain corrections or disputes distinctly from original source content and record source name/page for internal admin review.
- Insert source-faithful passages and questions as **draft/needs_review**. Publish only after the content is reviewed and approved.
- If the file doesn't contain a key or paragraph evidence, record that gap and do not pretend an answer was in the source.

No new passage file accompanied this release. This change adds the administration controls, not new reading content.
