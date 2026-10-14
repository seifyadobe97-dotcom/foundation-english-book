# Foundation English — Voice Library V1

## Current state (2026-10-14)
The live book remains **static `index.html` with 45 pages**. The new voice player reads `audio/voice-manifest.json` first and prefers a locally hosted MP3 whenever that file is registered. Existing A–C audio URLs and `speechSynthesis` continue as temporary fallback for anything not yet recorded. **The empty manifest does not mean voice files were generated.**

The speech corpus was extracted from the live static HTML, not from the older `app.js` or `data.js`:

| Audio category | Distinct files planned |
| --- | ---: |
| Letter-name clips (A–Z) | 26 |
| Vocabulary in a normal rate | 148 |
| Vocabulary in a deliberately slower rate | 148 |
| Unique complete example sentences | 442 |
| **Total** | **764** |

There are 149 word placements in the book (148 unique words: **fox** occurs under F and X), and 447 sentence placements (442 unique spoken texts). Existing **2 Quick Check questions per letter** reuse their word or picture clips. `FOCUS SOUND` IPA symbols stay visual and **must not be spoken as isolated symbols by TTS**.

## Target voice and format
- Target: one consistent **Microsoft Azure Speech `en-US-GuyNeural`** voice (US English, Male).
- Format: self-hosted 24 kHz, 48 kbps mono MP3.
- Vocabulary: **separately synthesized** normal and slow takes. Slow SSML rate: -27%, not just browser playback-rate substitution.
- Sentences: separately recorded, lightly slower at -8%.
- Letter names: render as SSML `say-as interpret-as="characters"`.
- Focus-word examples reuse the normal vocabulary word recording.
- Audio files are stored under `audio/files/` and **only verified files** may appear in `voice-manifest.json`.

Azure documentation:
- https://learn.microsoft.com/azure/ai-services/speech-service/language-support
- https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech

**This uses an external paid speech service** and requires valid user-owned service credentials; no secret is included in the repository.

## Generate recordings through GitHub
1. Create an Azure AI Speech resource and check voice availability in that region and any applicable usage fees/terms.
2. In this GitHub repository open **Settings → Secrets and variables → Actions** and add:
   - `AZURE_SPEECH_KEY`: secret key of the Speech resource
   - `AZURE_SPEECH_REGION`: region code, e.g. `eastus` (match resource)
3. Open **Actions → Render Foundation English Voice Library → Run workflow**. Choose letter **A** for the first QA batch.
4. The workflow generates only that letter's assets, checks MP3 headers/size, commits files and a verified updated manifest, and triggers the existing Pages deployment.
5. Test voice quality, speaking rate, clear phonemes, and Android playback; then proceed B–Z as approved.
6. Do not switch off the speechSynthesis fallback or restore service-worker caching until *every* required clip is recorded and verified.

No action runs automatically on every push; generation is manual and per-letter to control cost and batch quality.

## Local usage

Requires Node.js 22+ and an Azure Speech key/region in environment variables.

```sh
node tools/audio-library.mjs --plan
node tools/audio-library.mjs --verify --letter A
AZURE_SPEECH_KEY=... AZURE_SPEECH_REGION=eastus node tools/audio-library.mjs --generate --letter A
node tools/audio-library.mjs --verify --letter A
# Explicit full-corpus generation is also supported:
AZURE_SPEECH_KEY=... AZURE_SPEECH_REGION=eastus node tools/audio-library.mjs --generate --all
```

Generation can be rerun safely: existing valid MP3 files are reused, new files are checked before registration, and progress is written into the manifest one clip at a time. A verified clip takes precedence over legacy `data-url`. Missing or playback-failed clips fall back to the previous behavior. Failed batches must not be advertised as a finished voice library.

## Source-of-truth and QA safeguards
- `audio/voice-corpus.json` is derived from the published static content, including exact case and punctuation of the sentences and the letter each belongs to.
- When editing vocabulary or sentences later, refresh the corpus before generating new audio and check that the `data-sentence` attributes match the visible sentences.
- Files for the same word, e.g. `fox`, are reused. Unique sentences receive a stable SHA-256-derived filename.
- The new `audio-library.yml` workflow is **manual** and requires GitHub Actions secrets; it will not generate anything while those secrets are absent.
- Keep current colors, mobile scrolling, logo, 45 pages, and service-worker unregistration intact.
- QA words: `quarter`, `queue`, `yacht`, `June`, `date`, `igloo`, `zipper` and vowels in context.
