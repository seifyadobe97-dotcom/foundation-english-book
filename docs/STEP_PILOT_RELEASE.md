# STEP Pilot release procedure

The student-facing Present Simple lesson is `step-grammar-student/learn.html` with its v2 CSS, content and JavaScript. Student assessment is served by the authenticated Supabase `step-course` function.

All changes are first reviewed in pull requests. The two independent quality jobs must pass:
- STEP Pilot quality gate (contracts, privacy, lesson interaction on desktop/mobile)
- Foundation English quality gate (original interactive book)

A merged, successful pull request triggers a trusted follow-up release that checks out **main**, never untrusted pull request code. GitHub Pages publishes only after the merged pull request has passed both quality gates.

Student-facing question codes and source-management details remain private to staff. Pilot test scores may be reset explicitly during the later launch-cleanup phase; no score reset is required to ship this UI fix.
