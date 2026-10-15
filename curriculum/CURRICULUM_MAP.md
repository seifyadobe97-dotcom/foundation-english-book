# Foundation English — 151-page complete sound-reading edition

## Provenance and teaching approach
The original 45 A–Z pages and Institute lesson order remain in place. The Institute source specification defines the phonics sequence and specific digraph/vowel-team word lists. **All 33 new non-vowel pattern stories are instructor-written**, inspired by that sequence, not claimed to be literal reproductions of an unavailable original story book. The 10 short/long vowel stories and 5 end-of-book stories remain.

After **every one of the 43 phonics/pattern lessons**, the following page is a five-sentence illustrated mini story. The enforced learning order is **Focus Sound → Word Group (normal/slow audio) → Arabic Vocabulary Dictionary → Story (whole/line audio) → Word & Listening Check (3 questions) → Story Comprehension Check (3 questions)**. The next story is accessible from a direct button at the end of each word dictionary. All 6 existing questions per lesson/story pair retain their original IDs and localStorage mastery (80% threshold). Non-focus sight words are used sparingly to make coherent stories.

## Page map

- **1–45**: Preserved A–Z letter vocabulary, original audio, IPA, dictionaries and original assessments.
- **46–49**: Cumulative A–F, A–L, A–R, A–Z reviews.
- **50**: Interactive reading-path contents.
- **51–60**: SHORT VOWELS — 5 lessons with a story directly after each.
- **62–71**: CVC BLENDING — 5 lessons with a story directly after each.
- **72–91**: WORD FAMILIES — 10 lessons with a story directly after each.
- **93–104**: CONSONANT DIGRAPHS — 6 lessons with a story directly after each.
- **106–115**: LONG VOWELS — 5 lessons with a story directly after each.
- **117–128**: VOWEL TEAMS — UNIT 2 — 6 lessons with a story directly after each.
- **129–140**: VOWEL TEAMS — UNIT 3 — 6 lessons with a story directly after each.
- **61, 92, 105, 116, 141**: Stage checkpoints (six graded questions each).
- **142–146**: Five decodable-sentence/reading fluency pages.
- **147–151**: Five existing end-of-book mini stories (whole-story and line audio, bilingual dictionary, comprehension checks).

## Exact story placement

| Skill / sound | Lesson page | Immediately following story page | Story title |
|---|---:|---:|---|
| Short a | 51 | 52 | Sam&#39;s Bag |
| Short e | 53 | 54 | Meg&#39;s Red Pen |
| Short i | 55 | 56 | Tim and the Pig |
| Short o | 57 | 58 | Tom and the Hot Pot |
| Short u | 59 | 60 | The Bug and the Cup |
| Blend short a | 62 | 63 | Dan and the Map |
| Blend short e | 64 | 65 | Ben&#39;s Red Pen |
| Blend short i | 66 | 67 | Kim and the Pig |
| Blend short o | 68 | 69 | Dot on the Pot |
| Blend short u | 70 | 71 | Gus and the Bug |
| Family -at | 72 | 73 | The Cat and the Hat |
| Family -an | 74 | 75 | Dan and the Pan |
| Family -ap | 76 | 77 | A Nap for the Pup |
| Family -et | 78 | 79 | A Wet Pet |
| Family -en | 80 | 81 | Ben and Ten Hens |
| Family -ig | 82 | 83 | The Big Wig |
| Family -in | 84 | 85 | Finn and the Pin |
| Family -op | 86 | 87 | Hop to the Top |
| Family -ot | 88 | 89 | A Dot on the Pot |
| Family -un | 90 | 91 | A Fun Run |
| sh — /ʃ/ | 93 | 94 | The Fish Shop |
| ch — /tʃ/ | 95 | 96 | The Chick and the Cherry |
| th — quiet /θ/ | 97 | 98 | Beth Brushes Her Teeth |
| th — voiced /ð/ | 99 | 100 | This Is My Family |
| wh — /w/ | 101 | 102 | The White Whale |
| ph — /f/ | 103 | 104 | A Photo of a Dolphin |
| Long a — a_e | 106 | 107 | Kate Bakes a Cake |
| Long e — ee / ea | 108 | 109 | Lee and the Green Tree |
| Long i — i_e | 110 | 111 | Mike and the White Kite |
| Long o — o_e | 112 | 113 | Rose Writes a Note |
| Long u — u_e | 114 | 115 | The Mule and the Cube |
| ee | 117 | 118 | A Deer by the Green Tree |
| ea | 119 | 120 | Tea at the Beach |
| oa | 121 | 122 | The Goat and the Boat |
| ow — long o | 123 | 124 | Snow by the Window |
| ai | 125 | 126 | Rain on the Train |
| ay | 127 | 128 | A Day to Play |
| oi | 129 | 130 | The Lost Coin |
| ow — as in cow | 131 | 132 | The Brown Cow and the Owl |
| ou | 133 | 134 | The Mouse and the Clouds |
| ar | 135 | 136 | A Star over the Farm |
| or | 137 | 138 | The Horse and the Corn |
| oo — short | 139 | 140 | Look at the Book |

## Verified book totals

- **151 static pages**: original 118 pages plus 33 new stories.
- **43 immediately-following phonics stories**: 10 original short/long vowel stories plus 33 additional stories.
- **5 end-of-book mini stories** retained. **48** whole-story listen buttons in total.
- **96 additional bilingual glossaries** on phonics, reading and story pages; **26** original letter dictionaries still present.
- **492 corrected answer slots**: 162 review/listening, 52 letter Quick Checks, 278 phonics/fluency/story Quick Checks.
- **165 new per-sentence playback buttons**, plus 33 whole-story buttons.
- Original A–Z word/sentence corpus and the source digraph word lists are unchanged.

## Audio and version limits

The recording pipeline for a single professionally recorded American male voice is still not filled with MP3 assets. The stories are playable through the existing speech engine/browser or Android fallback, not new studio recordings. Isolated IPA symbol pronunciation is not synthesized.

Students' phonics mastery is saved under unique story IDs `SP01`–`SP33`. A one-time page-number migration maps earlier 108/118-page last-read positions into this 151-page edition. Old share links that encode numeric page fragments may shift because lessons now have interleaved stories; students should use the in-book contents navigation.

Tests cover source integrity and story placement for all 43 lessons, all glossary buttons, all story playback and saved mastery, as well as full-page and Android/iPhone-sized viewport navigation. The offline debug APK, if rebuilt, uses the existing PDF-derived Institute logo and is not production-signed.

## Verified strict-order implementation (October 15, 2026)

- Exactly **43** sound/pattern lessons, each immediately followed by **its own story page** in exactly the source-ordered lesson progression (see table above).
- Every sound page is ordered: **FOCUS SOUND → Read & Listen vocabulary group → the same words, in the same order, in the bilingual Arabic dictionary → Read the story button**. There is no quiz interrupting the dictionary-to-story transition.
- Each immediately following story page is ordered: **full-story/line-by-line listening → five written story sentences → story dictionary → 3 word-and-listening questions → 3 story comprehension/listening questions**. All 258 original sound/story question slots (43 × 6) are preserved; no keys, answer choices or saved-mastery identifiers changed.
- Stage checkpoints remain at pages **61, 92, 105, 116, 141**, between complete sound/story pairs, never between a sound and its story.
- Initial A–Z learning remains in its original source-aligned 45-page order. **A–Z pages do not have dedicated after-each-letter stories**; that would be a separate curriculum expansion, not part of this strict order patch.
- All 5 reading fluency pages and 5 original end-of-book mini-stories remain after the sound lessons and the last checkpoint.
- Original source-book complete story text was not included in the supplied project reference; this is a source-*sequence*-aligned instructor-created reading curriculum, not a claim of word-for-word reproduction.
- Automated structural checks validate exact lesson vocabulary against dictionary entries, page adjacency, both retained practice blocks, the 43 direct story links and all 151 sequential page numbers. Chromium browser checks verify touch/mobile navigation, playback buttons and stored marks.
