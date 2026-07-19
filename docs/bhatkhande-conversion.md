# Bhatkhande Conversion Logic

This document covers the Western MusicXML → Hindustani Bhatkhande notation
conversion algorithm, its design decisions, known bugs found and fixed, and
remaining edge cases.

---

## 1. Core Principle: Sa is Movable (Like Movable-Do Solfege)

**Sa is NOT fixed to C.** Sa = the tonic of the piece, determined by the key
signature. This is identical to movable-Do solfege where Do = tonic.

| Key Signature | Sa = | Reasoning |
|---|---|---|
| C major (0 sharps) | C | Tonic is C |
| G major (1 sharp) | G | Tonic is G |
| D major (2 sharps) | D | Tonic is D |
| A minor (0 sharps) | A | Relative minor tonic |
| mode="none" | First pitched note | Heuristic fallback |

**Formula:** `saSemitone = mod(key.fifths * 7, 12)` for major.
For minor: `saSemitone = mod(saSemitone + 9, 12)` (relative minor is +9 semitones).

**References:**
- Stanford CCRMA: "The artist can choose Sa/the tonic to be any frequency"
- SwarGanga: "Sa is not fixed to any absolute pitch. Sa is the tonic you choose"
- Wikipedia (Svara): "The tone Sa is, as in Western moveable-Do solfège, the tonic"
- web-harmonium.app: "Sargam is always movable. Sa is wherever the drone is"

---

## 2. Saptak (Octave) Determination — CRITICAL FIX

### The Rule (from Bhatkhande's own notation system)

Saptak boundaries are at **Sa**, NOT at Western octave boundaries (C).

> "The number of dots above or below the svara symbol means the number of
> octaves above or below the corresponding svara in madhya saptak (middle
> octave)." — Wikipedia, Svara article

> "A dot below a swar means lower octave (Mandra saptak); a dot above means
> higher octave (Taar saptak)." — SwarGanga

### The Madhya Saptak Spans [Sa, Sa + 12 semitones)

| MIDI range relative to Sa | Saptak | Marker |
|---|---|---|
| diff < -12 | Ati-mandra | Two dots below (U+0323 × 2) |
| -12 ≤ diff < 0 | Mandra | One dot below (U+0323) |
| 0 ≤ diff < 12 | Madhya (middle) | No marker |
| 12 ≤ diff < 24 | Taar | One dot above (U+0307) |
| diff ≥ 24 | Ati-taar | Two dots above (U+0307 × 2) |

### Example: Key of G major, Sa = G4 (MIDI 67)

| Note | MIDI | diff from Sa | Saptak | Marker |
|---|---|---|---|---|
| F#4 (Ni) | 66 | -1 | Mandra | dot below |
| G4 (Sa) | 67 | 0 | Madhya | none |
| C5 (Ma) | 72 | +5 | Madhya | none |
| F#5 (Ni) | 78 | +11 | Madhya | none |
| G5 (Sa') | 79 | +12 | Taar | dot above |

### The Bug We Fixed

**Old code:** `saptakForOctave(note.octave, saOctave)` — compared Western
octave numbers. WRONG because C5 with Sa=G4 would get `diff=1` → taar, but
C5 is actually WITHIN the madhya saptak (between G4 and G5).

**Fixed code:** `saptakForMidi(noteMidi, saMidi)` — compares absolute MIDI
pitch to Sa's absolute MIDI pitch. Correct.

---

## 3. Saptak Marker Glyphs — RENDERING FIX

### The Bug We Fixed

**Old:** Used `\u0902` (Devanagari Anusvara) for taar. This is a **spacing**
character — after Latin 'S' it renders as a separate `ं` glyph → looks like
"S0" or "Sं".

**Fixed:** Uses `\u0307` (COMBINING DOT ABOVE) — a true Unicode combining mark
that attaches to any base glyph. 'S' + U+0307 → 'Ṡ' (S with dot above).

### Current Markers

```
ati-mandra: U+0323 U+0323  (two combining dots below)
mandra:     U+0323         (one combining dot below)
madhyam:    (empty)
taar:       U+0307         (one combining dot above)
ati-taar:   U+0307 U+0307  (two combining dots above)
```

---

## 4. Swara (Note Name) Determination

### Semitone-from-Sa → Swara Label

The 12 chromatic positions map to the i-note-seq:

| Semitone from Sa | Keyword | Hindi | English | Role |
|---|---|---|---|---|
| 0 | s | सा | S | Sa (tonic, immovable) |
| 1 | -r | रे॒ | r | Komal Re |
| 2 | r | रे | R | Shuddh Re |
| 3 | -g | ग॒ | g | Komal Ga |
| 4 | g | ग | G | Shuddh Ga |
| 5 | m | म | m | Shuddh Ma |
| 6 | m+ | म॑ | M | Tivra Ma |
| 7 | p | प | P | Pa (fifth, immovable) |
| 8 | -d | ध॒ | d | Komal Dha |
| 9 | d | ध | D | Shuddh Dha |
| 10 | -n | नि॒ | n | Komal Ni |
| 11 | n | नि | N | Shuddh Ni |

### Komal/Tivra Detection

Uses `noteSemitone()` which applies the `<alter>` element authoritatively when
non-zero, falling back to key signature only when `<alter>` is absent (=0).
This prevents double-counting (F# in D major would otherwise compute as F##).

---

## 5. Multi-Voice Handling

### Unison Deduplication

When multiple voices play the **exact same pitch** at the **exact same time**
(same MIDI + startDiv + endDiv), it's unison doubling — NOT a chord. We
collapse to a single instance so the grid shows one swara, not "SS" stacked.

**Key:** Uses `midi` (absolute pitch) as the dedup key. Two Sa at different
octaves have different MIDI values → correctly kept as separate saptak-marked
swaras. Only truly identical pitches are deduplicated.

### True Chords

When different pitches sound simultaneously (different MIDI values at the same
startDiv), they ARE a chord → displayed as a chord combo with tint background.

---

## 6. Tie Handling

- `<tie type="start">` opens a tie chain — no instance pushed yet
- `<tie type="stop">` closes the chain — one instance spanning the full duration
- Dangling tie (start with no stop) — flushed at end of voice with duration = position
- Ties do NOT advance the timeline for chord notes (`<chord/>` mid-tie)

---

## 7. Cross-Beat Hold Bracket

When a NoteInstance spans a beat boundary (`startDiv < boundary && endDiv >
boundary`), both adjacent cells are marked with `crossBeatHolds = true`. The
renderer draws a teal smiley bracket `⌣` across the cell border.

---

## 8. Known Remaining Edge Cases

### 8a. `<alter>0</alter>` explicitly written

If an encoder writes `<alter>0</alter>` to mean "natural" (canceling a key-sig
accidental), our code treats it as absent and falls back to keyAlter. Rare in
practice — most encoders omit `<alter>` entirely for naturals.

### 8b. findSaOctave uses first occurrence

`findSaOctave` returns the octave of the FIRST note matching Sa's pitch class.
If the first Sa is in an unusual octave (e.g., a high pickup note), all saptak
markers could shift. A better heuristic would use the most common Sa octave or
the median. Low priority — most scores have Sa in the expected range.

### 8c. Minor mode +9 trick

`saSemitone = mod(saSemitone + 9, 12)` assumes natural minor. Harmonic/melodic
minor would need different mapping. Tracked but not blocking.

### 8d. Cross-beat hold marks entire cell

If a cell has a chord and only ONE member spans the boundary, the entire cell
gets `crossBeatHolds = true`. Minor visual issue.

---

## 9. Files Involved

| File | Role |
|---|---|
| `src/lib/sargam-data.ts` | Swara labels, saptak markers, taal defs, `saptakForMidi()` |
| `src/lib/bhatkhande.ts` | Main converter: `convertToBhatkhande()` |
| `src/lib/midi.ts` | `extractWesternEvents()` — MIDI events for audio |
| `src/lib/parseMusicXML.ts` | XML → ParsedScore (shared by all paths) |
| `src/components/IndianNotation.tsx` | React renderer for the swara grid |
| `src/custom_scss/pages/_bhatkhande.scss` | Grid styling, brackets, chord tint |

---

## 10. Changelog of Fixes (2026-07-19 session)

1. **Saptak calculation** — replaced octave-based with MIDI-distance-based
2. **Saptak markers** — replaced spacing U+0902 with combining U+0307
3. **Unison dedup** — both visual grid AND audio events now deduplicated
4. **Cross-beat hold** — new feature: bracket spans beat cell boundaries
5. **midi.ts double-counting** — `pitchToMidi` no longer adds alter + keyAlter
6. **Chord combo font** — reduced 25% for compact multi-note display
7. **Pause/resume** — fixed missing `* 1000` (seconds→milliseconds) in beat tracking
8. **MXL vs gzip detection** — DB stores both gzip AND raw MXL (ZIP) in `xmlGz` field;
   API must detect format by magic bytes before decompressing

---

## 11. Architecture: Current vs Future (SSR / Backend Conversion)

### Current State (2026-07)

- **Conversion runs client-side** in `src/lib/bhatkhande.ts` (pure TS, no DOM).
- XML is fetched from `/api/posts/:id` → decompressed → passed to client components.
- Next.js RSC **cannot serialize large XML strings** as server→client props (they
  become broken `$a0` references in the flight payload). Client components MUST
  fetch XML themselves via the API route.

### Planned: Full SSR

- Move XML decompression + Bhatkhande conversion to the **server component**.
- Pass only the final `NotationData` JSON (small, serializable) to client.
- Eliminates the client-side fetch round-trip and the RSC serialization issue.

### Planned: Backend-Hosted Conversion (IP Protection)

- Move `bhatkhande.ts` + `sargam-data.ts` + `parseMusicXML.ts` to a **private
  backend API** (not shipped in the client bundle).
- Client sends MusicXML → backend returns `NotationData` JSON.
- Algorithm source never reaches the browser → cannot be stolen from JS bundle.
- The `src/lib/` files become server-only modules (Next.js `server-only` package
  or a separate microservice).

### DB Storage Format (CRITICAL)

The `xmlGz` field in MongoDB stores **two different formats** depending on when
the sheet was imported:

| Magic bytes | Format | Decompression |
|---|---|---|
| `1f 8b` | gzip-compressed XML | `gunzipSync(buf)` → XML string |
| `50 4b` (PK) | Raw MXL (ZIP containing XML) | `JSZip` → extract `.xml` entry |

The API route MUST detect the format before decompressing:

```ts
const raw = Buffer.from(xmlGz.buffer);
if (raw[0] === 0x1f && raw[1] === 0x8b) {
  // gzip
  xml = gunzipSync(raw).toString('utf-8');
} else if (raw[0] === 0x50 && raw[1] === 0x4b) {
  // MXL (ZIP)
  const zip = await JSZip.loadAsync(raw);
  const xmlFile = zip.file(/\.xml$/i)?.[0];
  xml = xmlFile ? await xmlFile.async('string') : '';
}
```

This dual-format support is required until all sheets are re-imported with
consistent gzip-only storage.
