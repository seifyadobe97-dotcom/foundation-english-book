# STEP Listening — Word-based questions and scored student records

Source document: **platform test.docx** (owner attachment). An original MP3 was provided for Record 1 and Record 2 only. The document's final SAD exercise has no accompanying MP3.

## Official learner naming
Every recording is a **سؤال استماع**. A Listening question may contain 1–10 multiple-choice subquestions. The default pre-audio reading time remains **15 seconds per subquestion**. In student UI, never label it «مجموعة».

## Prepared and published items

| Listening question | MCQs | Stored audio | Publication |
| --- | ---: | --- | --- |
| Record 1 — موعد الاختبار والوحدات | 2 | Private, checksum recorded | Approved |
| Record 2 — تغيّر العادات الغذائية | 2 | Private, checksum recorded | Approved |
| Record 3 — الاضطراب العاطفي الموسمي (SAD) | 3 | Not supplied | Draft; unavailable to students |

For Record 3, the exact Word source questions and answer positions are:
- Q1: *What information proves SAD is seasonal?* — **B: It happens in dark months.**
- Q2: *What does the professor think is the reason for differences in SAD symptoms?* — **C: unknown.**
- Q3: *What does the professor say about the light box treatment?* — **A: It's being tested.**

The complete Word transcript is stored privately alongside the drafted clip; the three MCQs are approved internally but not visible to students until the owner uploads the related MP3 and the clip and question are approved. Do not synthesize an audio recording without owner direction.

### Existing two approved exercises — editorial differences from Word
Previously approved question text for Record 1 Q1 was adjusted before this change: Word's key is **B: next Monday** while Word's transcript specifies **Monday 26th December**; the published question asks the exact date and marks **D**. Previously approved Record 2 Q2 similarly clarifies Word's **A: They should stop** to **A: Stop eating huge amounts of beef**, matching the supplied transcript. These two *already published, already attempted* items have **not been rewritten or rekeyed** here, preserving historical grades.

## Workflow
Owner admin: `step-grammar-admin/listening-audio.html`. The owner sees all three Listening questions, the individual subquestions and answer keys, whether MP3 is already published, and per-student scored attempt summaries. Owner can upload the missing licensed MP3 **for just Record 3**, without re-uploading Record 1/2. Duration is measured from local MP3 metadata before submission. Authorized server checks MP3 bytes, hashes, stores audio privately, and changes the existing draft to published. Only then can the authenticated student browse and start the question.

Student: `step-grammar-student/listening-live.html`. Students see only published audio questions and can view their saved grades, broken down by *training* and *simulation*. Historical grades for both modes are sourced from server-stored `step_listening_attempts` and `step_listening_responses` and displayed in the student Listening page and the main curriculum card. The admin listening report uses the same stored records.

No Grades/Grammar/Writing tables or historical scores are changed. Listening is a separate axis on the student dashboard, not silently merged with Grammar percentages. Retakes are represented as distinct graded attempts. Recording/copying external to the browser cannot be prevented absolutely.
