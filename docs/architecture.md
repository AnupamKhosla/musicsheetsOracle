# Architecture

Musicsheets is a Next.js 16 app that turns Western MusicXML sheet music into
Hindustani Bhatkhande notation, side-by-side with the original staff, and lets
the user play both. This file is the "big picture first, code second" reference
for any future contributor.

The next file in this folder — `HANDOVER.md` — is the live session log and
context dump for resuming work.

---

## 1. Big picture

```
            ┌──────────────────────────────────────────────────┐
            │            MongoDB (musicsheets collection)       │
            │   { sheetName, Artist, Genres, scale, date,     │
            │     password (bcrypt) }                          │
            └──────────────────────┬───────────────────────────┘
                                   │ GET /api/posts/[id]
                                   ▼
   ┌─────────────────────────────────────────────────────────────┐
   │  src/app/post/[id]/page.tsx                                  │
   │  ─ post header (title, artist, genre, scale, date)           │
   │  ─ tab switcher:  "Western Staff"  /  "Indian Bhatkhande"    │
   │  ─ active tab renders one of:                                 │
   │       OSMDWrapper  (Western: SVG staff via opensheetmusicdisplay)│
   │       IndianNotation (Indian: hand-built swara grid)         │
   │  ─ PlayerControls per tab (Western / Bhatkhande)              │
   │  ─ Lyrics section (parsed from MusicXML, rendered separately)│
   └─────────────────────────────────────────────────────────────┘
                                   │
                ┌──────────────────┴───────────────────────┐
                ▼                                          ▼
   ┌────────────────────────┐               ┌────────────────────────────┐
   │  Western path          │               │  Indian path                │
   │  OSMDWrapper           │               │  IndianNotation             │
   │  (opensheetmusicdisplay)              │  (custom React component)   │
   │  ─ SVG staff, no lyrics│               │  ─ Devanagari swara grid    │
   │  ─ no title/credits    │               │  ─ komal/tivra markers      │
   │    (rendered by post   │               │  ─ 5 saptaks                │
   │     page itself)       │               │  ─ beat-marker row          │
   └────────────────────────┘               └────────────┬───────────────┘
                                                         │
                                                         ▼
                                          ┌──────────────────────────────┐
                                          │  src/lib/bhatkhande.ts        │
                                          │  convertToBhatkhande()        │
                                          │  ParsedScore → NotationData   │
                                          └──────────────┬───────────────┘
                                                         │
                              ┌──────────────────────────┴─────┐
                              ▼                                ▼
                ┌─────────────────────────┐      ┌────────────────────────────┐
                │  NotationData            │      │  src/lib/midi.ts            │
                │  (rendered as swara grid)│      │  extractWesternEvents()     │
                └─────────────────────────┘      │  ParsedScore → MidiEvent[]  │
                                                  └──────────────┬──────────────┘
                                                                 ▼
                                                  ┌──────────────────────────────┐
                                                  │  src/lib/audio.ts            │
                                                  │  Tone.PolySynth(Tone.Synth)  │
                                                  │  playEvents(MidiEvent[])     │
                                                  │  triangle / sine / square    │
                                                  │  / sawtooth oscillator       │
                                                  └──────────────────────────────┘
```

Everything funnels through one parser (`parseMusicXML.ts`) so the Western
view, the Indian view, the lyrics block, and the audio engine all read the
same `ParsedScore` — they cannot drift out of sync.

---

## 2. Data formats

### 2.1 MusicXML (input)

We read standard MusicXML 3.0 / 4.0 — both `.xml` (raw) and `.mxl` (zipped)
via `jszip` (loaded on demand only when a `.mxl` is requested). We only read the
**first part** of a score (the melody). Voice selection is "primary voice" =
voice with the most pitched notes.

What we extract per score:
- `<work><work-title>` or `<movement-title>` → `title`
- `<attributes><key><fifths>` + `<mode>` → `key` (Circle of fifths + major/minor/none)
- `<attributes><time><beats>/<beat-type>` → `time`
- `<attributes><divisions>` → `divisions` (ticks per quarter note)
- Each `<note>` → `ParsedNote` (see `src/lib/parseMusicXML.ts:23-32`)
- Each `<lyric><text>` → pushed to `lyrics[]` for the separate lyrics block

We currently **ignore**: `<credit>` (composer/lyricist/free text), `<sound>`
(MIDI program), `<tie>` (we handle tied notes but only via the simple
`type="start"`/`type="stop"` attributes on `<note>`, not the full `<tied>`
hierarchy), `<beam>`, `<slur>`, ornaments, dynamics.

### 2.2 ParsedNote (internal)

```ts
interface ParsedNote {
  step: string;          // 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'
  alter: number;         // -1, 0, 1 (in semitones from step)
  octave: number;        // scientific pitch (C4 = middle C)
  duration: number;      // in divisions
  voice: string;         // MusicXML voice number, '1' if absent
  isChord: boolean;      // <chord/> element present (note continues previous)
  isRest: boolean;       // <rest/> element present
  tieStart: boolean;     // <tie type="start"/> present
  tieStop: boolean;      // <tie type="stop"/> present
}
```

### 2.3 NotationData (internal, output of converter)

```ts
interface NotationData {
  title: string;          // from MusicXML
  saName: string;         // 'C', 'C#', ... the pitch class of Sa
  saSemitone: number;     // 0..11
  saOctave: number;       // absolute octave of Sa (found by scanning)
  beats: number;          // from <time><beats>
  beatType: number;       // from <time><beat-type>
  taal: TaalDef | null;   // matched from sargam-spec's 7 taals
  taalNameLabel: string;  // "Kehrwa", "Teentaal", "4-beat", ...
  rows: DisplayRow[];     // the grid, grouped 8 beats per row
  voiceUsed: string;      // which voice was picked (e.g. '5')
  warnings: string[];     // currently unused; the visible warning is the static banner
  language: Language;     // 'hindi' | 'english' | 'bangla'
}

interface DisplayRow {
  cells: string[][];      // one cell per beat, each cell holds 1+ swaras
  beatMarks: string[];    // 'सम' for beat 0, '१' '२' … for subsequent beats
}
```

### 2.4 MidiEvent (internal, for audio)

```ts
interface MidiEvent {
  midi: number;           // standard MIDI note number: C4 = 60, A4 = 69
  startBeat: number;      // 0-based beat index
  durationBeats: number;  // how long the note holds
}
```

Computed via standard MIDI: `midi = (octave + 1) * 12 + semitone_from_C`,
where `semitone_from_C` is the natural semitone of the step plus the explicit
alter plus the key-signature alter.

### 2.5 Note on the "Indian" player

The Indian view's player plays **the same MIDI events** as the Western view's
player. The audio engine doesn't know or care about sargam — pitch is pitch.
The "compare" the user gets is visual: hear the music once, see the swara
grid in one tab, see the staff in the other.

---

## 3. File-by-file reference

### 3.1 `src/lib/parseMusicXML.ts`

The single source of truth for XML → internal data.

| Function / member | Purpose |
|---|---|
| `loadMusicXmlFromUrl(url)` | Fetches a URL, detects `.mxl` by ZIP magic bytes, unzips with `jszip` (dynamic import), returns the inner score XML. For `.xml`, just `text()`. |
| `parseMusicXMLString(xml)` | String → Document → `parseMusicXMLDoc`. |
| `parseMusicXMLDoc(doc)` | Walks the DOM. Returns `ParsedScore` (key, time, divisions, title, notes, lyrics). Picks first part, picks primary voice later. |
| `buildKeyAlter(fifths)` | Returns `Record<step, alter>` (e.g. `{F: 1, C: 1}` for 2 sharps). |
| `SHARPS`, `FLATS` | The two circles-of-fifths arrays. Order matters — `'F'` is the first sharp, `'B'` is the first flat. |

### 3.2 `src/lib/sargam-data.ts`

Ported from `Studio-kalavati/sargam-spec` (EPL-2.0). Factual data, not code.

| Member | Purpose |
|---|---|
| `I_NOTE_SEQ` | The 14-element chromatic swara sequence: `[:s :-r :r :-g :g :m :m+ :p :-d :d :-n :n :- :a]`. Index 0..11 maps directly to semitone-from-Sa. |
| `SAPTAKS` / `SAPTAK_MARKERS` | The 5 saptaks and the Unicode marker we append to each swara glyph: ati-mandra (2 dots below), mandra (1 dot below), madhyam (none), taar (chandrabindu), ati-taar (2 chandrabindu). |
| `SWARA_LABELS` | Per-language Devanagari / English / Bangla label tables. Hindi uses U+0952 (anudatta) for komal and U+0951 (udatta) for tivra Ma — proper Devanagari combining marks, not the Latin combining line we'd been using. |
| `TAALS` | 7 taal definitions: Teentaal, Jhaptaal, Ektaal, Rupak, Dadra, Kehrwa, Ada Chautaal. Each has bhaags, sam/khaali positions, and the 5-saptak-style metadata. |
| `TAAL_LABELS` / `RAGA_LABELS` | Localized display names for the above. |
| `VARJIT_SVARAS` | Raga → forbidden-swaras map. Currently used only as dead data; the raga picker was removed. |
| `LIST_OF_THAATS` | The 10 thaats for the heuristic. |
| `findTaalByBeatCount(beats)` | Looks up a taal by its total beat count. |
| `saptakForOctave(noteOct, saOct)` | Returns the saptak for a note given its absolute octave and Sa's absolute octave. |

### 3.3 `src/lib/bhatkhande.ts`

The pure conversion. The most important file in the project.

| Function | Purpose |
|---|---|
| `convertToBhatkhande(opts)` | The one and only entry point. `ParsedScore` + language → `NotationData`. |
| Internal: `pickPrimaryVoice(notes)` | Returns the voice number with the most pitched notes. Polyphonic scores (Canon in D, Rachmaninov) get a single voice. |
| Internal: `findSaOctave(notes, saSemitone, keyAlter)` | Scans notes for the first one whose effective pitch class equals Sa's, returns its absolute octave. This is the bug-fix that replaces the old hardcoded `MADHYAM_OCTAVE = 4`. |
| Internal: `pushSwara(swaraText, start, end)` | Pushes the swara text into `allBeats[start]` and em-dashes into `allBeats[start+1..end]` to represent the held duration. |
| Internal: tie handling | When `tieStart` is set, subsequent tied notes accumulate into a single held note. The em-dash extension is computed in the tie-active branch. |
| Internal: chord handling | `<chord/>` notes don't advance `cumDiv`; they're placed in the same beat as the previous note. |
| Bug fix #1 | `komal`/`tivra` decision now uses `totalAlter` (key + accidental), not `explicitAlter` alone. |
| Bug fix #2 | Sa's octave is found from the score, not hardcoded to 4. |
| Bug fix #3 | Taal label is set silently for non-sargam meters (no warning). |
| Bug fix #4 | Beat marks emitted per display row, not once globally. |
| Bug fix #5 | `<chord/>` no longer double-advances the timeline. |
| Bug fix #6 | `<tie>` notes merge into a single held note. |
| Bug fix #7 | Voice selection is silent. |
| Bug fix #8 | `<key>`/`<time>`/`<divisions>` read from the first measure of the first part, not `document.querySelector` first-match. |
| Bug fix #9 | `mode="none"` infers Sa from the first pitched note. |

`NotationData` is the return shape. The `rows` array is the grid; each row has
`<= 8` cells; the beat-marks row is rendered immediately above each swaras
row in the React component.

### 3.4 `src/lib/midi.ts`

| Function | Purpose |
|---|---|
| `pitchToMidi(step, alter, octave, keyAlter)` | Standard MIDI: `(octave + 1) * 12 + STEP_TO_SEMITONE[step] + totalAlter`. |
| `extractWesternEvents(parsed)` | Walks the parsed score (chord-aware, tie-aware, voice-picked) and produces `MidiEvent[]`. This is what the audio engine plays. |
| `extractIndianEvents(parsed, data)` | Currently returns the same events as `extractWesternEvents`. The function exists so callers can be wired to either source by intent, and so the API documents that the Indian view's audio is the same audio. |
| `mod(n, m)` | Always-positive modulo. |

### 3.5 `src/lib/audio.ts`

Tone.js wrapper. The audio engine.

| Function / member | Purpose |
|---|---|
| `Voice` | `'sine' \| 'triangle' \| 'square' \| 'sawtooth'`. The player picker exposes these. |
| `VOICE_PARAMS` | Per-voice oscillator type and ADSR envelope. Triangle is the default (closest to a basic organ/harmonium). |
| `getSynth(voice)` | Lazy-creates and caches a `Tone.PolySynth(Tone.Synth, ...)`. Disposes the old one if the voice changed. |
| `midiToNoteName(midi)` | Standard MIDI → `"C4"` etc. Pass note name to `triggerAttackRelease` (more reliable than raw frequency). |
| `preloadSamples(_voice)` | No-op with synth, but kept for API stability. With a real Sampler voice, this would warm up the sample buffers. |
| `playEvents(events, opts)` | Schedules each `MidiEvent` on the synth. Returns a `PlaybackHandle` with `stop()` that **disposes the synth outright** (silence in one audio frame, no envelope release tail). |
| `stopAll()` | Releases all currently held notes on the global synth. |

Why synthesized and not sampled? Earlier version used Tone.Sampler with the
Salamander piano (~8 MB of MP3s from a CDN). Failed when the user's account
had insufficient credits for the model's `max_tokens`, and the Sampler's
buffer-not-loaded race condition caused mid-playback errors. Direct
synthesis: zero network, zero loading, instant playback. Real piano and
harmonium can be plugged in later by replacing the `getSynth(voice)` body for
those two voice names.

### 3.6 `src/components/IndianNotation.tsx`

React component that renders a `NotationData` as a swara grid.

| Section | Purpose |
|---|---|
| `extractNotesFromDoc(doc)` | (No longer used; `parseMusicXMLDoc` in the lib does this now.) |
| `suggestThaat(fifths, mode)` | Heuristic: major → bilawal, minor with `\|fifths\| ∈ {1,2}` → kafi, else → asavari. Used for the auto-suggested thaat in the header. |
| `IndianNotation({ fileUrl, language? })` | Fetches MusicXML, parses, runs `convertToBhatkhande`, renders the grid. |
| The static banner | `"⚠ Experimental — may contain translation errors"` — restored from the original CRA-era copy in commit `b59438b`. Always visible. |
| `RowWithHeader` | Renders one beat-marker `<tr>` + one swaras `<tr>`. The beat-marker cell is `सम` for the very first beat. |

The component accepts a `language` prop so a parent (like the test page) can
override the per-component picker.

### 3.7 `src/components/OSMDWrapper.tsx`

Thin React class component over `OpenSheetMusicDisplay`.

| Option set in `setupOsmd()` | Why |
|---|---|
| `drawTitle: false` | Post page already shows the title. |
| `drawSubtitle: false` | Avoids extra vertical space. |
| `drawLyrics: false` | **Avoids the staff/lyrics overlap.** Lyrics are extracted by us and shown in a separate block. |
| `drawCredits: false` | We don't want OSMD's "Title / Lyrics / Composer" section cluttering the staff. |
| `drawPartNames: false` | Two-part scores (e.g. "Piano 1" / "Piano 2") would otherwise render with labels that look like a section header. |
| `drawMeasureNumbers: false` | Cleaner default. |
| `autoResize: true` | Fits container width. |
| `zoom: 0.75` | Tested default. |

### 3.8 `src/components/PlayerControls.tsx`

Per-tab audio control bar. Used by both the Western and Indian tab views.

| State | Display |
|---|---|
| `idle` | ▶ Play button (label varies: "Play Western Staff" or "Play Bhatkhande") |
| `loading` | "Starting…" |
| `playing` | ■ Stop button |
| `done` | ↻ Replay button |

Controls: Voice picker (sine / triangle / square / sawtooth), Tempo input
(30-240 BPM, default 90), note count. On unmount, calls `handle.stop()` to
silence playback.

### 3.9 `src/app/post/[id]/page.tsx`

The post detail page (server-side route).

- Client component; fetches `/api/posts/[id]` on mount.
- Renders header (title, artist, genre, scale, date).
- Tab switcher with `notation === 'western' | 'indian'`.
- Western tab: `<OSMDWrapper>` + `<PlayerForSheet label="Play Western Staff">`.
- Indian tab: `<IndianNotation>` + `<PlayerForSheet label="Play Bhatkhande">`.
- Below both tabs: a Lyrics section, populated from `parseMusicXMLString(xml).lyrics`.
- Below lyrics: a form with Password / Delete / Download (existing).

The shared `PlayerForSheet(url, label)` helper fetches the MusicXML once
(unzip-aware via `loadMusicXmlFromUrl`), parses it, extracts MIDI events, and
hands them to a `PlayerControls` instance. Used twice per post (once per tab).

### 3.10 `src/app/api/posts/[id]/route.ts`

The MongoDB lookup. Returns the post document or 404. (See source — not
modified during this session's work.)

### 3.11 Layout, styling

- `src/app/layout.tsx`: `app-container` is `min-h-screen flex flex-col`, `<main>` is `flex-1 flex flex-col`, footer has `mt-auto`. This is what makes the footer touch the bottom of the viewport on short pages (including the 404).
- `src/app/not-found.tsx`: the styled 404 card (replaces Next.js's unreadable default). Uses `flex-1` + flex-centering so it sits in the middle of the available main-area height.
- `src/custom_scss/pages/_bhatkhande.scss`: the swara grid styling, the script/raga controls, the experimental banner.

---

## 4. Quick recipes

**Add a new taal to the picker**: edit `src/lib/sargam-data.ts`, add a
`TaalDef` to `TAALS` with the right `numBeats`, `bhaags`, and `samKhaali`.
Add the language labels to `TAAL_LABELS` (English, Hindi, Bangla).

**Add a real piano voice**: edit `src/lib/audio.ts`. The `Voice` type would
extend to include `'piano' | 'harmonium'`. The `getSynth(voice)` body would
branch: for synthesized voices, use `Tone.PolySynth(Tone.Synth)` as today; for
real-instrument voices, build a `Tone.Sampler` with a soundfont URL. The rest
of the API (preload, play, stop) doesn't need to change.

**Make the swara grid support per-beat alignment highlighting** (so during
playback, the current beat cell is highlighted in both views): add a `playBeat`
prop to `IndianNotation` that takes the current beat index. Same for
`OSMDWrapper` via OSMD's built-in `cursor.next()` API. Wire both to a shared
`usePlayerState` hook.

**Fix the +9 minor-mode trick** (currently `saSemitone = (saSemitone + 9) % 12`
which assumes a natural minor). The user's bug list originally noted this; for
harmonic/melodic minor you'd need a different mapping. Tracked but not
blocking.
