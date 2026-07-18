# Codebase Review & Implementation Plan

**Date**: 2026-07-11 (updated 2026-07-12)
**Status**: Implementation-ready with code snippets

> ⚠️ **Read this first**: This document incorporates findings from:
> - Prior audit: `docs/notation-audit.md` (2026-06-21)
> - Storage plan: `docs/xml-storage-plan.md` (2026-06-21)
> - Full codebase review + user pushback + new discoveries (this document)
>
> **Only change what you are very confident about.** The conversion logic works for ~188 sheets.
> Prefer safe, narrow fixes over risky refactors. Test each change before committing.

---

## URGENT ISSUES (Discovered 2026-07-12)

### U1. Chinese-language titles in database

The latest 6 sheets imported into MongoDB have Chinese titles:
- `夜上海/星心相印` (artist: `林七枚`)
- `百鳥和鳴`
- `花好月圓`
- `郊游`
- `甜蜜蜜`
- `知心客`

**User wants English titles only.** These were likely imported from a Chinese MusicXML source.

**Fix**: Need a script to rename Chinese-titled sheets. Options:
1. Web search each title → get English translation → update `sheetName` in MongoDB
2. Extract `<work-title>` from the MusicXML — if it's also Chinese, fall back to filename
3. Manual mapping for these 6:
   - 夜上海/星心相印 → "Shanghai Night / Star Hearts"
   - 百鳥和鳴 → "Hundred Birds Singing in Harmony"
   - 花好月圓 → "Blooming Flowers and Full Moon"
   - 郊游 → "Spring Outing"
   - 甜蜜蜜 → "Sweet as Honey"
   - 知心客 → "Intimate Guest"

**New script needed**: `scripts/rename-chinese-titles.mjs`
```javascript
// 1. Find all sheets where sheetName contains CJK characters
//    Regex: /[\u4e00-\u9fff\u3400-\u4dbf]/
// 2. For each, web-search the title for English translation
// 3. Update sheetName in MongoDB
// 4. Also update Artist if it contains CJK
```

### U2. Homepage example sheet not showing

The homepage's "Example music sheet" section renders empty:
```html
<section class="relative">
  <div class="container relative min-h-[40rem]"></div>  <!-- EMPTY -->
</section>
```

**Root cause**: `src/app/page.tsx` does a server-side `fetch('/api/posts/[id]')` to get an example sheet's `xmlContent`. When MongoDB is unreachable (SSL error — see U4), the fetch fails silently and `exampleXml` is null. The `<MusicSheetViewer>` never renders.

**Fix**: Add error handling + a fallback or loading state in `page.tsx`. Also fix the MongoDB connection (U4).

### U3. Post page not playing music sheet

`http://localhost:3000/post/64e4265638531e36b92b5f9b` — sheet doesn't play at all.

**Root cause**: Same MongoDB SSL connection error. The API can't fetch the sheet's `xmlGz` to decompress and return `xmlContent`. The frontend gets an error or empty response, so `MusicSheetViewer` has nothing to render.

### U4. MongoDB Atlas SSL Error (recurring)

```
MongoServerSelectionError: tlsv1 alert internal error (SSL alert number 80)
```

**Root cause**: Current IP not whitelisted in MongoDB Atlas Network Access.

**Fix**: Go to MongoDB Atlas → Network Access → Add Current IP (or `0.0.0.0/0` for dev).

**Code fix in `src/lib/db.ts`**: The `tls: true` option may cause issues with some Atlas tiers. Try removing it if the URI already includes `?retryWrites=true&w=majority`:
```typescript
// Current:
cachedClient = new MongoClient(MONGODB_URI, { tls: true });

// Safer — let Atlas URI handle TLS:
cachedClient = new MongoClient(MONGODB_URI);
```

### U5. Play/pause out of sync when switching to Indian view

When playing and switching to the Indian notation tab, the beat cursor doesn't sync properly.

**Related to Bug 1.2 (resume cursor desync)** — the `startBeatTracking` fix was partially applied but the resume path initially still called `startBeatTracking()` without the offset. **Now fixed** — see Bug 1.2 fix below.

### U6. Beat duration display — "ga dha" should be "ga ga dha"

**User report**: *"I saw two notes in one beat like ga dha, but ga was 2/3 of beat and dha was 1/3, but the sheet made it look like they both ought to be played 50% of beat. 1 beat should have had ga ga dha, this would make ga 2/3 beat time."*

**Root cause**: In `bhatkhande.ts`, `processVoice()` fills beats by duration. When a note spans 2/3 of a beat, the swara is written once. But the grid cell shows it once — visually equal to a note that's 1/3 of a beat.

**Expected behavior**: If a note occupies 2/3 of a beat, it should appear TWICE in the cell (e.g., "ga ga dha" instead of "ga dha"). Each appearance represents 1/3 of the beat. This matches how Bhatkhande notation works — longer notes are repeated to fill the beat.

**Current behavior**: The code in `bhatkhande.ts` around lines 200-220 does:
```typescript
// For each beat slot, place one swara per note that starts in that beat
// Notes longer than one beat use TIE (-) to fill subsequent beats
// But WITHIN a beat, a note that's 2/3 of the beat only appears once
```

**Fix needed in `src/lib/bhatkhande.ts` `processVoice()`**: When a note occupies more than 1 subdivision of a beat but less than a full beat, repeat the swara to fill the beat proportionally.

**This requires understanding the beat subdivision logic.** The safest approach:
1. Determine how many "slots" are in each beat (e.g., 3 slots for a triplet beat, 2 for eighth notes, 4 for sixteenths)
2. For each note, calculate how many slots it occupies within the beat
3. Repeat the swara that many times in the cell

**DO NOT implement this without deep testing** — it touches the core conversion logic (`bhatkhande.ts`) which the user says works for all existing sheets. Create a separate test script first to verify the behavior, then implement.

---

## Table of Contents

1. [CONFIRMED BUGS — Fix These](#1-confirmed-bugs--fix-these)
2. [NOT-A-BUG — Verified Correct](#2-not-a-bug--verified-correct)
3. [Play/Pause/Stop State Machine Analysis](#3-playpausestop-state-machine-analysis)
4. [New Feature: Indian Notation XML Format](#4-new-feature-indian-notation-xml-format)
5. [Storage Scaling Strategy (10k-100k Sheets)](#5-storage-scaling-strategy-10k100k-sheets)
6. [Open-Source Music Programming Research](#6-open-source-music-programming-research)
7. [OpenCode Skills Research](#7-opencode-skills-research)
8. [UI Roadmap](#8-ui-roadmap)

---

## 1. CONFIRMED BUGS — Fix These

### 1.1 Envelope Bleed — Notes Audible During Rests

**File**: `src/lib/audio.ts:20-25` and `src/lib/audio.ts:87-94`

**User report**: *"there could be 10 beats gap where no note is supposed to play but our harmonium sounds keep on playing on that"*

**Root cause**: ADSR envelope parameters. Current values keep the note at 50-70% volume throughout its duration, then decay over 0.4-0.8 seconds after release. At 90 BPM (1 beat = 0.667s), the release tail bleeds into the next beat(s). Harmonium (`sustain: 0.7, release: 0.8`) is the worst offender.

**Trace** (harmonium at 90 BPM):
```
envelope = { attack: 0.15, decay: 0.2, sustain: 0.7, release: 0.8 }
Quarter note = 0.667s
→ attack  0→0.15s   (reaches 1.0)
→ decay   0.15→0.35s (falls to 0.7)
→ sustain 0.35→0.667s (sits at 70% — LOUD)
→ release 0.667→1.467s (decays to 0 over 0.8s — AUDIBLE through rest)
```

**Fix**: Lower `sustain` and `release` for all synth voices. Notes naturally fade during their duration and stop promptly on release. Piano is a real sampled instrument — leave its `release: 1.5` (natural decay).

**Current code** (`src/lib/audio.ts` lines 20-25):
```typescript
const VOICE_PARAMS: Record<Exclude<Voice, 'piano' | 'harmonium'>, VoiceParams> = {
  sine:     { oscType: 'sine',     envelope: { attack: 0.02, decay: 0.1, sustain: 0.6, release: 0.4 } },
  triangle: { oscType: 'triangle', envelope: { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.5 } },
  square:   { oscType: 'square',   envelope: { attack: 0.005, decay: 0.05, sustain: 0.4, release: 0.2 } },
  sawtooth: { oscType: 'sawtooth', envelope: { attack: 0.005, decay: 0.05, sustain: 0.4, release: 0.2 } },
};
```

**Fixed code**:
```typescript
const VOICE_PARAMS: Record<Exclude<Voice, 'piano' | 'harmonium'>, VoiceParams> = {
  sine:     { oscType: 'sine',     envelope: { attack: 0.02, decay: 0.1, sustain: 0.1, release: 0.05 } },
  triangle: { oscType: 'triangle', envelope: { attack: 0.02, decay: 0.1, sustain: 0.1, release: 0.05 } },
  square:   { oscType: 'square',   envelope: { attack: 0.005, decay: 0.05, sustain: 0.1, release: 0.05 } },
  sawtooth: { oscType: 'sawtooth', envelope: { attack: 0.005, decay: 0.05, sustain: 0.1, release: 0.05 } },
};
```

**Current harmonium** (`src/lib/audio.ts` lines 87-94):
```typescript
harmoniumSynth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: 'sawtooth' },
  envelope: { attack: 0.15, decay: 0.2, sustain: 0.7, release: 0.8 },
}).toDestination();
```

**Fixed harmonium**:
```typescript
harmoniumSynth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: 'sawtooth' },
  envelope: { attack: 0.08, decay: 0.05, sustain: 0.2, release: 0.05 },
}).toDestination();
```

**Why this works**: Lower sustain means notes naturally fade during their duration. Short release means they stop audibly within 50ms of release. Result: rests are truly silent. No change to note pitch, timing, or playback logic.

---

### 1.2 Resume from Pause — Cursor Desynced from Audio

**File**: `src/components/PlayerControls.tsx:52-67` (startBeatTracking) and `77-125` (play/resume)

**Root cause**: `startBeatTracking()` unconditionally sets `startTimeRef.current = performance.now()` on line 54. When resuming from pause, the resume code correctly sets `startTimeRef.current = performance.now() - (resumeOffset * 60 / bpm)` on line 83, but `startBeatTracking()` immediately overwrites it to `performance.now()`. Result: the visual cursor shows beat 0 for ~1 second while audio plays from the correct offset.

**Trace**:
```
1. Play at 90 BPM (1 beat = 0.667s)
2. Pause at beat 10.0 → pausePositionRef = 10.0
3. Click resume:
   a. resumeOffset = 10.0
   b. startTimeRef = performance.now() - (10.0 * 60 / 90)  // 6.67s in past → CORRECT
   c. startBeatTracking() → startTimeRef = performance.now()  // OVERWRITES → BUG
   d. First anim frame: beat = 0 → cursor at 0 (WRONG)
   e. Audio starts from offset 10.0
   f. Cursor sits at 0 for ~6.67s until beat tracking catches up to beat 10
```

**Fix**: Make `startBeatTracking` accept an optional `offsetBeats` parameter. Do NOT overwrite if offset > 0.

**Current code** (`src/components/PlayerControls.tsx` lines 52-67):
```typescript
const startBeatTracking = () => {
    if (!onBeatChange) return;
    startTimeRef.current = performance.now();
    bpmRef.current = bpm;
    let lastBeat = -1;
    const tick = () => {
      const elapsedSec = (performance.now() - startTimeRef.current) / 1000;
      const beat = elapsedSec * (bpmRef.current / 60);
      if (Math.floor(beat) !== lastBeat) {
        lastBeat = Math.floor(beat);
        onBeatChange(beat);
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
};
```

**Fixed code**:
```typescript
const startBeatTracking = (offsetBeats: number = 0) => {
    if (!onBeatChange) return;
    startTimeRef.current = performance.now() - (offsetBeats * 60 / bpm);
    bpmRef.current = bpm;
    let lastBeat = Math.floor(offsetBeats) - 1;
    const tick = () => {
      const elapsedSec = (performance.now() - startTimeRef.current) / 1000;
      const beat = elapsedSec * (bpmRef.current / 60);
      if (Math.floor(beat) !== lastBeat) {
        lastBeat = Math.floor(beat);
        onBeatChange(beat);
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
};
```

Then update the call sites in `play()`:

**Resume path** (line ~82-100) — REMOVE the manual `startTimeRef` line, pass offset to `startBeatTracking`:
```typescript
// BEFORE:
startTimeRef.current = performance.now() - (resumeOffset * 60 / bpm);
handleRef.current = await playEvents(events, { ... });
startBeatTracking();

// AFTER:
handleRef.current = await playEvents(events, { ... });
startBeatTracking(resumeOffset);
```

**Fresh start path** (line ~104-119) — no change needed:
```typescript
startBeatTracking();  // offsetBeats defaults to 0 → same as before
```

**`lastBeat` init**: Set to `Math.floor(offsetBeats) - 1` so the first frame fires `onBeatChange(offsetBeats)` immediately. For offset=0: `lastBeat = -1` (same as before). For offset=10: `lastBeat = 9`, first frame calls `onBeatChange(10)`.

---

### 1.3 Pause Resets Cursor to Beat 0 (Visual Glitch)

**File**: `src/components/PlayerControls.tsx:69-75`

**Root cause**: `stopBeatTracking()` always calls `onBeatChange?.(0)` on line 74. This is correct for `stop()` (reset cursor to start) but wrong for `pause()` (should freeze cursor at current position).

**Current code**:
```typescript
const stopBeatTracking = () => {
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    onBeatChange?.(0);  // BUG: always resets cursor
};
```

**Fixed code**:
```typescript
const stopBeatTracking = (resetCursor: boolean = true) => {
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    if (resetCursor) {
      onBeatChange?.(0);
    }
};
```

Update call sites:

| Location | Should reset? | Change to |
|----------|:---:|-----------|
| `stop()` | Yes | `stopBeatTracking(true)` (or just `stopBeatTracking()`) |
| `play()` error catch | Yes | `stopBeatTracking(true)` |
| `playEvents onFinish` callback | Yes | `stopBeatTracking(true)` |
| `pause()` | **No** | `stopBeatTracking(false)` |

---

## 2. NOT-A-BUG — Verified Correct

These areas were reviewed and work correctly. Do NOT change them.

### 2.1 Tie Handling in `bhatkhande.ts` and `midi.ts`
The tie logic handles continuation notes, chord interactions, and end-of-voice flush correctly. The `!note.isChord` gate prevents chord durations from being consumed by tie branches. A `tieStart` on the same note as `tieStop` (common on middle notes of a 3-note tie chain) is handled on the next iteration. **User confirms all sheets play correctly.** Do NOT touch.

### 2.2 Multi-part `<part>` Parsing
`parseMusicXMLDoc()` parses only the first `<part>`. Piano music uses one `<part>` with `<staves>2</staves>` — both staves are captured. Multi-instrument scores (quartets, orchestral) only get the first instrument. **Known limitation, not a bug.** User's 188 sheets are mostly piano/vocal and work fine.

### 2.3 `<backup>` / `<forward>` Ignored
The parser collects notes via `querySelectorAll` in DOM order. Voice filtering (`notes.filter(n => n.voice === voice)`) implicitly corrects for backup/forward because notes in the same voice are typically contiguous. Works for all current sheets.

### 2.4 `extractIndianEvents()` Delegating to `extractWesternEvents()`
Both produce identical absolute MIDI pitches from the same source notes. The indirection documents intent. Clean design.

### 2.5 Conversion Logic Core (`bhatkhande.ts`)
- Sa computation (major: `fifths * 7 mod 12`, minor: `+9`) ✓
- Saptak (octave) mapping ✓
- Swara labels (12 chromatic positions) ✓
- Tala detection (7 taals + fallback) ✓
- Chord handling (sub-rows stack vertically, sequential notes share sub-row) ✓
- Multi-voice (independent processing, merged by stacking) ✓

---

## 3. Play/Pause/Stop State Machine Analysis

### State Diagram

```
idle →loading→ playing →paused→ playing (resume)
                  ↓                   ↓
                done                idle (stop)
                  ↓
                idle (replay→loading)
```

### All Transitions

| Transition | Audio | Cursor | Status |
|------------|-------|--------|--------|
| idle → playing | `playEvents()` offset=0 | `startBeatTracking(0)` | ✅ Works |
| playing → paused | `Transport.pause()`, `releaseAll()` | `stopBeatTracking(false)` → freeze | ⚠️ Bug 1.3 (resets to 0) |
| paused → playing | `playEvents()` with `offsetBeats` | `startBeatTracking(offset)` | ⚠️ Bug 1.2 (overwrites offset) |
| playing → done | `onFinish` fires | `stopBeatTracking(true)` → 0 | ✅ Works |
| playing → idle | `Transport.stop()`, `releaseAll()` | `stopBeatTracking(true)` → 0 | ✅ Works |
| paused → idle | `Transport.stop()` | `stopBeatTracking(true)` → 0 | ✅ Works |
| done → loading | Same as fresh play | `stopBeatTracking(true)` → 0 | ✅ Works |

### Cleanup on unmount ✅
`PlayerControls` properly stops audio and cancels animation frames on unmount.

### BPM change during playback: By design, does NOT re-schedule audio. BPM only applies on next play. This is acceptable behavior.

### VPS Memory Fix (separate from code)
The 1GB Oracle Cloud VPS goes OOM during `npm run build`. Fix:
```bash
# On VPS — create 2GB swap file
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 4. New Feature: Indian Notation XML Format

### 4.1 Why

The user's idea: convert Western MusicXML → Indian Notation XML → back to Western MusicXML. Roundtrip test reveals what information is lost in the conversion. Also enables standalone Indian notation sheets that don't require Western source files.

### 4.2 Schema Design

```xml
<?xml version="1.0" encoding="UTF-8"?>
<indian-notation version="1.0">
  <title>Example Song</title>
  <composer>Unknown</composer>
  <sa note="C" octave="4"/>
  <taal name="teentaal" beats="16" beat-type="4"/>

  <voices>
    <voice id="1" label="Right Hand"/>
    <voice id="2" label="Left Hand"/>
  </voices>

  <rows>
    <row index="0">
      <beat index="0" beat-mark="सम">
        <sub-row voice="1">
          <swara saptak="madhyam">सा</swara>
          <swara saptak="madhyam">रे</swara>
        </sub-row>
        <sub-row voice="2">
          <swara saptak="mandra">प</swara>
        </sub-row>
      </beat>
      <beat index="1" beat-mark="2">
        <sub-row voice="1">
          <rest/>
        </sub-row>
        <sub-row voice="2">
          <tie/>
        </sub-row>
      </beat>
    </row>
  </rows>

  <lyrics>
    <verse number="1">
      <syllable beat="0">Aa</syllable>
      <syllable beat="1">jaa</syllable>
    </verse>
  </lyrics>
</indian-notation>
```

### 4.3 Converter: `NotationData` → Indian Notation XML

**New file**: `src/lib/indianNotationXml.ts`

```typescript
import type { NotationData } from './bhatkhande';

const REST = '\u00B7';  // ·
const TIE = '\u2014';   // —

export function notationDataToIndianXml(data: NotationData): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += `<indian-notation version="1.0">\n`;

  if (data.title) {
    xml += `  <title>${escapeXml(data.title)}</title>\n`;
  }
  xml += `  <sa note="${data.saName}" octave="${data.saOctave}"/>\n`;
  xml += `  <taal name="${escapeXml(data.taalNameLabel)}" beats="${data.beats}" beat-type="${data.beatType}"/>\n`;

  xml += `  <voices>\n`;
  data.voicesUsed.forEach((v, i) => {
    xml += `    <voice id="${v}" label="Voice ${i + 1}"/>\n`;
  });
  xml += `  </voices>\n`;

  xml += `  <rows>\n`;
  data.rows.forEach((row, ri) => {
    xml += `    <row index="${ri}">\n`;
    row.cells.forEach((cell, bi) => {
      const globalBeat = ri * 8 + bi;
      const beatMark = row.beatMarks[bi] || '';
      xml += `      <beat index="${globalBeat}" beat-mark="${escapeXml(beatMark)}">\n`;
      cell.forEach((subRow, si) => {
        xml += `        <sub-row voice="${data.voicesUsed[si] || '1'}">\n`;
        subRow.forEach((s) => {
          if (s === REST) {
            xml += `          <rest/>\n`;
          } else if (s === TIE) {
            xml += `          <tie/>\n`;
          } else {
            const saptak = detectSaptak(s);
            const swara = stripMarker(s);
            xml += `          <swara saptak="${saptak}">${escapeXml(swara)}</swara>\n`;
          }
        });
        xml += `        </sub-row>\n`;
      });
      xml += `      </beat>\n`;
    });
    xml += `    </row>\n`;
  });
  xml += `  </rows>\n`;

  xml += `</indian-notation>\n`;
  return xml;
}

function detectSaptak(s: string): string {
  if (s.includes('\u0323\u0323')) return 'ati-mandra';  // double dot below
  if (s.includes('\u0323')) return 'mandra';              // one dot below
  if (s.includes('\u0902\u0902')) return 'ati-taar';     // double anusvara
  if (s.includes('\u0902')) return 'taar';               // anusvara
  return 'madhyam';                                       // no marker
}

function stripMarker(s: string): string {
  return s.replace(/[\u0323\u0902]/g, '');
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
```

### 4.4 Inverse Converter (Indian XML → MusicXML)

This is intentionally **lossy** — the Indian grid groups notes by beat, dropping exact duration and accidental info. For roundtrip testing, reconstruct a simplified Western score:

```typescript
// Skeleton — to be implemented
export function indianXmlToMusicXml(indianXml: string): string {
  // 1. Parse Indian Notation XML (use DOMParser)
  // 2. For each <swara> in each <beat>:
  //    - Map swara + saptak → MIDI pitch (using <sa note="" octave=""/>)
  //    - Use beat duration (quarter note in 4/4)
  //    - Treat <sub-row voice="N"> as MusicXML voice N
  //    - <rest/> → <rest/> note
  //    - <tie/> → continuation note with <tie type="stop"/>
  // 3. Set key = C major, time from <taal>
  // 4. Return minimal MusicXML string
  //
  // NOTE: Roundtrip test compares:
  //   Original Western → Indian XML → Reconstructed Western
  // Expected differences: exact durations, ornaments, grace notes, dynamics
  // Should match: pitches (MIDI note numbers), beat positions, note count
}
```

### 4.5 Roundtrip Test Script

**New file**: `scripts/notation-roundtrip.mjs`

```javascript
// 1. Load a Western MusicXML file from public/sheets/
// 2. Parse it with parseMusicXMLString()
// 3. Convert with convertToBhatkhande() → NotationData
// 4. Convert to Indian Notation XML with notationDataToIndianXml()
// 5. Save Indian XML
// 6. Convert back to MusicXML with indianXmlToMusicXml()
// 7. Compare original vs reconstructed:
//    - Same number of pitched notes?
//    - Same MIDI pitches per beat?
//    - Same number of rests?
// 8. Report differences
```

---

## 5. Storage Scaling Strategy (10k-100k Sheets)

### 5.1 Best Data Source: PDMX

| Source | Count | Format | License | URL |
|--------|-------|--------|---------|-----|
| **PDMX** | **254,077** | MusicXML | CC-0 / Public Domain | https://zenodo.org/records/15571083 |
| OpenEWLD | ~2,000 | MusicXML leadsheets | MIT + PD | https://github.com/00sapo/OpenEWLD |
| OpenScore Lieder | ~3,000 | MusicXML | CC BY-SA 4.0 | https://github.com/OpenScore/Lieder |
| MuseTrainer | ~100 | MusicXML/mxl | PD | https://musetrainer.github.io/library/ |
| Mutopia | ~2,000 | LilyPond | PD | https://github.com/MutopiaProject/MutopiaProject |

**PDMX is the single best source**: 254K files, 6,250 hours, CC-0, rich metadata (user ratings, tags, genre, composer). GitHub: `github.com/pnlong/PDMX`. Paper: arXiv 2409.10831.

### 5.2 Import Pipeline

**New file**: `scripts/bulk-import.mjs`

```javascript
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { MongoClient, Binary } from 'mongodb';
import { createHash } from 'crypto';
import { gzipSync } from 'zlib';

async function importSheets(srcDir) {
  const client = new MongoClient(process.env.ATLAS_URI);
  await client.connect();
  const db = client.db('musicsheets');
  const collection = db.collection('musicsheets');

  // Ensure indexes
  await collection.createIndex({ sheetName: 'text', Artist: 'text', Genres: 'text' });
  await collection.createIndex({ date: -1 });
  await collection.createIndex({ contentHash: 1 }, { unique: true, sparse: true });

  const files = readdirSync(srcDir).filter(f =>
    f.endsWith('.xml') || f.endsWith('.musicxml') || f.endsWith('.mxl')
  );

  let imported = 0, skipped = 0, errors = 0;

  for (const file of files) {
    try {
      const xmlContent = readFileSync(join(srcDir, file), 'utf-8');
      const contentHash = createHash('md5').update(xmlContent).digest('hex');

      // Duplicate check
      const existing = await collection.findOne({ contentHash });
      if (existing) { skipped++; continue; }

      // Extract metadata from MusicXML
      const title = extractTitle(xmlContent) || file.replace(/\.(xml|musicxml|mxl)$/, '');
      const composer = extractComposer(xmlContent) || 'Unknown';

      // Compress
      const xmlGz = gzipSync(xmlContent);

      await collection.insertOne({
        sheetName: title,
        Artist: composer,
        Genres: '',
        scale: 'C',
        date: new Date(),
        password: '',
        source: 'pdmx',
        contentHash,
        xmlGz: new Binary(xmlGz),
      });
      imported++;
    } catch (e) {
      errors++;
      console.error(`Failed: ${file}`, e.message);
    }
  }

  console.log(`Imported: ${imported}, Skipped (dup): ${skipped}, Errors: ${errors}`);
  await client.close();
}

function extractTitle(xml) {
  const m = xml.match(/<work-title>([^<]+)<\/work-title>/)
    || xml.match(/<movement-title>([^<]+)<\/movement-title>/);
  return m ? m[1].trim() : null;
}

function extractComposer(xml) {
  const m = xml.match(/<creator[^>]*type="composer"[^>]*>([^<]+)<\/creator>/);
  return m ? m[1].trim() : null;
}

importSheets(process.argv[2]);
```

### 5.3 MongoDB Indexes (critical for search at scale)

```javascript
// Text index for search (replaces $regex queries):
db.musicsheets.createIndex({ sheetName: "text", Artist: "text", Genres: "text" })

// Sort index for latest:
db.musicsheets.createIndex({ date: -1 })

// Dedup index:
db.musicsheets.createIndex({ contentHash: 1 }, { unique: true, sparse: true })
```

### 5.4 Storage Estimates

| Tier | Sheets | Storage | Mongo Plan | Monthly Cost |
|------|--------|---------|-----------|:------------:|
| Current | 188 | ~2 MB | Free (512 MB) | Free |
| Phase 1 | 10,000 | ~100 MB | Free (512 MB) | Free |
| Phase 2 | 50,000 | ~500 MB | Free (512 MB) | Free |
| Phase 3 | 100,000 | ~1 GB | M10 (2 GB) | ~$60 |
| Phase 4 | 254,000 | ~2.5 GB | M20 (8 GB) | ~$120 |

### 5.5 Alternative: Hybrid Storage (for 100k+)

Store XML in **Cloudflare R2** ($0.015/GB/month), only metadata in MongoDB. API fetches from R2 by `xmlKey` when `xmlGz` is absent. Not needed until storage exceeds 512 MB free tier.

### 5.6 Title Normalization

Many existing sheets have names like `wp_1`, `wp_2`, etc. During import:
1. Extract `<work-title>` or `<movement-title>` from MusicXML
2. Fall back to filename without extension
3. Never use generated names like `wp_N`

The migration script (`scripts/migrate-to-db.mjs`) already does this for existing sheets. The bulk import script should do the same.

### 5.7 Lyrics Collection

MusicXML stores lyrics per note as `<lyric><text>...</text></lyric>`. The parser already extracts them. For sheets without embedded lyrics:
- Web search for song title + "lyrics"
- Store in a separate `lyrics` field or within the sheet document
- Requires manual verification (copyright concerns for non-PD lyrics)

---

## 6. Open-Source Music Programming Research

### 6.1 Better Piano Audio with `smplr`

**Library**: [`smplr`](https://github.com/danigb/smplr) v1.0.0 (MIT, released Jun 2026)

**Key instruments**:
- `Soundfont` — General MIDI soundfonts (acoustic_grand_piano, violin, flute, etc.)
- `SplendidGrandPiano` — Steinway grand, 4 velocity groups
- `Soundfont2Sampler` — loads raw `.sf2` files
- `Sequencer` — multi-track scheduling against any smplr instrument

**API**: `piano.start({ note: "C4", velocity: 80, time: 5, duration: 1 })` — scheduled playback compatible with Tone.Transport timing.

**Compatibility with existing code**: `smplr` uses raw `AudioContext`. Tone.js wraps its own. Options:
- **Option A (simplest)**: For "piano" voice, bypass Tone.js and use `smplr.Soundfont` directly. Keep Tone.js for synth voices.
- **Option B**: Use `Tone.context.rawContext` to share one AudioContext between Tone.js and smplr.

**Integration sketch** (in `src/lib/audio.ts`):
```typescript
import { Soundfont } from 'smplr';

let pianoSoundfont: any = null;

async function getPianoSoundfont() {
  if (pianoSoundfont) return pianoSoundfont;
  pianoSoundfont = new Soundfont(Tone.context.rawContext, {
    instrument: 'acoustic_grand_piano',
    kit: 'MusyngKite',
  });
  await pianoSoundfont.load;
  return pianoSoundfont;
}

// In playEvents, for piano voice:
if (currentVoice === 'piano' && pianoSoundfont) {
  pianoSoundfont.start({
    note: midiToNoteName(e.midi),
    time: Tone.now() + time,
    duration: dur,
  });
} else {
  synth.triggerAttackRelease(midiToNoteName(e.midi), dur, time);
}
```

**Note**: This is a future improvement. The current `Tone.Sampler` with Salamander piano samples works. Only switch to smplr if the current piano is unsatisfactory.

### 6.2 Harmonium: Current Synth is Acceptable

No permissive-licensed harmonium sample library exists. The `Tone.PolySynth` with sawtooth + adjusted envelope (after Bug 1.1 fix) is the best option. Future: find/create a small harmonium `.sf2` and load with `Soundfont2Sampler`.

### 6.3 Tala Metronome (Tabla Bols)

**Current**: `src/lib/tala-metronome.ts` — basic per-beat click using `Tone.MembraneSynth`.

**Improvement**: Use `TAALS` data in `src/lib/sargam-data.ts` (has `samKhaali` markers for 7 taals) to play different sounds for sam (beat 1), taali (clap beats), and khaali (empty beats). No new dependency — `Tone.MembraneSynth` + `Tone.MetalSynth` suffice.

### 6.4 OSMD Cursor for Western Highlight

Already wired in `OSMDWrapper.tsx` (`syncCursor` method using `osmd.cursor.next()`). Works with `currentBeat` prop. Verified functional.

### 6.5 PDMX Dataset

- **Paper**: arXiv 2409.10831
- **Download**: Zenodo DOI `10.5281/zenodo.15571083` (~50 GB)
- **Code**: `github.com/pnlong/PDMX` (Python, uses MusPy + MusicRender)
- **License**: CC-0 / Public Domain (commercially safe)
- **Quality filter**: Filter by user rating ≥ 3.5/5 for high-quality arrangements

---

## 7. OpenCode Skills Research

The project has 9 skills installed in `.opencode/skills/`. Each contains a `SKILL.md` with instructions and templates.

### Relevant Skills for This Project

| Skill | Use Case | Priority |
|-------|----------|----------|
| **test-patterns** | Generate tests for bhatkhande.ts converter, parseMusicXML.ts, roundtrip test | High |
| **error-triage** | Debug when a specific MusicXML file fails to parse or play | Medium |
| **dependency-audit** | Audit npm deps (Tone.js, OSMD, mongodb, smplr if added) for CVEs | Medium |
| **ci-pipeline** | GitHub Actions workflow for lint + typecheck + build | Medium |
| **env-setup** | Generate `.env.example` for new contributors | Low |
| **changelog-generate** | Generate CHANGELOG.md from git history | Low |
| **git-release** | Create tagged releases with release notes | Low |
| **deploy** | Guide VPS deployment, rollback procedures | Low |
| **docker-optimize** | Not applicable (no Dockerfile) | N/A |

### Recommended Skill Usage

1. **test-patterns**: Write tests for the conversion pipeline:
   - Unit tests for `convertToBhatkhande()` with known MusicXML inputs
   - Unit tests for `processVoice()` tie handling, chord handling
   - Integration test: load a real MusicXML file → convert → check output structure
   - Roundtrip test: Western → Indian XML → back → compare pitches

2. **ci-pipeline**: Create `.github/workflows/ci.yml` with:
   - Lint: `npm run lint`
   - Typecheck: `npx tsc --noEmit`
   - Build: `npm run build`
   - (No tests yet, but pipeline ready for when test-patterns skill adds them)

3. **error-triage**: Use when a user reports a specific sheet that fails to play. Feed the stack trace + the MusicXML file through this skill to diagnose root cause.

### Missing Skills (Could Be Created)

| Skill | Description | Why |
|-------|-------------|-----|
| **musicxml-test** | Specialized test patterns for MusicXML parsing/conversion | Domain-specific testing needs |
| **sheet-import** | Bulk import workflow for MusicXML files into MongoDB | Reusable for PDMX, OpenEWLD, etc. |
| **audio-debug** | Diagnose Tone.js playback issues (envelope bleed, timing) | Specialized for this project's audio stack |

---

## 8. UI Roadmap

### 8.1 Homepage Split-View Demo (High Priority)

Replace the tab-based `MusicSheetViewer` on the homepage with a **code-editor style split view**:

```
┌─────────────────────────────────────────────────────┐
│  ⏵ Play  ⏸ Pause  │  BPM: [90]  │  Voice: Harmonium │
├──────────────────────────┬──────────────────────────┤
│    Western Staff         │    Indian Bhatkhande     │
│    (OSMD, scaled 75%)    │    (swara grid)          │
│                          │                          │
│    [cursor highlight]    │    [beat highlight]      │
│                          │                          │
└──────────────────────────┴──────────────────────────┘
```

Single play/pause controls both views. `currentBeat` syncs cursor in OSMD and highlight in Indian grid. Both render from the same `xmlContent`.

**New file**: `src/components/SplitSheetView.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import IndianNotation from '@/components/IndianNotation';
import PlayerControls from '@/components/PlayerControls';
import { parseMusicXMLString } from '@/lib/parseMusicXML';
import { extractWesternEvents, type MidiEvent } from '@/lib/midi';

const OSMDWrapper = dynamic(() => import('@/components/OSMDWrapper'), { ssr: false });

export default function SplitSheetView({ xmlContent, sheetName }: { xmlContent: string; sheetName?: string }) {
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [events, setEvents] = useState<MidiEvent[] | null>(null);

  useEffect(() => {
    const parsed = parseMusicXMLString(xmlContent);
    setEvents(extractWesternEvents(parsed));
  }, [xmlContent]);

  return (
    <div className="split-sheet-view">
      {sheetName && <h2 className="text-2xl font-bold text-center mb-4">{sheetName}</h2>}

      {events !== null && (
        <div style={{ marginBottom: '1rem' }}>
          <PlayerControls events={events} label="Play" onBeatChange={setCurrentBeat} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-2">
          <div className="text-sm font-semibold mb-1">Western Staff</div>
          <div className="min-h-[300px]">
            <OSMDWrapper xmlContent={xmlContent} currentBeat={currentBeat} />
          </div>
        </div>
        <div className="border rounded-lg p-2 overflow-auto max-h-[400px]">
          <div className="text-sm font-semibold mb-1">Indian Bhatkhande</div>
          <IndianNotation xmlContent={xmlContent} currentBeat={currentBeat} />
        </div>
      </div>
    </div>
  );
}
```

**Update** `src/app/page.tsx` to use `SplitSheetView` instead of `MusicSheetViewer`:
```tsx
// BEFORE:
import MusicSheetViewer from '@/components/MusicSheetViewer';
...
{exampleXml && <MusicSheetViewer xmlContent={exampleXml} sheetName="Chopin Op. 9" />}

// AFTER:
import SplitSheetView from '@/components/SplitSheetView';
...
{exampleXml && <SplitSheetView xmlContent={exampleXml} sheetName="Chopin Op. 9" />}
```

### 8.2 Other UI Suggestions

| Improvement | Description | Effort | Files |
|-------------|-------------|--------|-------|
| **Synced lyrics** | Highlight current lyric syllable as playback progresses | Medium | `IndianNotation.tsx` |
| **Search results** | Show mini notation preview on hover | High | `PostSummary.tsx`, new component |
| **Mobile layout** | Split view stacks vertically on mobile | Low | `SplitSheetView.tsx` (already `grid-cols-1 md:grid-cols-2`) |
| **Loading skeletons** | Animated skeleton while sheet loads | Low | New component |
| **Sheet detail page** | Replace `<ul>` with styled info card + share button | Medium | `src/app/post/[id]/page.tsx` |
| **Auto-scroll grid** | Auto-scroll Bhatkhande grid during playback | Low | `IndianNotation.tsx` |
| **Dark mode toggle** | CSS classes already have `dark:` variants | Low | `Navigation.tsx`, `layout.tsx` |
| **Footer repo link** | Fix `musicGitBeanstalk` → `musicsheetsOracle` | Low | `src/app/layout.tsx:24` |

### 8.3 Create Page Fix

The "Contribute" nav button is disabled and `create/page.tsx` submits a blog post (author/title/tags/body) instead of a music sheet upload. The actual upload API (POST `/api/posts`) accepts multipart form data with a `file` field.

**Fix**: Either:
1. Rework `create/page.tsx` into a proper sheet upload form (file picker + metadata fields)
2. Remove the disabled "Contribute" button from `Navigation.tsx` until ready

---

## Files Referenced

| File | Purpose | Action |
|------|---------|--------|
| `src/lib/audio.ts` | 🛠️ Fix envelope params (Bug 1.1) | Edit |
| `src/components/PlayerControls.tsx` | 🛠️ Fix resume cursor (Bug 1.2), fix pause cursor (Bug 1.3) | Edit |
| `src/lib/indianNotationXml.ts` | ✨ New: Indian Notation XML converter | Create |
| `src/components/SplitSheetView.tsx` | ✨ New: side-by-side homepage demo | Create |
| `src/app/page.tsx` | 🛠️ Use SplitSheetView instead of MusicSheetViewer | Edit |
| `src/app/layout.tsx` | 🛠️ Fix footer repo link | Edit |
| `scripts/bulk-import.mjs` | ✨ New: batch import from PDMX | Create |
| `scripts/notation-roundtrip.mjs` | ✨ New: roundtrip test | Create |
| `src/lib/bhatkhande.ts` | 📖 Read only — works | No change |
| `src/lib/parseMusicXML.ts` | 📖 Read only — works | No change |
| `src/lib/midi.ts` | 📖 Read only — works | No change |
| `src/components/IndianNotation.tsx` | 📖 Read only — renders cleanly | No change |
| `src/components/OSMDWrapper.tsx` | 📖 Read only — cursor works | No change |

---

## Implementation Order (Recommended)

1. **Fix Bug 1.1 (audio.ts)** — 8 lines changed, zero behavioral risk. ✅ High confidence.
2. **Fix Bug 1.2 + 1.3 (PlayerControls.tsx)** — ~20 lines changed, narrow scope. ✅ High confidence.
3. **Create Indian Notation XML converter** — new file, doesn't touch existing code. Safe.
4. **Build import pipeline** — `scripts/bulk-import.mjs`. Standalone script, safe.
5. **Design roundtrip test** — `scripts/notation-roundtrip.mjs`. Standalone script, safe.
6. **UI: SplitSheetView** — new component + minor edit to `page.tsx`. Safe.
7. **Add MongoDB indexes** — standalone script or MongoDB Compass. Safe.
8. **Import PDMX batches** — use import pipeline with rate limiting. Monitoring required.

---

> **Golden rule**: Never modify `bhatkhande.ts`, `parseMusicXML.ts`, or `IndianNotation.tsx`. These are the core conversion pipeline and the user reports they work for all their sheets.

---

## APPENDIX: Changes Applied 2026-07-12

### Applied Fix 1: Sass @import deprecation (globals.scss)

**Files changed**:
- `src/app/globals.scss` — migrated `@import` → `@use` (must come BEFORE `@tailwind`)
- `src/app/layout.tsx` — moved Google Fonts to `<link>` tags with `preconnect`
- `src/custom_scss/_fonts.scss` — removed duplicate `@import url(...)` (now in layout.tsx)
- `src/app/layout.tsx` — fixed footer repo link: `musicGitBeanstalk` → `musicsheetsOracle`
- Added `@iconscout/unicons/css/line.css` import in `layout.tsx`

**Current `globals.scss`**:
```scss
@use '../custom_scss/fonts';
@use '../custom_scss/general';
@use '../custom_scss/structure/topnav';
@use '../custom_scss/structure/footer';
@use '../custom_scss/pages/bhatkhande';

@tailwind base;
@tailwind components;
@tailwind utilities;

html { font-family: "Euclid Circular A", "Akzidenz", Helvetica, Arial, sans-serif; }
body { margin: 0; }
*, *:before, *:after { box-sizing: border-box; }
```

**Note**: `@use` rules MUST come before `@tailwind` in Sass, otherwise Sass throws:
```
Error: @use rules must be written before any other rules.
```

### Applied Fix 2: Envelope bleed (audio.ts)

**Status**: ✅ Applied

`src/lib/audio.ts` — lowered `sustain` and `release` for all synth voices (sine/triangle/square/sawtooth) and harmonium. Notes now stop promptly during rests.

### Applied Fix 3: PlayerControls resume cursor (PlayerControls.tsx)

**Status**: ✅ Applied

`src/components/PlayerControls.tsx`:
- `startBeatTracking(offsetBeats)` — accepts optional offset parameter
- `stopBeatTracking(resetCursor)` — only resets cursor on `stop()` or `done()`, not `pause()`
- Resume path now calls `startBeatTracking(resumeOffset)` instead of overwriting `startTimeRef`
- All `stopBeatTracking()` calls updated with `true` (stop/done/error) or `false` (pause)

### NOT YET Applied (needs implementation)

| Item | Status | Priority |
|------|--------|----------|
| Chinese titles rename script | ❌ Not started | High |
| MongoDB `tls: true` fix in `db.ts` | ❌ Not started | High |
| Homepage example sheet error handling | ❌ Not started | Medium |
| Beat duration display (ga ga dha) | ❌ Not started | **DANGER: touches bhatkhande.ts** |
| Indian Notation XML converter | ❌ Not started | Medium |
| SplitSheetView homepage component | ❌ Not started | Low |
| Bulk import script (PDMX) | ❌ Not started | Low |
| MongoDB indexes | ❌ Not started | Low |

### VPS Memory (separate from code)

The 1GB Oracle Cloud VPS goes OOM during `npm run build`. User should run on VPS:
```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Also set `NODE_OPTIONS` before build:
```bash
NODE_OPTIONS="--max-old-space-size=512" npm run build
```
