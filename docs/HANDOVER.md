# Handover

This file is the live session log for the musicsheets project. The next agent
should read `docs/ARCHITECTURE.md` first for the "how it all fits together"
view, then this file for "where we are right now and what's next".

The project is **`musicsheetsOracle`**, a Next.js 16 + React 19 + TypeScript app
at `~/Desktop/Projects/musicsheetsOracle`. It hosts a MongoDB-backed
collection of music sheets. Each post page renders a Western MusicXML
notation (via `opensheetmusicdisplay`) and an auto-generated Bhatkhande
swara grid, with per-tab play/stop audio. Goal: every Western sheet turns
into a correct Indian notation, side-by-side, and eventually the user
will be able to play both and compare.

---

## 1. Current state — what works

| Feature | Status | Notes |
|---|---|---|
| Next.js 16 app, React 19, TypeScript | ✅ Building clean | All 12 routes compile, TS strict, no errors |
| MongoDB posts API (`/api/posts/[id]`) | ✅ | Existing — not touched in this session's work |
| Western staff view (OSMD) | ✅ | `src/components/OSMDWrapper.tsx` pre-cleans the XML (strips `<direction>`, `<sound>`, `<barline>/<repeat>`) and disables title/subtitle/lyrics/credits/part-names/measure-numbers/metronome-marks to avoid overlap |
| Bhatkhande swara grid (Hindi) | ✅ | 5 saptaks (U+0952 anudatta for komal, U+0951 udatta for tivra Ma) |
| Bhatkhande swara grid (English / Bangla) | ✅ | Per-component language picker |
| Taal detection (7 sargam taals) | ✅ | Silent fallback to "N-beat" for common Western meters |
| Auto-suggested thaat in header | ✅ | major→bilawal, `\|fifths\| ∈ {1,2}`→kafi, else→asavari |
| Chord handling (single voice) | ✅ | `<chord/>` notes share the previous note's beat, em-dash continuations |
| Tie handling | ✅ | `<tie type="start/stop">` merge into a single held note |
| Multi-voice (2+ hands) | ❌ **Not yet — see §6 below** | Converter picks the primary voice only; the second voice is dropped |
| `.mxl` support (zipped MusicXML) | ✅ | jszip dynamic import; transparent to caller |
| Playback (synthesized) | ✅ | Tone.PolySynth(Tone.Synth) — 4 voices (sine/triangle/square/sawtooth), no loading |
| Stop button | ✅ | Disposes synth outright — silence in one frame |
| Per-tab player with `onBeatChange` callback | ✅ | PlayerControls tracks current beat via `requestAnimationFrame`; parent can subscribe to highlight cells in sync |
| Current-beat highlight on the Indian grid | ✅ | `IndianNotation` accepts a `currentBeat` prop and adds the `bhatkhande-current` class; the Indian player wires `onBeatChange → setCurrentBeat` |
| Lyrics in a separate block | ✅ | Extracted from `<lyric><text>`, shown below the staff |
| Sticky footer | ✅ | `flex flex-col` on app-container, `flex-1` on main, `mt-auto` on footer |
| 404 page | ✅ | Styled, readable, footer still at bottom |
| Web research (Brave HTML via `webfetch`) | ✅ | Most reliable search tool; not blocked by anti-bot |
| `websearch_cited` (Google via OpenRouter) | ⚠️ Configured | Needs `OPENROUTER_API_KEY` + non-deprecated model; current is `x-ai/grok-4.1-fast` which 404s as deprecated — switch to `x-ai/grok-4.3` and cap `OPENCODE_EXPERIMENTAL_OUTPUT_TOKEN_MAX=4096` |

## 2. Live `git status` (uncommitted at session end)

```
 A  docs/HANDOVER.md                              ← this file (updated this session)
 M  docs/architecture.md                          ← minor: confirmed the architecture is the source of truth
 M  next-env.d.ts                                 ← auto-touched by next build, harmless
MM  src/app/post/[id]/page.tsx                   ← MM = both staged + unstaged changes; current `M` on top
 M  src/components/IndianNotation.tsx            ← added currentBeat prop + highlight class
 M  src/components/OSMDWrapper.tsx                ← pre-cleans XML to drop <direction>, <sound>
 M  src/components/PlayerControls.tsx             ← added onBeatChange RAF-based beat tracker
 M  src/custom_scss/pages/_bhatkhande.scss        ← added .bhatkhande-current highlight class
 M  src/lib/bhatkhande.ts                        ← single-voice conversion (see §6 for multi-voice)
 M  src/lib/parseMusicXML.ts                     ← added lyrics[] field
```

The HEAD on `origin/master` is at `3fe80e5` (the sticky-footer commit).
Pushed at session end. The uncommitted changes above are the work-in-progress
that the next agent should commit.

## 3. Session log (most recent first)

### Session — Jun 14 2026 (this session, final state)

The user kicked off the session asking to check recent commits and the
broken Bhatkhande conversion. The session ran long, and the user is now
handing off to a fresh agent. What got done and what's left:

1. **Audit of `IndianNotation.tsx`** — found 9 real bugs in the conversion
   (komal/tivra, octave, taal, beat marks, chords, ties, voices, key/time
   source, mode=none). All 9 fixed and shipped.
2. **Researched open-source Bhatkhande libraries** — found
   `Studio-kalavati/sargam-spec` (EPL-2.0, Clojure, canonical reference).
   No MusicXML→Bhatkhande converter exists; this project is the first.
3. **Built `src/lib/sargam-data.ts`** — ported swara labels (3 languages),
   7 taal definitions, 5 saptaks, varjit-svaras, raga map.
4. **Built `src/lib/bhatkhande.ts`** — pure conversion logic, all 9 bugs
   fixed.
5. **Removed the `frontend/` CRA folder** — Next.js migration is complete.
6. **Created and then deleted `src/app/notation-test/page.tsx`** — dev
   tool, ended up not being needed once players were integrated into
   the post page tabs.
7. **Restored the original "⚠ Experimental" banner** from the CRA-era
   `b59438b` commit after the user pushed back on a verbose replacement.
8. **Built `src/lib/midi.ts`, `src/lib/audio.ts`, `PlayerControls.tsx`**.
9. **Switched from `Tone.Sampler` to `Tone.PolySynth(Tone.Synth)`** after
   the user pointed out the 8MB MP3 download was overkill. Triangle
   oscillator is the default voice.
10. **Added `.mxl` support** via `jszip` (dynamic import).
11. **Made the Stop button actually stop** — disposes the synth instead
    of `releaseAll()`.
12. **Made the footer stick to the bottom** on short pages.
13. **Wrote `not-found.tsx`** with a styled, readable 404 card.
14. **Removed the `notation-test` page** and the home-page link to it.
15. **Pushed all commits** to `origin/master` (HEAD: `3fe80e5`).
16. **Wrote `docs/ARCHITECTURE.md`** and this file for session continuity.
17. **Discovered the multi-voice gap** — see §6 below. Started a refactor
    in `bhatkhande.ts` to process all voices independently, but the user
    said "stop and edit handover file with this new discoveries rest the
    other model will work on" — handed off mid-refactor.
18. **Reverted the broken in-progress multi-voice refactor** in
    `bhatkhande.ts` so the build is clean for the next agent. Build now
    passes; the multi-voice work is the immediate next task.

### Earlier sessions (visible in git log)

| Commit | Message |
|---|---|
| `3fe80e5` | fix(layout): sticky footer via flex column; remove notation-test; add readable 404 |
| `a0a72ef` | fix(playback): switch to direct synthesis; support .mxl; make Stop actually stop |
| `0f1086c` | feat(playback): add play/stop audio for both Western and Indian views |
| `b6276de` | fix(notation): restore original '⚠ Experimental' banner verbatim |
| `ae44d6a` | fix(notation): restore accuracy banner, drop noisy warnings, add thaat auto-suggest |
| `31999ac` | chore: delete obsolete CRA frontend/ folder |
| `f9f346f` | feat: bhajan player with note highlighting |
| `494dc4b` | Migrate from CRA+Express to Next.js 16.2 + React 19.2 |
| `b59438b` | feat: Bhatkhande notation rewrite with Devanagari & beat grid |
| Earlier | Various post / sheet / search features |

## 4. The 9 original bugs and what fixed them

| # | Bug | Where it was | Fix |
|---|---|---|---|
| 1 | Komal/tivra used `explicitAlter` only | `convertMusicXMLString` | Switch to `totalAlter = explicit + keyAlter[step]` |
| 2 | Octave markers hardcoded to `MADHYAM_OCTAVE=4` | same | Scan notes for the first tonic-pitch, use its octave as the reference |
| 3 | Time signature displayed `beatType/beats` (swapped) | header | Now displays `beats/beatType` correctly |
| 4 | Beat marks only on first row | grid | Emit per display row, not globally |
| 5 | `<chord/>` notes double-advanced `cumDiv` | chord loop | Track `lastStartDiv` and re-use it for chord continuations |
| 6 | `<tie>` notes not merged | tie loop | Track `tieStartBeat`; subsequent notes extend the held note; release on `tieStop` |
| 7 | Multi-voice mixed all voices into one timeline | voice handling | Filter to primary voice (most pitched notes); silent |
| 8 | `<key>`/`<time>`/`<divisions>` read with `document.querySelector` (first match anywhere) | XML read | Read from the first `<measure>` of the first `<part>` |
| 9 | `mode="none"` failed to set Sa | key handling | If mode is none, infer Sa from the first pitched note |

All nine are documented in the commit messages and the comments in
`src/lib/bhatkhande.ts`.

## 5. Known issues / things to fix next (in priority order)

| Priority | Issue | Notes |
|---|---|---|
| **HIGH** | **Multi-voice (two-hand) pieces only play one hand.** See §6 below. The converter picks `voice 5` (or whichever has the most notes) and drops the others. | Need a refactor of `convertToBhatkhande` to process all voices independently, then merge their `allBeats` cells by beat, and combine all `midiEvents`. The user's test case was: piano left hand plays chord in octave 1, right hand plays melody in octave 3. The Indian grid should show BOTH and the player should play BOTH. |
| High | **Player sync across views** — Western OSMD doesn't have a cursor that follows the Indian player's beat. Need OSMD's `cursor.next()` API to be driven by the same `currentBeat`. | The plumbing is in place: `PlayerControls` emits `onBeatChange` with the current beat; we just need to call `osmd.cursor.show()` + `osmd.cursor.next()` from the Western player. |
| Med | **The 9-half minor-mode trick** — `(saSemitone + 9) % 12` only works for natural minor. Harmonic and melodic minor would need a different mapping. | Tracked but not blocking. |
| Med | **Raga detection from note set** — currently we suggest a parent thaat from the key signature alone. A real raga detector would scan the note set and compare against the thaats' arohi/avarohi patterns. | Could be a follow-up. |
| Low | **`<credit>` extraction** — the "Title", "Lyrics", and the "This popular composition in Raag Jog..." description are in `<credit>` elements in MusicXML. We don't extract them. | Could be added to the lyrics block or a separate "About" block. |
| Low | **`<sound>` MIDI program** — would let us pick the right piano sound when we add a real piano voice. | |
| Low | **Raga picker revival** — removed per user request. The data is still in `sargam-data.ts` (`VARJIT_SVARAS`, `LIST_OF_THAATS`). | |
| Low | **`<grace>`, `<time-modification>` (tuplets)** — not parsed. | |
| Low | **`<backup>` / `<forward>`** — not handled; would be needed for correct beat positions in scores that jump around. | |

## 6. The multi-voice refactor — the immediate next task

### The problem the user just asked about

> "does your logic make this example work, western sheet playing two hands, one hand chords in first octave and second hand playing notes in 3rd ocatave. does both western play it correct, second after bhatkande does it show both hands notations and play both?"

The honest answer at the time was: **no**. The converter picks the primary voice (the voice with the most pitched notes), drops the other, and the Indian grid only shows that one's swaras. The Indian player only plays that one.

### Test case to verify the fix

The user explicitly described a piano piece where:
- Voice 1 (left hand, bass clef): plays 3-note chords in the 1st octave
- Voice 2 (right hand, treble clef): plays single melody notes in the 3rd octave
- Both play simultaneously (the chord and the melody on top)

In MusicXML, that's two `<voice>` elements, typically voice 1 and voice 2. After the fix, the Indian grid should:
- Show all swaras from both voices in the same beat cells (the chord from voice 1 stacks above the melody from voice 2)
- The audio should play both voices simultaneously
- The current-beat highlight should follow the shared beat timeline

### What the refactor needs to do

In `src/lib/bhatkhande.ts`, the current `convertToBhatkhande` does:
1. `voiceUsed = pickPrimaryVoice(notes)` — picks one voice
2. `voiceNotes = notes.filter((n) => (n.voice || '1') === voiceUsed)` — drops the others
3. Walks `voiceNotes` to build `allBeats` and `midiEvents`

The refactor needs to:
1. Find all unique voices: `Array.from(new Set(notes.map(n => n.voice || '1')))`
2. For each voice, run a per-voice walk (extract the existing single-voice logic into a `processVoice(voiceNotes, labels, saSemitone, saOctave, keyAlter, divsPerBeat) → { allBeats, midiEvents, chordEventCount }` helper)
3. Merge per-voice results by beat: at each global beat index, concatenate the swara strings from every voice's `allBeats[i]`
4. Combine per-voice `midiEvents` into a single list (all events get scheduled; the audio engine plays them as a chord when they share `startBeat`)
5. Sum per-voice `chordEventCount`

I started this refactor but the user said to stop. I reverted to a build-clean state. The variables and helpers I had in flight (midiEvents / chordEventCount in the NotationData interface, a `processVoice` helper) are NOT in the file — start fresh.

### Re-adding the fields to NotationData

When the next agent does the refactor, they'll need to re-add the fields I had temporarily:

```ts
export interface NotationData {
  // ... existing fields ...
  /**
   * MIDI events from the same note-walk that built the swara grid.
   * Chord notes (multiple swaras in the same beat, whether from a single
   * voice's <chord/> or from multiple voices) share startBeat/durationBeats
   * and play simultaneously. Tied notes are merged. This is the audio
   * source for the "Play Bhatkhande" button.
   */
  midiEvents: MidiEvent[];
  /** How many of the events are part of a chord (>=2 simultaneous swaras in a beat). */
  chordEventCount: number;
}
```

And re-import `MidiEvent` from `./midi` in bhatkhande.ts.

### Wiring the post page

The post page's `PlayerForSheet` is already plumbed for the source split. It currently falls back to `extractWesternEvents` for both sources. Once bhatkhande.ts returns `midiEvents`, change the post page's `if (source === 'indian')` branch to use `data.midiEvents` instead.

The `currentBeat` highlight and the `onBeatChange` plumbing are already in place (see §1).

### Why I stopped

The big `oldString` for the multi-voice refactor didn't match the actual file content (the file had been edited in pieces). The edit failed silently, the build was broken, and the user said "stop and edit handover file with this new discoveries rest the other model will work on" — i.e. let the next agent do the refactor from a clean state with the right context.

## 7. Dependencies

| Package | Why | Notes |
|---|---|---|
| `next@16.2` | Framework | App Router, Turbopack |
| `react@19.2` | UI | |
| `opensheetmusicdisplay@1.8.2` | Western staff rendering | XML is pre-cleaned (strips `<direction>`, `<sound>`) before OSMD sees it |
| `tone@15.1.22` | Audio engine | PolySynth, no sample downloads; was Sampler (8MB MP3) — switched to direct synthesis |
| `jszip@3.10.1` | `.mxl` unzip | Dynamic import — only loads when a `.mxl` is fetched |
| `tailwindcss@3.3` | Utility CSS | Plus custom SCSS in `src/custom_scss/` |
| `sass@1.65` | SCSS compilation | |
| `mongodb@5.7` | DB driver | |
| `react-paginate@8.2` | Pagination | Search results page |
| `@iconscout/unicons@4.0` | Icon set | Tab buttons |
| `dotenv@16.3` | Env vars | |
| `js-beautify@1.15` | (legacy?) | |

## 8. Environment / config

- `OPENCODE_ENABLE_EXA=1` in `~/.zshrc` — enables the built-in `websearch` tool via Exa (semantic search, free, no key).
- `~/.config/opencode/opencode.json` has a `provider.openrouter.options.websearch_cited.model = "x-ai/grok-4.1-fast"` entry — this model is **deprecated** (next agent should switch to `x-ai/grok-4.3` or add `OPENCODE_EXPERIMENTAL_OUTPUT_TOKEN_MAX=4096`).
- `OPENROUTER_API_KEY` and `NVIDIA_API_KEY` are in `~/.zshrc`.
- The Next.js project itself has no `.env` requirements beyond what MongoDB needs (set in dev or production as appropriate).

## 9. Commands cheat sheet

```bash
# Development
cd ~/Desktop/Projects/musicsheetsOracle
npm run dev          # next dev, port 3000
npm run build        # next build (TypeScript check + production build)
npm run lint         # next lint (NOTE: deprecated in Next 16, may not work)

# Git
git status
git add -p
git commit -m "..."
git push origin master

# Reattach a session
opencode --continue
# or: opencode --session <id>
```

## 10. The first thing the next agent should do

The user's immediate question was about multi-voice (2-hand piano) support. The work is sketched in §6. The steps are:

1. Refactor `convertToBhatkhande` in `src/lib/bhatkhande.ts` to process all voices independently, merge their `allBeats` cells by beat, and combine their `midiEvents` (with chord semantics). The `processVoice` helper I sketched in §6 is the right shape.
2. Re-add the `midiEvents: MidiEvent[]` and `chordEventCount: number` fields to the `NotationData` interface and the return value.
3. Re-import `MidiEvent` from `./midi` (the type-only import is already gone, since I removed it during the cleanup).
4. In `src/app/post/[id]/page.tsx`, change the `if (source === 'indian')` branch in `PlayerForSheet` to use `data.midiEvents` from `convertToBhatkhande` instead of `extractWesternEvents`. The wiring (`source: 'indian'`, `onBeatChange={setCurrentBeat}`, `currentBeat={currentBeat}` on `<IndianNotation>`) is already in place.
5. Verify with a 2-voice test case. The existing sample files might or might not be 2-voice — the user can describe one. If no 2-voice sample exists in `public/sheets/`, you can create a minimal test MusicXML with 2 voices (left-hand chord + right-hand melody) and place it in `public/sheets/` for verification.
6. Build (`npm run build`), commit, push.

## 11. What the user is likely to ask next (after multi-voice)

- **Real piano and harmonium voices.** The user explicitly said "we gonna need paiano voice and hormonioum(organ) voice later". When they bring it up, the swap point is `getSynth(voice)` in `src/lib/audio.ts` — keep the `Voice` type, just add a Sampler branch for `'piano' | 'harmonium'`. Note: this means re-introducing sample loading, with all the buffer-not-loaded gotchas that caused issues before. Pre-warm samples on the first play, dispose on stop.
- **OSMD cursor sync** — drive `osmd.cursor.next()` from the same `currentBeat` so the Western staff highlights in lockstep with the Indian grid.
- **Practice mode** — slow tempo + loop a phrase. The player already supports tempo control.
- **MIDI export** — convert the parsed events back to a `.mid` file the user can download.

## 12. Files NOT to touch without checking

- `frontend/` — already deleted; do not recreate.
- `package-lock.json` — pinned; only update via `npm install <pkg>` with explicit version.
- `~/.config/opencode/opencode.json` — the user's opencode config; the `edit` permission rule denies direct edits, so suggest the change in chat.
- `src/lib/sargam-data.ts` — the data is ported from an EPL-2.0 source; preserve the data structure even if the implementation language is rewritten.

## 13. Pointers for the next agent

- The user values **honesty about limitations** more than false polish. The "⚠ Experimental" banner is non-negotiable.
- The user values **not breaking existing features**. When adding new things, run `npm run build` to confirm no regressions.
- The user prefers **direct, simple solutions**. The MP3→synthesized switch was the right call. The side-by-side→tabbed switch was the right call. Multi-voice is the next simplification the user wants.
- The user uses **aggressive, lowercase, typo'd English**. Don't be alarmed; just keep replies concise and direct.
- The user's web research pipeline: **Brave Search HTML via `webfetch` is the most reliable search tool**. `websearch_cited` (Google) needs a paid model or a different model. `websearch` (Exa) works once `OPENCODE_ENABLE_EXA=1` is set.
- The user has flagged that "opencode ran out of quota" once already this session. Be **concise and ship**. Don't sprawl.
- The user has tested the converter with "two hands, chord in 1st octave, melody in 3rd octave". After the multi-voice refactor, hit that test case explicitly before declaring done. (It's a built-in sanity check that the per-voice timeline is correct.)
