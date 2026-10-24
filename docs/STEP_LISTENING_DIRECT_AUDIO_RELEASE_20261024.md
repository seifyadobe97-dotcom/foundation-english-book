## Listening — direct student playback
- Private, JWT-authorized `step-listening-live` Edge Function is deployed to existing Supabase project and saved in source control.
- Two source-derived question groups (2 questions each) are staged with answer keys and Arabic rationales in RLS-protected tables. Both remain DRAFT until actual source MP3 files are uploaded, SHA-256 checked, and owner rights attestation submitted.
- A protected, owner-only upload console `step-grammar-admin/listening-audio.html` will upload the original MP3 files to existing **private** Storage; after approval, each group becomes available to authenticated students without any file selection.
- Student page `step-grammar-student/listening-live.html` retrieves signed audio URLs, preloads audio before countdown, reuses existing ListeningSession, provides 15 seconds per question for exam simulation, and saves server-graded attempts in independent Listening tables.
- No browser-shipped answer keys or transcript. Never reclassify Grammar/Writing/paused Foundation or alter old student grades.
- **Binary transfer limitation:** Current GitHub/Supabase connectors accept source text and database SQL / Edge Function deployments, not a raw chat-attached MP3 upload. Neither original audio file was uploaded via this connector. Initial group release therefore cannot be claimed complete until the owner performs a single admin upload.
- This is a normal graded learning exercise and a teaching simulation, not a locked-down official STEP exam. Signed URLs and in-app once-only controls do not stop capture outside the app.
- Source Q1 date remains the corrected precise 26 December variant; source Q2 beef recommendation remains the precise "stop eating huge amounts" variant, as previous preview.
