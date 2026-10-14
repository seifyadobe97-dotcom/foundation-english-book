# Foundation English — Complete Reading Path

## Status
This is a continuation of the original stable, static, 45-page **A–Z** student book. The original letter lessons (including the `gift` substitution for source-book `gun`) remain in place. All new pages are written directly into `index.html`; there is **no runtime page generation** and no PWA cache reactivation.

The extended interactive book contains **108 pages**.

## Reading order and direct page links

| Pages | Module | What students learn |
| --- | --- | --- |
| 1–45 | Original A–Z | 26 letter pages and 18 review/listening pages, unchanged in order |
| 46–49 | A–F / A–L / A–R / A–Z cumulative reviews | Six listening choices per review |
| 50 | Part Two: reading map | Interactive unit navigation and pronunciation note |
| 51–55 | Short vowels a, e, i, o, u | Identify and read short-vowel words |
| 56 | Short vowels checkpoint | Six questions |
| 57–61 | CVC blending | Point → segment → blend → hear the complete word |
| 62–71 | Word families | -at, -an, -ap, -et, -en, -ig, -in, -op, -ot, -un |
| 72 | CVC and families checkpoint | Six questions |
| 73–78 | Consonant digraphs | sh, ch, th /θ/, th /ð/, wh, ph |
| 79 | Digraph checkpoint | Six questions |
| 80–84 | Long vowels | a_e, ee/ea, i_e, o_e, u_e |
| 85 | Long-vowel checkpoint | Six questions |
| 86–91 | Vowel-team unit 2 | ee, ea, oa, ow /oʊ/, ai, ay |
| 92–97 | Vowel-team unit 3 | oi, ow /aʊ/, ou, ar, or, oo /ʊ/ |
| 98 | Vowel teams / reading checkpoint | Six questions |
| 99–103 | Sentence reading | Five stepped fluency pages, five read-aloud lines and two checks each |
| 104–108 | Mini stories | Five short original stories with read-aloud lines and two comprehension questions each |

## Content totals

- **Original A–Z:** 45 static pages; 108 prior review/listening questions; 52 micro questions; 149 word-card placements; 447 example sentences.
- **Added:** 63 static pages: four cumulative reviews, one reading map, 43 phonics lessons, five checkpoints, five fluency pages and five mini stories.
- **New phonics checks:** 149 across 53 lesson, reading or story pages.
- **New checkpoint/review questions:** 9 × 6 = 54. All 162 combined review/listening questions use the existing Check / Try Again interface.
- **Total interactive questions:** 108 + 52 + 149 + 54 = **363** (not counting vocabulary audio buttons).
- New phonics practice scores and selected answers save to `localStorage` per lesson; 80% or more qualifies as Mastered.

## Which material came from the source?

The user-supplied Institute source specification explicitly identifies:
- The A–Z vocabulary list (already implemented).
- The sequence **Short Vowels → CVC Blending → Word Families → Digraphs → Long Vowels → Decodable Sentences → Mini Stories**. Vowel teams from source digraph units 2 and 3 are included as their own stage after long vowels.
- Short vowel order: a, e, i, o, u.
- Consonant digraphs in Unit 1, with its exact four-word lists:
  - sh: fish, shop, ship, wash
  - ch: chick, cherry, bench, branch
  - voiceless th: math, bath, tooth, teeth
  - voiced th: this, father, mother, brother
  - wh: wheat, whale, white, wheel
  - ph: dolphin, elephant, phone, photo
- Vowel-team examples and order from Units 2 and 3.

**Instructor-created extensions:** all teaching explanations for the phonics lessons, non-specified short-vowel/CVC/word-family examples, listening distractors, reading exercises, original five mini stories, and new checkpoint questions. These are not represented as verbatim source-book text.

## Pronunciation/reading safeguards

- The source `read` in `ea` examples is **present-tense** /riːd/, not past-tense /rɛd/.
- `ow` /oʊ/ as in *snow* must be distinguished from `ow` /aʊ/ as in *cow*.
- `oo` /ʊ/ in *book/look* is not the long `oo` in *moon*.
- Long `u` may be /juː/ (*cube*) or /uː/ (*tune* in common US pronunciation).
- Voiced and voiceless `th` are separate lessons.
- Segmentation boxes and IPA symbols are visual teaching aids only; **no isolated phonemes are played through ordinary word TTS**.
- New word and sentence playback falls back to device/Android speech synthesis. **No additional prerecorded MP3 voices have been falsely claimed or created.** The earlier A–Z speech-corpus plan remains separate.

## Verification and distribution

- The stability tests now verify 108 static pages and all 363 existing/new answer slots.
- Chromium tests cover first/last page, old A–Z, new phonics pages, correction/mastery persistence, new checkpoint scoring, story reading, and Android/iPhone-sized scrolling.
- GitHub Pages must not deploy unless quality jobs pass.
- The older debug APK is based on the earlier 45-page book. The Android build workflow has been updated to expect 108 pages, but **APK distribution can wait until the reading book has been accepted**.
