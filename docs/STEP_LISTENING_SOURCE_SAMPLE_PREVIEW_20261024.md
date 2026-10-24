# Listening source-sample student preview — 24 October 2026
## Scope
- Two uploaded recordings from the user: Record 1 (teacher / exam date), Record 2 (eating habits), two questions per recording.
- Third SAD question group is in the DOCX but has no accompanying audio; intentionally not published.
- On the authenticated student dashboard, the Listening card links to `step-grammar-student/listening-samples.html`. This is an **ungraded pilot**, not a published Listening lesson or real exam.
- The listening-session/player engine is reused. Practice permits unrestricted replay and reveals teacher notes only after server grading. Trial simulation previews two questions for 30 seconds and offers one playback only, no review or grade.
- This static public site intentionally contains no MP3 files, transcript, correct answers, or source document. Students must select a matching local MP3 from their device; the sound is played locally with no upload. The supplied MP3s still need a controlled, licensed upload to private Storage and an authorized signed-media flow before online playback can occur without manual selection.
- Demo review is performed by a separate JWT-protected Supabase Edge Function `step-listening-samples`; only active student accounts can obtain sample marking. Sample responses are **never saved** to `step_part_attempts`, `step_exam_attempts` or `step_question_attempt_details`.
## Source inconsistencies corrected in the preview
- Record 1 Q1 source's answer says 'next Monday' but the supplied transcript gives exact 'Monday 26th December'. Preview asks which exact date was mentioned and uses the exact date as a choice. Must acoustically verify before treating this as a definitive production item.
- Record 2 Q2 source answer 'They should stop' is too broad: the transcript says 'should stop eating huge amounts of beef'. Preview uses that exact narrower recommendation.
- The third SAD transcript/questions are withheld because no source sound file was provided.
## Release gates before real student-course publication
Rights and acoustic verification of original files; storage upload; authenticated signed URLs; per-attempt server-enforced timer + one-play state; scored attempt persistence; owner QA and full device tests. No Grammar/Writing/Foundation content changes.
