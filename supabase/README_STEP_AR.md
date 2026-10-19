# STEP Grammar student accounts — pending Supabase deployment

This folder contains the **prepared**, not yet deployed, Supabase integration for the **Present Simple** pilot.

Current production pilot remains unchanged:
https://seifyadobe97-dotcom.github.io/foundation-english-book/step-grammar-pilot/

Prepared components:
- migrations/20261019_step_student_auth.sql — student profiles, read-only student access to grades, account creation trigger.
- functions/username-login — validate username/password using Supabase Auth without returning user email to the browser. Keep the service-role secret ONLY inside Supabase.
- functions/step-course — server-side grading, sequential 60% unlocking, exam gating, per-user attempt storage.
- functions/step-course/lesson-data.json — the 6-section, 19-question pilot.

**Deployment prerequisites**:
1. A dedicated Supabase project must be selected/created.
2. Configure Auth for email/password and email confirmation, including redirect URL for the GitHub Pages pilot.
3. Apply the SQL migration to the project.
4. Deploy the two Edge Functions using project-specific credentials stored in Supabase environment secrets.
5. Connect the GitHub Pages frontend with the project's PUBLIC URL and anon/publishable key (not the service-role key).
6. Run a real sign-up -> email confirmation -> username login -> 60% unlock -> final exam -> return on another device acceptance test.

Never store passwords, service-role credentials, or private user tokens in GitHub.

**Do not claim the backend is live until steps 1–6 have actually succeeded.**

Future admin tooling can use secure server routes with dedicated permissions; students have read-only policies for grades.
