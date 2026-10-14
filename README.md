# Foundation English Interactive Book

Interactive Foundation English book for the Institute: original A–Z plus the complete reading continuation.

Current learning model (108 static pages):
- Original A–Z: 45 preserved pages
- Part Two: short vowels, CVC blending, 10 word families, digraphs, long vowels, vowel teams, decodable sentences, and 5 original mini stories
- Total: 363 interactive answer slots across original and added exercises
- Full contents and source provenance: [Reading curriculum map](curriculum/CURRICULUM_MAP.md)

Original letter learning model:
- Letters A–Z in the source-book sequence
- Visual focus sound / IPA reference for each letter
- Reviewed vocabulary visuals, including child-friendly replacement of **gun → gift**
- Arabic dictionary with show/hide toggle
- Word pronunciation with **normal** and **slow** playback
- Three spoken example sentences under every vocabulary word
- Per-letter **Quick Check** with immediate feedback
- Mastery progress saved on the student's device
- Review quizzes after each letter group
- Listening / phonics practice after each letter group
- Automatic scoring and retry
- Mobile-first scrolling layout

Live student book:
https://seifyadobe97-dotcom.github.io/foundation-english-book/

## Unified recorded voice library (work in progress)

The static book now checks `audio/voice-manifest.json` for verified MP3 files before using its existing A–C audio or browser TTS fallback. The manifest is currently **empty**, so the unified voice library is **not yet recorded**.

- Canonical source: `audio/voice-corpus.json`
- Planned clips: **764** (26 letters, 148 normal + 148 slow word recordings, and 442 unique sentence recordings)
- Target voice: Azure `en-US-GuyNeural` — US English male
- Generator: `node tools/audio-library.mjs --plan`
- Recording workflow: **Actions → Render Foundation English Voice Library** (manual by letter, requires Azure Speech secrets)
- Setup and QA details: [audio/VOICE_LIBRARY.md](audio/VOICE_LIBRARY.md)

Legacy browser voice stays in place until published recordings are complete and validated. PWA caching remains disabled.
