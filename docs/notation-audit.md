# Notation & Playback Audit

Review of the Western→Indian Bhatkhande conversion + playback engine, plus
research into relevant open-source projects. Generated 2026-06-21.

Last 10 commits reviewed: e2c906e, eedd19d, 1e9ab66, e8dc38f, cb7deda, f9a6e1a,
2728a08, cc7fc8b, ed7b5f8, 3fe80e5.

---

## 1. Bugs found in current code

### Tier 1 — timing / audio correctness

#### Bug 1 — Tie-continuation branch advances timeline on chord notes

**File**: `src/lib/bhatkhande.ts:156` (and `src/lib/midi.ts:35`)

When a `<tie type="start"/>` is active and the next note is a `<chord/>`
(common in Rachmaninoff-style scores, and in any score where a chord note is
tied across a bar), the very first check `if (tieStartBeat !== null)` runs
and unconditionally does `cumDiv += note.duration`. That wrongly advances
the cursor; the chord's other voices' MIDI pitches shift later than the
grid. Same pattern in `midi.ts processVoiceMidi`.

The check should only run for tied *continuation* notes, not for chord
notes that happen to follow a tieStart. Need to gate on
`note.tieStop`-or-continuation semantics, not just "any note while a tie is
open".

#### Bug 2 — Tie with no stop drops the final note

**File**: `src/lib/bhatkhande.ts:167` (and `src/lib/midi.ts:38`)

`if (note.tieStop)` inside the tie-active branch pushes the accumulated
MIDI event. If the last note of a piece has `<tie type="start"/>` and no
matching stop (very common in sheet music), the event is never emitted.
Audible: missing final held note.

Fix: on end-of-voice, flush any pending tie as if a stop were present.

#### Bug 3 — `lastDisplayBeat` not updated during tie continuation

**File**: `src/lib/bhatkhande.ts:228`

`lastDisplayBeat` is only updated in the non-tie branch. After a long tied
note, subsequent notes compare against a stale `lastDisplayBeat`, so they
can wrongly share a sub-row instead of starting their own, mangling the
vertical chord stacking introduced in commit 1e9ab66.

#### Bug 4 — Western view has no playback highlight

**File**: `src/app/post/[id]/page.tsx:138`

`onBeatChange` is wired to the Indian view only. `OSMDWrapper` never uses
`osmd.cursor`. The Western tab shows the staff but does not highlight the
currently-playing note. Feature missing entirely.

Fix: see §3 below — OSMD ships a `Cursor` class for exactly this.

### Tier 2 — display / cosmetic

#### Bug 5 — `HINDI_NUMS` wraps at 16, breaks second taal cycle

**File**: `src/lib/bhatkhande.ts:84-86`

```ts
const HINDI_NUMS = ['1', '2', ..., '16'];
```

Pieces longer than 16 beats (e.g. Teentaal = 16 beats per cycle, 2nd cycle
starts at beat 17) wrap to index 0 → second-cycle sam shows "1" instead of
`सम`. Need per-taal cycle reset.

#### Bug 6 — Tie dashes write to wrong subrow

**File**: `src/lib/bhatkhande.ts:213`

```ts
allBeats[b][allBeats[b].length - 1].push(TIE);
```

Appends to the *last* subrow in the beat cell, not to the note's *own*
subrow. When a beat already has chord subrows, the dash goes to the wrong
subrow.

#### Bug 7 — Beat-track offset drifts ~50-100ms

**File**: `src/components/PlayerControls.tsx:51`

`startTimeRef.current = performance.now()` while audio starts at
`Tone.now() + 0.05`. The visual highlight drifts ahead of the audio by ~50ms
plus scheduling jitter. For tight sync, anchor to `Tone.now()` and use
`Tone.Draw.schedule` for rAF.

#### Bug 8 — `pause()` is dead code

**File**: `src/lib/audio.ts:116` / `src/components/PlayerControls.tsx`

`PlaybackHandle.pause()` was added in commit 1e9ab66 but no button calls
it. Either add a Pause button to the controls or remove it.

---

## 2. Missing features (per user ask)

### 2.1 Western note highlight during playback

OSMD has native cursor support. See §3 below.

### 2.2 Real piano + harmonium voices

Current `src/lib/audio.ts` uses `Tone.PolySynth(Tone.Synth)` with raw
oscillators (sine / triangle / square / sawtooth). To get real instrument
sounds, swap `getSynth(voice)` to use `smplr` for piano and a tuned
PolySynth or sf2 samples for harmonium. See §3.

### 2.3 Per-beat tick / tabla bols for Indian talas

No existing TS library does this. Build it ourselves using the taal
metadata already in `src/lib/sargam-data.ts:TAALS` (Teentaal, Kehrwa,
Dadra, etc., each with `samKhaali` markers) + `Tone.MembraneSynth` for the
"thom" (sam / taali) and `Tone.MetalSynth` for the "khaali" (ta). Schedule
clicks per beat, slowed/stressed on sam.

---

## 3. Open-source research

### 3.1 Western→Bhatkhande converters

**None exist in any language.** The `Studio-kalavati/sargam-spec` repo is a
Clojure *documentation spec* (data shapes for sargam), not a converter. Their
companion projects (`bhatkhande-viewer`, `chaturpandit`) are renderers /
validators, also Clojure, last touched 2019-2021. All stale.

Our `src/lib/bhatkhande.ts` is currently the only MusicXML→Bhatkhande
converter in existence. Nothing to port — we are the project. The sargam-spec
data (which we already ported in `sargam-data.ts`) is the only useful
artifact from that ecosystem.

### 3.2 Real instrument audio libraries

| Library | Lang | License | Last active | Use? |
|---|---|---|---|---|
| **smplr** (`danigb/smplr`) | TS | MIT | 2026 (active) | YES — `Soundfont` instrument = "acoustic_grand_piano" for real piano; modern successor to `soundfont-player`. `SplendidGrandPiano` for Steinway samples. |
| WebAudioFont (`surikov/webaudiofont`) | JS | MIT-ish | 2018 (low activity) | Has harmonium + tabla samples in GM set; per-instrument chunking is good but corpus licensing is mixed. |
| `tonejs-smplr` (`stasoft91/tonejs-smplr`) | TS | MIT | low | Adapter to plug smplr into Tone.js transport — may simplify integration. |
| harmonium-companion (`ledlaux/harmonium-companion`) | JS | GPL-3.0 | 2026 (active, 1 author) | Reference only; GPL-3.0 incompatible with our setup unless we want GPL. Uses tuned PolySynth, not samples. |
| Harmonium Studio (`praveenjadhav1510/harmonium`) | TS | MIT | 2026 (active, 1 author) | Reference: their harmonium is also tuned PolySynth. Same approach we would take without samples. |

**Recommendation**: use `smplr` for piano (MIT, active, small). For harmonium,
either (a) tuned `Tone.PolySynth` (free, no license risk, doesn't sound
identical to a real reed harmonium but is acceptable), or (b) self-host a
small harmonium sf2 under a permissive license (TBD). Avoid WebAudioFont
directly due to mixed corpus licensing.

### 3.3 Tala / metronome / tabla click

No TS/JS library does Indian tala click tracks. Build it from scratch:

- Metadata already in `src/lib/sargam-data.ts:TAALS`: `numBeats`,
  `bhaags`, `samKhaali` for 7 taals.
- Use `Tone.MembraneSynth` (low thud, sam/taali) and `Tone.MetalSynth`
  (high click, khaali).
- Schedule one click per beat at the same BPM as the player; mute
  option; toggle on/off from `PlayerControls`.

### 3.4 OSMD cursor for Western playback highlight

Confirmed in OSMD source: `src/OpenSheetMusicDisplay/Cursor.ts`.

**API**:

```ts
osmd.cursor.show();
osmd.cursor.next();
osmd.cursor.hide();
osmd.cursor.reset();
osmd.cursor.GNotesUnderCursor();   // GraphicalNote[]
osmd.cursor.NotesUnderCursor();    // Note[]
osmd.cursorsOptions;               // CursorOptions[]
osmd.enableOrDisableCursors(true);
```

**Multiple cursors** supported — can add a second "current measure"
highlight:

```ts
osmd.setOptions({
  cursorsOptions: [
    { type: 0, color: '#E11D48', alpha: 0.5, follow: true },   // standard
    { type: 3, color: '#999',    alpha: 0.1, follow: false },  // measure
  ],
});
```

To advance during playback: precompute a list of (time, beat) pairs from
`extractWesternEvents(parsed)`, then in the player's animation frame, find
the current time, and skip `cursor.next()` until the iterator's
`CurrentVoiceEntries` first note starts at/after the current beat. (Don't
call `next()` every frame — only on boundary crossings.)

Reference repo: `jimutt/osmd-audio-player` (MIT) does exactly this — its
`PlaybackEngine.ts:90` uses `osmd.cursor` + `Tone` and shows the cursor
moving during playback. Can read its approach without depending on it.

---

## 4. Recommended implementation order

1. **Bug fixes (small, safe)**: bugs #2, #3, #5, #6 first — pure logic in
   `bhatkhande.ts` + `midi.ts`, no new deps, no UI changes.
2. **Tie-chord interaction (#1)**: subtle, needs a test against a
   Rachmaninoff / multi-voice tied-chord score before merge.
3. **Western cursor highlight (#4)**: wire `onBeatChange` in
   `page.tsx:138` and add a cursor-advance effect in `OSMDWrapper.tsx`.
   No new deps — uses OSMD's built-in cursor.
4. **Real piano via smplr**: extend `Voice` type with `'piano'`, branch in
   `getSynth` to build `Soundfont` instance with acoustic_grand_piano.
   Adds `smplr` to deps.
5. **Harmonium voice**: tuned PolySynth first (zero new deps), real
   samples later if needed.
6. **Tala click track**: new `src/lib/tala-metronome.ts` using
   `sargam-data.TAALS` + `Tone.MembraneSynth`. Toggle button in
   `PlayerControls`.
7. **Beat-track sync fix (#7)**: switch `PlayerControls.startBeatTracking`
   to use `Tone.now()` + `Tone.Draw.schedule` for frame-accurate UI.

---

## 5. UX improvements (requested)

### Auto-scroll Bhatkhande grid on small screens

When highlighter (`bhatkhande-current`) moves right during playback, the
scrollable container (`.bhatkhande-scroll`) should auto-scroll to keep the
current beat cell visible. Behavior:

- On each `currentBeat` change, find the highlighted cell's DOM element
- If cell is beyond viewport right edge, scroll container right so cell
  is at left edge (or as close as possible)
- If already at max scroll, no-op (don't fight user's manual scroll)

Implementation: `useRef` on `.bhatkhande-scroll`, `useEffect` on
`currentBeat`, `element.scrollIntoView({inline: 'start', behavior: 'smooth'})`
or manual `container.scrollLeft = cell.offsetLeft - containerPadding`.

Priority: high (mobile usability). Files: `IndianNotation.tsx`,
`_bhatkhande.scss` (ensure overflow-x: auto is set).

---

## 5. Files referenced

- `src/lib/bhatkhande.ts` — converter (bugs 1, 2, 3, 5, 6)
- `src/lib/midi.ts` — MIDI extraction (bugs 1, 2)
- `src/lib/audio.ts` — Tone.js wrapper (bug 8, missing voices, missing
  tala click hook)
- `src/lib/sargam-data.ts` — already has the taal metadata needed for click
  track
- `src/components/PlayerControls.tsx` — bug 7, needs voice/tala UI
- `src/components/OSMDWrapper.tsx` — needs cursor wiring for bug 4
- `src/components/IndianNotation.tsx` — no bugs, renders cleanly
- `src/app/post/[id]/page.tsx` — bug 4 (missing Western onBeatChange)
- `src/custom_scss/pages/_bhatkhande.scss` — current-cell highlight already
  styled
