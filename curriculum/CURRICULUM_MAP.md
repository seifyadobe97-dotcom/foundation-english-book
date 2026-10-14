# Foundation English — Complete 118-page Interactive Book

## Source basis and edition notes
The first 45 A–Z pages and their 26 letter dictionaries are preserved. The user-supplied Institute curriculum provides the original A–Z vocabulary, the short-vowel progression, and the source vocabulary/order of digraph and vowel-team lessons. **The 10 newly inserted short- and long-vowel stories, their comprehension questions, and their Arabic vocabulary glossaries are instructor-created extensions, not reproduced pages from a source book.**

The original page-based static HTML and Arabic `قاموس` → `عربي ✓` show/hide interaction are retained. PWA caching stays disabled.

## Page-by-page curriculum

| Pages | Lessons | Notes |
| --- | --- | --- |
| 1–45 | Original A–Z student book | Unchanged 26 letters, 18 review/listening pages |
| 46–49 | A–F, A–L, A–R, A–Z cumulative reviews | 6 questions each |
| 50 | Part Two contents | Jump directly to reading units |
| 51–60 | Short a/e/i/o/u | **Each vowel lesson immediately followed by a five-line story** |
| 61 | Short Vowels Checkpoint | 6 questions |
| 62–66 | CVC Blending | a, e, i, o, u |
| 67–76 | Word Families | -at, -an, -ap, -et, -en, -ig, -in, -op, -ot, -un |
| 77 | CVC & Word Families Checkpoint | 6 questions |
| 78–83 | Consonant Digraphs | sh, ch, voiceless th, voiced th, wh, ph |
| 84 | Digraph Checkpoint | 6 questions |
| 85–94 | Long a/e/i/o/u | **Each long-vowel lesson immediately followed by a five-line story** |
| 95 | Long Vowels Checkpoint | 6 questions |
| 96–101 | Vowel Teams Unit 2 | ee, ea, oa, ow /oʊ/, ai, ay |
| 102–107 | Vowel Teams Unit 3 | oi, ow /aʊ/, ou, ar, or, oo /ʊ/ |
| 108 | Vowel Teams Checkpoint | 6 questions |
| 109–113 | Decodable Sentences | 5 fluency pages with 5 read-aloud sentences each |
| 114–118 | Original end-of-book Mini Stories | 5 stories, now also offering full-story playback and bilingual glossary |

## After-each-vowel story links

| Sound | Lesson page | New story page | Story title |
| --- | ---: | ---: | --- |
| Short a | 51 | 52 | Sam's Bag |
| Short e | 53 | 54 | Meg's Red Pen |
| Short i | 55 | 56 | Tim and the Pig |
| Short o | 57 | 58 | Tom and the Hot Pot |
| Short u | 59 | 60 | The Bug and the Cup |
| Long a | 85 | 86 | Kate Bakes a Cake |
| Long e | 87 | 88 | Lee and the Green Tree |
| Long i | 89 | 90 | Mike and the White Kite |
| Long o | 91 | 92 | Rose Writes a Note |
| Long u | 93 | 94 | The Mule and the Cube |

## Identical dictionary and practice system
- Original A–Z dictionaries are preserved exactly.
- **63 additional Arabic-English glossaries** now appear in every phonics lesson (43), reading page (5), existing story (5), and new vowel story (10).
- The same `dict`, `dictToggle`, and `hideArabic` behavior lets a student hide/show Arabic. No extra login needed.
- Every new vowel story has 5 listenable individual sentences and **Listen to the full story / Stop** controls.
- Every new story has **3 auto-corrected questions** (including a listening/sound discrimination item); existing lesson practice remains.
- Responses save in browser localStorage using unique IDs (`VSA` through `VSU`, `VLA` through `VLU`). `Mastered` requires at least 80%.
- Totals: 108 original review/listening questions + 52 letter micro checks + 54 added checkpoints/reviews + 179 phonics/reading/story questions = **393 interactive questions**.
- Total full-story buttons: **15** (10 new vowel stories + 5 existing end-of-book stories).

## Audio honesty and phonics safety
English playback uses the existing recorded-file-first audio engine followed by the available **browser or Android English Text-to-Speech** fallback. Neither the new stories nor the other 442 existing sentence audio files are claimed to have professionally recorded male-US MP3 files. These still require the separate planned audio library. No isolated IPA-phoneme TTS is used. Story reading uses complete natural sentences; common sight words are allowed to build coherent beginner stories.

## Files and quality
- `curriculum/phonics-course.json`: source-informed 43 staged lessons and 5 end-of-book stories.
- `curriculum/vowel-stories.json`: ten instructor-created vowel stories and their answer keys/glossaries.
- `curriculum/phonics-glossary.json`: 142 phonics word translations plus reading and old-story glossaries.
- `index.html`: the authoritative 118 static page objects.
- `tests/stability.mjs`: question, dictionary, story and legacy content integrity assertions.
- `tests/browser-smoke.mjs`: desktop/Android-sized/iPhone-sized navigation, story and practice checks.
- The released Android **debug APK** must be rebuilt from this edition before distributing it; signing and physical-device testing remain separate.
