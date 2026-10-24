# STEP with Seify — Listening dual-mode architecture

Status: PLAYER PROTOTYPE ONLY. Not a published student course or a real secured listening exam. The user-specified 15 seconds/question remains an admin-configurable simulator rule pending official operations verification.

## Learner modes

| Behavior | Practice | Exam simulation |
| --- | --- | --- |
| Read questions | Unlimited time | 15 seconds × number of simultaneously visible questions |
| Audio | Replay, seek, pause freely | Automatic first play at countdown end; no app pause, seek or replay |
| Answers | Correct/revise at own pace | Questions/choices unlock when audio starts |
| Transcript | Provided by grading API only after training submission | Never delivered while exam attempt is active |
| Correct keys/explanations | Returned after grading | Server-only until exam finishes and review is explicitly authorized |
| Refresh | Can replay | Restore signed attempt state; never reset countdown or repeat previously played clip |

Group examples: 1 question = 15 seconds, 2 = 30 seconds, 3 = 45 seconds. A group uses ONE shared recording. No automatic replays per question. No post-audio answering limit has been specified by the user; keep configurable.

## Source code in this branch

- step-grammar-student/listening-session.js: independent, testable group-level timed playback state machine.
- step-grammar-student/listening-player.js: Arabic-first interface; questions/options in LTR; show transcript only after practice grading.
- step-grammar-student/listening-player.css: responsive.
- tests/listening-dual-mode.mjs and tests/fixtures/listening-harness.html: synthetic only; no real question/audio or source PDF.
- No published Listening lesson, account or server-side scoring is introduced by this change.

## Backend and private data, REQUIRED before enabling students

Create protected, versioned entities:
- step_listening_clips: private storage object, immutable checksum, duration, private transcript, reviewer approval.
- step_listening_groups: clip, ordered questions, 15-seconds-per-question rule, release status and mode permissions.
- step_listening_items: question and A–D choices, correct key, explanation and specific wrong-option rationales.
- step_listening_attempts: user, group, authoritative preparation deadline, audio_started_at, audio_finished_at, answer submission and technical interruption.
- step_listening_responses: attempt-scoped choices and server-side grading; separate from educational content.
- step_listening_events: advisory playback interruption/focus/timing events, never proof of cheating on their own.

Private answer keys, transcripts and signed media issuance rules are owned by Supabase Edge Functions after JWT and student-access checks; they are never stored in GitHub Pages student assets or included in an active exam group response.

Suggested protected protocol:
1. POST /listening/attempts validates account, approved groups, mode and generates attempt.
2. GET /listening/attempts/{id}/group returns group questions and resumable state; never correct key or script.
3. POST /listening/attempts/{id}/prepare verifies media readiness then fixes the server start/deadline based on approved question count (15×N). Begin preparation only after buffering.
4. POST /listening/attempts/{id}/play-start: record the first successful play / media grant; disallow new clip issuance for the same group.
5. POST /listening/attempts/{id}/answers: atomic write + server-side marking. Practice reveals review/script AFTER submit. Exam confirms accepted answers only.
6. POST /listening/attempts/{id}/finish then optional authorized complete exam review; no early release of upcoming group material.

Do not rely on a disabled replay button as exam security. Signed private audio URLs restrict casual sharing and new issuance, but a browser cannot fully prevent capturing or replaying already-downloaded media outside the player.

## Mobile autoplay reliability

Browsers may reject a delayed unmuted media.play call, especially mobile Safari. In the first student Start gesture, unlock the AudioContext and test headphones using a separate harmless tone; prefetch and verify the actual recording before the 15×N preview begins. Attempt audio automatically at deadline. Handle any rejected play Promise with an explicit first-and-only gesture button, WITHOUT restarting the reading deadline. A blocked autoplay attempt does not consume the only successful playback.

If a real audio file stalls, Bluetooth interrupts, visibility changes or the network disconnects, flag a technical failure and allow a fair retake/admin resolution. Never silently replay the exam or treat mere visibility changes as cheating.

MDN reference: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay

## Admin release gate and test matrix

- Upload only legally usable clips to PRIVATE Storage; provide scripts, audio QC and metadata.
- Bind approved questions with unique IDs, verified keys and full Arabic option rationales.
- Preview each group in practice and exam before owner approval.
- Ensure the same group ID maps audio-to-questions in both modes; avoid source provenance leaks.
- Run 15/30/45s deterministic tests, zero exam pre-reading, one successful exam play, unlimited practice replays, no pregrade script/key, grading, refresh/resume, media buffering and signed-url expiration.
- Confirm Safari iOS, Chrome Android, keyboard, headphones/Bluetooth and slow networks with a *real disposable testing account*.
- Only then enable Listening in the published student catalogue. Existing Grammar/Writing data, attempts and admin permissions remain untouched.
