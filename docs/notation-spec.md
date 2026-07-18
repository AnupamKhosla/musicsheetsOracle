# Musicsheets.site Notation Spec

**Status**: Canonical reference for the musicsheets.site Bhatkhande renderer.
**Last updated**: 2026-07-18
**Scope**: Defines every symbol our converter emits, what it means, and how it
maps from MusicXML. This is the source of truth for `src/lib/bhatkhande.ts`,
`src/components/IndianNotation.tsx`, and the user-facing `/notation-guide` page.

---

## 0. Lineage

Our system is **Bhatkhande notation** (Pt. Vishnu Narayan Bhatkhande, early
1900s) with **digital-friendly improvised additions** specific to
musicsheets.site. Where we deviate from Bhatkhande, the deviation is explicitly
flagged with **[OURS]**.

Reference systems consulted:
- Standard Bhatkhande (Devanagari, used in textbooks / Vishnu Digdarshika etc.)
- **raag-hindustani.com** (Sadhana / Usha Jayaraman, CC-NC-ND) — table-based
  grid layout (16 columns for teentaal, alternating section colors, sam
  highlighted), directly inspired our grid; their Notation ID system
  (`S r R g G m M P d D n N`, `'S`/`S'` for saptak) matches our English sargam
  symbol-for-symbol.
- Humdrum `**bhatk` representation (Parag Chordia) — the only prior formal
  digital spec; ASCII symbols for meend `[ ]`, andolan `~`, khatka `%`,
  murki `w`, kan `< >`, accent `+`.
- Various modern sites — all tweak for digital; we are continuing that
  tradition with explicit, documented rules.

Western parallels (for non-Indian readers): movable-**do solfège** (Do=Sa) and
Chinese **jianpu** (numbered notation) are conceptually identical to sargam.

### Saptak marker convention

Two valid Bhatkhande conventions exist for octaves:
- **Devanagari textbook style** (default Hindi output): dot below (U+0323) for
  mandra, chandrabindu (U+0902) for taar.
- **raag-hindustani.com style**: quotation marks — `S'` upper octave (after),
  `'S` lower octave (before).

Our default renderer uses **English sargam with Devanagari saptak markers**
because Devanagari swaras with multiple combining marks (anudatta + saptak dot)
stack ambiguously across browsers/platforms. Switching to the quote-style would
require changing `SAPTAK_MARKERS` in `sargam-data.ts`.

---

## 1. Pitch

### 1.1 The 12 swaras

| #  | Name              | Symbol (Hindi) | Symbol (English) | Alter vs Sa |
|----|-------------------|----------------|------------------|-------------|
| 0  | Shadaj             | सा              | S                | 0           |
| 1  | Komal Rishabh     | रे॒            | r                | -1 (flat)   |
| 2  | Shuddh Rishabh    | रे              | R                | 0           |
| 3  | Komal Gandhar     | ग॒            | g                | -1 (flat)   |
| 4  | Shuddh Gandhar    | ग              | G                | 0           |
| 5  | Shuddh Madhyam    | म              | M                | 0           |
| 6  | Tivra Madhyam     | म॑            | m                | +1 (sharp)  |
| 7  | Pancham            | प              | P                | 0           |
| 8  | Komal Dhaivat     | ध॒            | d                | -1 (flat)   |
| 9  | Shuddh Dhaivat    | ध              | D                | 0           |
| 10 | Komal Nishad      | नि॒           | n                | -1 (flat)   |
| 11 | Shuddh Nishad     | नि             | N                | 0           |

- **Komal** (flat) marker: U+0952 DEVANAGARI ANUDATTA (॒) — a short horizontal
  line **below** the swara glyph. Applies to r, g, d, n only.
- **Tivra** (sharp) marker: U+0951 DEVANAGARI UDATTA (॑) — a vertical line
  **above** the swara glyph. Applies to Ma only.
- Sa and Pa are **achala** (immovable) — they have no komal/tivra form.

**MusicXML mapping**: `<step>` → swara letter; `<alter>` is authoritative when
present — encoders include `<alter>1</alter>` for every chromatic pitch,
including key-signature accidentals (verified against real scores: F# and C#
in D-major violin part carry explicit `<alter>1</alter>`). We therefore use
`n.alter` when non-zero, falling back to `keyAlter[step]` only when `<alter>`
was absent.

**Bug history**: An earlier version of `noteSemitone()` did
`step + alter + keyAlter[step]`, double-counting the key signature. Effect:
F#5 in D major was computed as F+1+1 = Ma instead of F+1 = Ga, making chords
like "Sa+Ga" render as "Sa+Ma". Same bug existed in `processVoice()`'s inline
`note.alter + keyAlter[...]` calculation. Both fixed 2026-07-18.

### 1.2 Saptaks (octaves)

| Saptak       | Marker (Hindi)                      | Marker (English) | Octave offset from Sa |
|--------------|-------------------------------------|------------------|------------------------|
| Ati-mandra   | two dots below (U+0323 ×2)          | `'S`              | -2                     |
| Mandra       | one dot below (U+0323)              | `'S`              | -1                     |
| Madhya       | (none)                              | `S`               | 0                      |
| Taar         | chandrabindu (U+0902)               | `S'`              | +1                     |
| Ati-taar     | two chandrabindu (U+0902 ×2)        | `S''`             | +2                     |

Actual renderer output combines the swara letter (`S`/`r`/`R`/...) with the
saptak marker from `SAPTAK_MARKERS` in `sargam-data.ts`. Currently English
sargam + Devanagari markers; quote-style markers (`'`/`'+`) are an alternative
per raag-hindustani.com convention.

---

## 2. Rhythm

### 2.1 Beat (matra)

A "beat" in our grid = one MusicXML beat in the `<time>` signature. In 4/4,
one beat = one quarter note. The grid lays out 8 beats per display row.

### 2.2 Taal cycle markers

Top row of every cell shows the **beat mark**:

- **सम (SAM)** at beat 0 and at the start of every subsequent taal cycle.
- Devanagari numerals (१, २, ३, …) for subsequent beats within the cycle.
- 7 taals are detected by beat count: Teentaal (16), Jhaptaal (10), Ektaal
  (12), Rupak (7), Dadra (6), Kehrwa (8), Ada Chautaal (16 + 2.5 bhaag).
- Non-matching meter → "N-beat" label and `cycleLen = 16` for sam placement.

**MusicXML mapping**: `<time><beats>` + `<time><beat-type>` → taal lookup via
`findTaalByBeatCount()`.

### 2.3 Cell contents

Each beat cell holds **1 or more sub-rows**. Each sub-row is one horizontal
sequence of swaras (or rest/tie tokens). Sub-row semantics are defined in §3.

### 2.4 Rest token

- A **completely empty beat** (no notes touch it) renders as `·` (U+00B7
  MIDDLE DOT) in a single sub-row.

---

## 3. Time within a beat — the chord-combo rule  **[OURS]**

This is the most important deviation from standard Bhatkhande, and the one
that defines how our grid reads. Standard Bhatkhande is **monophonic**: no
chord concept exists. We add an explicit chord-combo rule for digital piano
scores, where RH + LH frequently play simultaneous notes.

### 3.1 The rule

> **One row per beat cell. Simultaneous notes merge into a single horizontal
> "combo" glyph group with a subtle background tint. Sequential notes sit
> left-to-right on that same row. No vertical stacking, no top bar.**

The chord combo is visually marked only by a **subtle rose-tint background**
on the joined swaras (e.g. `"SG"` for a Sa+Ga chord). A top bar was originally
attempted but removed — adjacent chord-rep spans merged into a continuous
horizontal line that looks like a spurious grid line across the row.

### 3.2 Examples

```
Beat cell with one slot       →  नि         (single instance)
Beat cell with two slots
  - sequential, different notes →  नि म॑      (ni for slot 0, ma for slot 1)
  - same note held both slots    →  सा सा     (Sa held across both slots; smiley bracket `⌣` under them)
Beat cell with one slot, chord  →  सागप       (Sa + Ga + Pa played simultaneously; top bar + tint over them)
Piano RH+LH chord sustained
across two slots                →  सागि सागि  (chord held for 2 slots; combo shows under top bar both reps; smiley bracket between reps)
```

### 3.3 Detection algorithm

The converter partitions notes **across all voices** that touch a beat into a
single horizontal row of "combos":

1. For each beat, collect every note that starts before the beat ends and ends
   after the beat starts (clipped to the beat).
2. Compute the **subdivision unit** = GCD of (beat length, all clipped note
   durations). E.g. a 4-div beat with a half+half split → unit = 2.
3. For each slot `[0, numSlots)`, find every instance "playing" in that slot
   (instance.slotStart ≤ s && instance.slotEnd > s). Sort by voice for stable
   display order.
4. **Combo collapse**: scan slots left-to-right. Consecutive slots with the
   identical instance set merge into one combo with `reps = N`. Each combo's
   swara text is the concatenation of all member swaras (e.g.
   `"Sa" + "Ga" + "Pa" = "SaGaPa"`).
5. Each combo's reps are emitted as repeated swara strings in the row
   (`"SaGaPa" "SaGaPa" "SaGaPa"` for 3 reps).
6. `chordLinks` flag is set on every swara position belonging to a chord combo
   (member count > 1). The renderer draws the top bar + tint on those.
7. `holdLinks` flag is set between adjacent reps of the same combo within the
   same beat → renderer draws smiley bracket `⌣` connecting them.
8. `meendLinks` flag is set between two adjacent combos when BOTH are
   single-instance (monophonic), same voice, and both instances are under slur
   → renderer draws the meend arc.

### 3.4 Why this is right

- **True chords** (multiple notes at same start div) merge into one combo with
  top bar → unambiguous "these play together" signal. Never stacks.
- **Sequential notes** in one beat (no overlap) → separate combos left-to-right
  → unambiguous "this then this".
- **Held notes** spanning multiple slots → same combo reps → top bar + smiley
  bracket = "this combo is sustained".
- **Across voices (piano LH+RH)**: the chord combo rule subsumes the
  RH-melody + LH-accompaniment case — all simultaneous notes land in the same
  slot and merge into one combo. Visually compact, audibly correct.

### 3.5 Audio

MIDI events are computed independently with proper chord/tie semantics —
combos play correctly as simultaneous onsets regardless of the visual layout.

### 3.6 Sources

- raag-hindustani.com (Sadhana / Usha Jayaraman, CC-NC-ND) — uses a similar
  table-based grid layout (16 columns for teentaal, alternating section
  colors, sam highlighted). Our grid is directly inspired by the visual
  clarity of that layout, adapted for monophonic Hindustani repertoire with our
  combo extension for polyphonic sources.

---

## 4. Duration / held notes — repeat, no dashes  **[OURS]**

### 4.1 The rule

> **A note that lasts more than one beat appears as the same swara glyph in
> every beat it covers. No em-dash `—`, no elongation hyphen.**

### 4.2 Within a beat — smiley bracket

When a combo (single note OR chord) fills multiple consecutive sub-slots in
ONE beat, the reps are joined by a **"smiley bracket" `⌣`** under them:

```
सम  २  ३  ४
सा  सा सा ·    ← actually "सा सा" with `⌣` bracket
```

(The bracket is rendered as a thin curved `U` under adjacent reps of the same
combo; the swaras themselves are still separate glyphs, one per slot.)

### 4.3 Across beats — smiley bracket spans cells

A held note that spans multiple beats also gets the smiley bracket `⌣`,
connecting the same swara across consecutive beat cells. The bracket should
visually continue across cell boundaries.

```
सम  २  ३  ४
सा  सा सा सा   ← one long `⌣` across four cells (single tie chain)
```

This is **[OURS]**: standard Bhatkhande uses a dash, we use repeats + a
spanning smiley bracket. The spanning works for:

- A single MusicXML `<note>` with large `<duration>` (e.g. a whole note)
- A `<tie>` chain across multiple notes
- **Separate consecutive `<note>` elements with the same pitch** — common in
  MusicXML encodings where the encoder splits a long held tone into multiple
  beamed notes for visual reasons. Our converter merges these into one logical
  "held" instance so the smiley bracket spans them.

**Bug history**: An earlier version of the converter only set `holdLinks`
within a single beat, missing the cross-beat case entirely. Fixed 2026-07-18.

### 4.4 Why [OURS]

Standard Bhatkhande's dash `-` is ambiguous: in instrumental music it can
mean either "rest" or "elongate previous". Beginners find this confusing.
Repeating the swara is unambiguous — the player sees exactly what they should
hold, in every cell it occupies. The smiley bracket makes the "held, not
re-articulated" semantics visually obvious.

### 4.5 Ties

MusicXML `<tie type="start"/> … <tie type="stop"/>` collapses a tie chain into
a single NoteInstance spanning the full tied duration. The visual result is the
tied swara repeated in every beat along the chain — comfortable to read.
Audio plays it as a single sustained note (no re-articulation at beat
boundaries).

---

## 5. Meend  **[OURS — partially]**

### 5.1 What it is

**Meend (मींड)** is a smooth glide from one swara to another, sliding through
the intermediate shrutis (microtones). It's the signature ornament of
Hindustani music — you don't glissando on a piano, but on voice/reed/string
you slide.

### 5.2 Visual

A **curved arc `⌒` above the swaras** involved. The arc connects two (or more)
swaras in the same sub-row that are flagged as under a slur.

```
  ⌒
सा ग          ← glide from Sa to Ga through the intermediate pitches
```

### 5.3 Mapping

**MusicXML `<slur type="start"> … <slur type="stop">`** → meend. Notes inside
the slur span are marked `underSlur=true`. Consecutive under-slur notes that
land in the same sub-row get a `meendLink` flag pointing from each note's
last slot to the next note's first slot — the renderer draws the arc there.

### 5.4 Edge cases

- A slur spanning multiple beats: each sub-row gets its own arc segment; we
  don't draw across beat cells (would be visually noisy). The meend reads as
  "continuous glide" by convention.
- A slur that ends without an explicit stop: flushed at end of voice.
- A slur across just one note (degenerate): no arc drawn.
- Slurs across voices: ignored (meend is a single-voice melodic gesture).

### 5.5 Why this is the right mapping

Humdrum's `**bhatk` scheme uses `[` `]` ASCII brackets for meend start/end —
the only prior formal digital mapping — and confirms slur↔meend is the
canonical correspondence.

---

## 6. Lyrics

Extracted from `<lyric><text>…</text></lyric>` on the MusicXML note elements,
in document order. Rendered as a separate block below the staff, not inside
the grid (keeps the grid clean).

**Future [OURS]**: per-beat syllable highlighting during playback, synced to
`currentBeat`.

---

## 7. Not yet implemented (roadmap)

| Symbol        | Meaning                  | MusicXML source                          | Status |
|---------------|--------------------------|------------------------------------------|--------|
| Kan (grace)   | superscript grace note   | `<grace>`                                | TODO   |
| Andolan       | vibrato on a note        | `<wavy-line>` / heuristic                 | TODO   |
| Khatka/Murki  | fast ornamental cluster  | heuristic from grace+chord               | TODO   |
| Avagrah       | resting point in lyric   | heuristically from `,`/`;` in lyrics     | TODO   |
| `<backup>`    | reverse cursor           | n/a (voice filtering handles it)         | skip   |
| `<forward>`   | forward cursor (silence) | n/a                                      | skip   |

---

## 8. Filename / source of truth

- **Spec**: this file (`docs/notation-spec.md`).
- **Converter implementation**: `src/lib/bhatkhande.ts`.
- **Renderer**: `src/components/IndianNotation.tsx`.
- **Parser**: `src/lib/parseMusicXML.ts`.
- **Audio events**: `src/lib/midi.ts` + `src/lib/audio.ts`.
- **User-facing guide page**: `/notation-guide` (renders §1–§5 as a visual
  legend with live examples).
