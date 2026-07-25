// Bhatkhande (Indian) notation converter — pure, no DOM dependencies.
//
// Implements the notation system defined in docs/notation-spec.md:
//   - Per-voice NoteInstance collection (tie chains collapse into one instance)
//   - Global merge across voices, bucketed by beat
//   - Interval-partition by time overlap (sequential → same sub-row, chord →
//     stacked sub-rows)
//   - Repeat swara across beats and across sub-beat slots (no em-dash)
//   - Meend link flags from <slur> spans
//
// Data structures (saptak names, swara keywords, taal definitions, raga
// varjit-svaras) are imported from sargam-data.ts, ported from
// Studio-kalavati/sargam-spec (EPL-2.0).

import {
  SAPTAKS,
  SAPTAK_MARKERS,
  SWARA_LABELS,
  TAALS,
  TAAL_LABELS,
  findTaalByBeatCount,
  saptakForMidi,
  type Language,
  type TaalDef,
} from './sargam-data';
import { type MidiEvent } from './midi';

export interface ParsedNote {
  step: string;
  alter: number;
  octave: number;
  duration: number;
  voice: string;
  isChord: boolean;
  isRest: boolean;
  tieStart: boolean;
  tieStop: boolean;
  slurStart?: boolean;
  slurStop?: boolean;
}

export interface KeyInfo {
  fifths: number;
  mode: string;
}

export interface TimeInfo {
  beats: number;
  beatType: number;
}

export interface NotationOptions {
  key: KeyInfo;
  time: TimeInfo;
  divisions: number;
  notes: ParsedNote[];
  title?: string;
  language?: Language;
}

export interface DisplayRow {
  cells: string[][][];
  beatMarks: string[];
  /** Parallel to cells: meendLinks[cellIdx][subrowIdx][swaraPos] = true means
   * an arc connects this swara to the next swara in the same sub-row. */
  meendLinks: boolean[][][];
  /** Parallel to cells: holdLinks[cellIdx][subrowIdx][swaraPos] = true means a
   * "smiley bracket" `⌣` UNDER this swara connects it to the next swara — the
   * two are repetitions of the SAME combo (one or more NoteInstances held
   * simultaneously across consecutive sub-slots within this beat — one
   * continuous held sound, not re-articulated). */
  holdLinks: boolean[][][];
  /** Parallel to cells: chordLinks[cellIdx][subrowIdx][swaraPos] = true means
   * this swara position holds a CHORD combo — 2+ simultaneous notes merged into
   * one horizontal glyph group with a top bar + tint. False = single swara. */
  chordLinks: boolean[][][];
  /** Parallel to cells (one per beat cell): true means this cell is part of a
   * cross-beat hold — a NoteInstance is sustained across a beat boundary, so a
   * smiley bracket `⌣` is drawn under it. */
  crossBeatHolds: boolean[];
  /** Parallel to cells: true means this cell is the FIRST cell of a cross-beat
   * hold segment (the bracket's left arm starts here, inset). A new segment
   * begins whenever a different held note starts — so two abutting held notes
   * (e.g. a D half then an S' half) are two separate brackets with a visible
   * hand-lift gap between them, not one misleading continuous bracket. */
  crossHoldStart: boolean[];
  /** Parallel to cells: true means this cell is the LAST cell of a cross-beat
   * hold segment (the bracket's right arm ends here, inset). */
  crossHoldEnd: boolean[];
}

export interface NotationData {
  title: string;
  saName: string;
  saSemitone: number;
  saOctave: number;
  beats: number;
  beatType: number;
  taal: TaalDef | null;
  taalNameLabel: string;
  rows: DisplayRow[];
  voicesUsed: string[];
  midiEvents: MidiEvent[];
  chordEventCount: number;
  warnings: string[];
  language: Language;
}

const STEP_TO_SEMITONE: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
};

const SHARPS = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
const FLATS = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const HINDI_NUMS = [
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16',
];
const ROW_BEATS = 8;
const REST = '\u00B7';
const SAM = '\u0938\u092E';

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

function gcd2(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}

function gcdAll(nums: number[]): number {
  return nums.reduce((g, n) => gcd2(g, n), 0) || 1;
}

function buildKeyAlter(fifths: number): Record<string, number> {
  const out: Record<string, number> = {};
  if (fifths > 0) for (let i = 0; i < fifths; i++) out[SHARPS[i]] = 1;
  if (fifths < 0) for (let i = 0; i < Math.abs(fifths); i++) out[FLATS[i]] = -1;
  return out;
}

function noteSemitone(n: ParsedNote, keyAlter: Record<string, number>): number {
  // MusicXML's <alter> element is authoritative when present (encoders include
  // it for every chromatic pitch, including key-signature accidentals —
  // verified against real scores). Adding keyAlter on top double-counts
  // the key signature: F# in D major would compute as Ma instead of Ga.
  // We only fall back to keyAlter when <alter> was absent (=0) for a step
  // that has a key-signature accidental.
  const alter = (n.alter !== 0) ? n.alter : (keyAlter[n.step] || 0);
  return STEP_TO_SEMITONE[n.step] + alter;
}

function findSaOctave(notes: ParsedNote[], saSemitone: number, keyAlter: Record<string, number>): number {
  for (const n of notes) {
    if (n.isRest || !n.step) continue;
    const ns = noteSemitone(n, keyAlter);
    if (mod(ns - saSemitone, 12) === 0) return n.octave;
  }
  return 4;
}

// A note instance occupies [startDiv, endDiv) on the timeline. It carries the
// swara text, MIDI pitch, and the slur flags from its source note. Ties collapse
// a chain into one instance spanning the full tied duration.
interface NoteInstance {
  voice: string;
  startDiv: number;
  endDiv: number;
  swaraText: string;
  midi: number;
  slurStart: boolean;
  slurStop: boolean;
  underSlur?: boolean;
}

function processVoice(
  voiceNotes: ParsedNote[],
  labels: Record<number, string>,
  saSemitone: number,
  saOctave: number,
  keyAlter: Record<string, number>,
  divsPerBeat: number,
): { instances: NoteInstance[]; midiEvents: MidiEvent[] } {
  const instances: NoteInstance[] = [];
  const midiEvents: MidiEvent[] = [];

  const saMidi = (saOctave + 1) * 12 + saSemitone;

  let position = 0;
  let lastStartDiv = 0;

  // Tie chain accumulator. While non-null, subsequent non-chord notes extend
  // the held note instead of starting a new one. A <chord/> mid-tie is a
  // different simultaneous pitch, not a continuation — we let it flow through
  // the normal branch (it won't extend the tie).
  let tieAccum: {
    startDiv: number;
    midi: number;
    swaraText: string;
    slurStart: boolean;
  } | null = null;

  for (const note of voiceNotes) {
    if (note.duration <= 0) continue;

    const startDiv = note.isChord ? lastStartDiv : position;
    const endDiv = startDiv + note.duration;

    if (note.isRest || !note.step) {
      if (!note.isChord) {
        position = endDiv;
        lastStartDiv = startDiv;
      }
      continue;
    }

    const ns = noteSemitone(note, keyAlter);
    const semitoneFromSa = mod(ns - saSemitone, 12);
    const swaraLabel = labels[semitoneFromSa] || labels[0];
    const midi = (note.octave + 1) * 12 + ns;
    const saptak = saptakForMidi(midi, saMidi);
    const marker = SAPTAK_MARKERS[saptak];
    const swaraText = swaraLabel + marker;

    // --- Tie continuation branch ---
    // A non-chord note arriving while a tie is open extends the held note's
    // duration. If it's tieStop, we finalize the instance and the midi event.
    if (tieAccum && !note.isChord) {
      if (note.tieStop) {
        const tieStartDiv = tieAccum.startDiv;
        instances.push({
          voice: note.voice,
          startDiv: tieStartDiv,
          endDiv,
          swaraText: tieAccum.swaraText,
          midi: tieAccum.midi,
          slurStart: tieAccum.slurStart,
          slurStop: note.slurStop || false,
        });
        midiEvents.push({
          midi: tieAccum.midi,
          startBeat: tieStartDiv / divsPerBeat,
          durationBeats: (endDiv - tieStartDiv) / divsPerBeat,
        });
        tieAccum = null;
      }
      // Either way, this note advanced the timeline for the held tie.
      position = endDiv;
      lastStartDiv = startDiv;
      continue;
    }

    // --- Tie start: open a new tie chain ---
    if (note.tieStart && !note.tieStop) {
      tieAccum = { startDiv, midi, swaraText, slurStart: note.slurStart || false };
      // The chain still occupies time on the grid as a NoteInstance — we push
      // it now with endDiv = endDiv of the start note. When the stop note
      // arrives, the tie-continuation branch above will push a SECOND spanning
      // instance and we'll dedupe in the merge step below via startDiv.
      // To avoid double-counting we DON'T push an instance here; the tie
      // span is encoded only by the final instance pushed at tieStop time.
      // The midi event is pushed at finalize.
      if (!note.isChord) {
        position = endDiv;
        lastStartDiv = startDiv;
      }
      continue;
    }

    // --- Regular note ---
    instances.push({
      voice: note.voice,
      startDiv,
      endDiv,
      swaraText,
      midi,
      slurStart: note.slurStart || false,
      slurStop: note.slurStop || false,
    });
    midiEvents.push({
      midi,
      startBeat: startDiv / divsPerBeat,
      durationBeats: note.duration / divsPerBeat,
    });

    if (!note.isChord) {
      position = endDiv;
      lastStartDiv = startDiv;
    }
  }

  // Flush a dangling tie (final <tie type="start"/> with no stop). Without
  // this, the last held note of a piece never gets an instance/midi event.
  if (tieAccum) {
    const tieStartDiv = tieAccum.startDiv;
    const endDiv = position;
    instances.push({
      voice: '',
      startDiv: tieStartDiv,
      endDiv,
      swaraText: tieAccum.swaraText,
      midi: tieAccum.midi,
      slurStart: tieAccum.slurStart,
      slurStop: false,
    });
    midiEvents.push({
      midi: tieAccum.midi,
      startBeat: tieStartDiv / divsPerBeat,
      durationBeats: (endDiv - tieStartDiv) / divsPerBeat,
    });
    tieAccum = null;
  }

  return { instances, midiEvents };
}

export function convertToBhatkhande(opts: NotationOptions): NotationData {
  const warnings: string[] = [];
  const { key, time, divisions, notes, title = '' } = opts;
  const language: Language = opts.language || 'hindi';

  let saSemitone = mod(key.fifths * 7, 12);
  let saOctave = 4;
  const modeSource = (key.mode || 'major') as string;

  if (modeSource === 'minor') {
    saSemitone = mod(saSemitone + 9, 12);
  } else if (modeSource === 'none' || !key.mode) {
    const firstPitched = notes.find((n) => !n.isRest && n.step);
    if (firstPitched) {
      saSemitone = mod(STEP_TO_SEMITONE[firstPitched.step] + firstPitched.alter, 12);
      saOctave = firstPitched.octave;
    }
  }

  const keyAlter = buildKeyAlter(key.fifths);

  if (modeSource !== 'none' && key.mode) {
    saOctave = findSaOctave(notes, saSemitone, keyAlter);
  }

  const divsPerBeat = divisions * (4 / time.beatType);
  if (!Number.isFinite(divsPerBeat) || divsPerBeat <= 0) {
    throw new Error(`Invalid divisions/time: divisions=${divisions}, beatType=${time.beatType}`);
  }

  const labels = SWARA_LABELS[language];

  // --- Process every voice into NoteInstances + midi events ---
  const voiceSet = Array.from(new Set(notes.map((n) => n.voice || '1')));
  const allInstances: NoteInstance[] = [];
  const allMidiEvents: MidiEvent[] = [];

  for (const voice of voiceSet) {
    const voiceNotes = notes.filter((n) => (n.voice || '1') === voice);
    const { instances, midiEvents } = processVoice(
      voiceNotes, labels, saSemitone, saOctave, keyAlter, divsPerBeat,
    );
    allInstances.push(...instances);
    allMidiEvents.push(...midiEvents);
  }

  // --- Deduplicate unison voices ---
  // When multiple voices play the exact same pitch at the same time (same
  // midi + startDiv + endDiv), it's unison doubling — not a chord. Collapse
  // to a single instance so the grid shows one swara, not "SS" stacked.
  // Uses midi (absolute pitch) as key: two Sa at different octaves have
  // different midi values and are correctly kept as separate saptak-marked
  // swaras. Only truly identical pitches are deduplicated.
  {
    const seen = new Set<string>();
    const deduped: NoteInstance[] = [];
    for (const inst of allInstances) {
      const key = `${inst.midi}|${inst.startDiv}|${inst.endDiv}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(inst);
    }
    allInstances.length = 0;
    allInstances.push(...deduped);
  }

  {
    const seen = new Set<string>();
    const deduped: MidiEvent[] = [];
    for (const ev of allMidiEvents) {
      const key = `${ev.midi}|${ev.startBeat}|${ev.durationBeats}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(ev);
    }
    allMidiEvents.length = 0;
    allMidiEvents.push(...deduped);
  }

  // --- Mark "underSlur" per voice, in time order ---
  // A slur opens at a note with slurStart and closes at the next note (per
  // voice) with slurStop; everything in between is under the slur → eligible
  // for meend linking.
  for (const voice of voiceSet) {
    const vi = allInstances
      .filter((i) => i.voice === voice)
      .sort((a, b) => a.startDiv - b.startDiv);
    let slurOpen = false;
    for (const inst of vi) {
      if (inst.slurStart) slurOpen = true;
      if (slurOpen) inst.underSlur = true;
      if (inst.slurStop) slurOpen = false;
    }
  }

  // --- Build the grid: bucket all instances by beat, chord-combo layout ---
  // One sub-row per cell. For each slot within the beat we collect every
  // NoteInstance "playing" in that slot. Consecutive slots with identical
  // instance sets collapse into reps (repeated swaras with a hold-smiley-bracket
  // linking them). Multiple simultaneous instances in a slot render as a chord
  // combo — their swaras joined horizontally with a top bar + tint (chordLinks).
  const maxEndDiv = allInstances.reduce((m, i) => Math.max(m, i.endDiv), 0);
  const totalBeats = Math.max(0, Math.ceil(maxEndDiv / divsPerBeat));

  const allBeats: string[][][] = [];
  const meendLinksPerBeat: boolean[][][] = [];
  const holdLinksPerBeat: boolean[][][] = [];
  const chordLinksPerBeat: boolean[][][] = [];

  for (let b = 0; b < totalBeats; b++) {
    const beatStart = b * divsPerBeat;
    const beatEnd = beatStart + divsPerBeat;

    const touching = allInstances
      .filter((i) => i.startDiv < beatEnd && i.endDiv > beatStart)
      .map((i) => ({
        inst: i,
        clippedStart: Math.max(i.startDiv, beatStart),
        clippedEnd: Math.min(i.endDiv, beatEnd),
      }));

    if (touching.length === 0) {
      allBeats.push([[REST]]);
      meendLinksPerBeat.push([[]]);
      holdLinksPerBeat.push([[]]);
      chordLinksPerBeat.push([[]]);
      continue;
    }

    const clippedDurations = touching.map((t) => t.clippedEnd - t.clippedStart);
    const unit = gcdAll([divsPerBeat, ...clippedDurations]);
    const safeUnit = unit > 0 ? unit : divsPerBeat;
    const numSlots = Math.round(divsPerBeat / safeUnit);

    const slotted = touching.map((t) => ({
      inst: t.inst,
      slotStart: Math.round((t.clippedStart - beatStart) / safeUnit),
      slotEnd: Math.round((t.clippedEnd - beatStart) / safeUnit),
    }));

    // For each slot in [0, numSlots), find every instance playing in that slot,
    // sorted by voice for stable display order.
    const slotGroups: (typeof slotted)[] = [];
    for (let s = 0; s < numSlots; s++) {
      slotGroups.push(
        slotted
          .filter((x) => x.slotStart <= s && x.slotEnd > s)
          .sort((a, b2) =>
            a.inst.voice.localeCompare(b2.inst.voice) ||
            a.inst.startDiv - b2.inst.startDiv
          ),
      );
    }

    // Collapse consecutive slots with identical instance sets into single
    // "combos" with reps > 1. Two slots are the same combo iff every playing
    // instance is identical (same start div, voice, swara) — strict reference
    // equality via startDiv identity prevents false hold links across separate
    // re-articulated reiterations of the same swara.
    const comboSignature = (g: typeof slotted): string =>
      g
        .map((x) => `${x.inst.startDiv}|${x.inst.voice}|${x.inst.swaraText}`)
        .sort()
        .join('||');

    interface Combo {
      members: typeof slotted;
      reps: number;
      startSlot: number;
    }
    const combos: Combo[] = [];
    let i = 0;
    while (i < numSlots) {
      const group = slotGroups[i];
      let reps = 1;
      while (
        i + reps < numSlots &&
        comboSignature(slotGroups[i + reps]) === comboSignature(group)
      ) {
        reps++;
      }
      combos.push({ members: group, reps, startSlot: i });
      i += reps;
    }

    // Flatten combos into one linear sub-row, filling each combo's reps with
    // repeated swara text. This is also where we cross-reference `underSlur` to
    // decide meend link placement.
    const strings: string[] = [];
    const meandLinks: boolean[] = [];
    const holdLinks: boolean[] = [];
    const chordLinks: boolean[] = [];

    // Track each combo's first/last swara index in `strings` for meend linking.
    const comboRanges: Array<{ first: number; last: number; combo: Combo }> = [];

    for (const combo of combos) {
      const first = strings.length;
      if (combo.members.length === 0) {
        // Empty slot = rest. Emit one REST per rep so position math stays in
        // sync with numSlots.
        for (let r = 0; r < combo.reps; r++) {
          strings.push(REST);
          meandLinks.push(false);
          holdLinks.push(false);
          chordLinks.push(false);
        }
        comboRanges.push({ first, last: strings.length - 1, combo });
        continue;
      }

      const comboText = combo.members.map((m) => m.inst.swaraText).join('');
      const isChord = combo.members.length > 1;

      for (let r = 0; r < combo.reps; r++) {
        strings.push(comboText);
        meandLinks.push(false);
        holdLinks.push(false);
        chordLinks.push(isChord);
      }

      // Within-combo hold: reps > 1 means the same combo is held across
      // consecutive slots → smiley bracket between adjacent reps.
      if (combo.reps > 1) {
        for (let r = 0; r < combo.reps - 1; r++) {
          holdLinks[first + r] = true;
        }
      }

      comboRanges.push({ first, last: strings.length - 1, combo });
    }

    // Meend: arc from each combo's last swara to the next combo's first swara
    // when both combos are single-instance (monophonic glide), same voice, and
    // both instances are under slur.
    for (let c = 0; c < comboRanges.length - 1; c++) {
      const a = comboRanges[c];
      const b = comboRanges[c + 1];
      if (a.combo.members.length !== 1 || b.combo.members.length !== 1) continue;
      const ai = a.combo.members[0].inst;
      const bi = b.combo.members[0].inst;
      if (ai.voice !== bi.voice) continue;
      if (!ai.underSlur || !bi.underSlur) continue;
      if (a.last < strings.length) {
        meandLinks[a.last] = true;
      }
    }

    allBeats.push([strings]);
    meendLinksPerBeat.push([meandLinks]);
    holdLinksPerBeat.push([holdLinks]);
    chordLinksPerBeat.push([chordLinks]);
  }

  // --- Cross-beat hold detection (segment-aware) ---
  // First find where a held note actually CONTINUES across a beat boundary
  // (some instance spans b→b+1). Two adjacent held notes that merely abut
  // (e.g. a D half-note then an S' half-note) do NOT continue across their
  // shared boundary, so they become two separate bracket segments with a
  // visible hand-lift gap between them — not one misleading continuous bracket.
  const continueAcross: boolean[] = new Array(totalBeats).fill(false);
  for (let b = 0; b < totalBeats - 1; b++) {
    const boundaryDiv = (b + 1) * divsPerBeat;
    continueAcross[b] = allInstances.some(
      (inst) => inst.startDiv < boundaryDiv && inst.endDiv > boundaryDiv,
    );
  }
  const crossBeatHoldsGlobal: boolean[] = new Array(totalBeats).fill(false);
  const crossHoldStartGlobal: boolean[] = new Array(totalBeats).fill(false);
  const crossHoldEndGlobal: boolean[] = new Array(totalBeats).fill(false);
  for (let b = 0; b < totalBeats; b++) {
    const inLeft = b > 0 && continueAcross[b - 1];
    const outRight = continueAcross[b];
    if (inLeft || outRight) crossBeatHoldsGlobal[b] = true;
    if (outRight && !inLeft) crossHoldStartGlobal[b] = true;
    if (inLeft && !outRight) crossHoldEndGlobal[b] = true;
  }

  // --- Chord event count (mirror of previous behaviour) ---
  const beatCounts: Record<number, number> = {};
  for (const e of allMidiEvents) {
    beatCounts[e.startBeat] = (beatCounts[e.startBeat] || 0) + 1;
  }
  const chordEventCount = Array.from(Object.values(beatCounts))
    .filter((c) => c >= 2)
    .reduce((a, b) => a + b, 0);

  // --- Group into display rows of ROW_BEATS ---
  const rows: DisplayRow[] = [];
  const taal = findTaalByBeatCount(time.beats);
  const cycleBeats = taal ? taal.numBeats : null;
  for (let i = 0; i < allBeats.length; i += ROW_BEATS) {
    const cells = allBeats.slice(i, i + ROW_BEATS);
    const meendLinks = meendLinksPerBeat.slice(i, i + ROW_BEATS);
    const holdLinks = holdLinksPerBeat.slice(i, i + ROW_BEATS);
    const chordLinks = chordLinksPerBeat.slice(i, i + ROW_BEATS);
    const crossBeatHolds = crossBeatHoldsGlobal.slice(i, i + ROW_BEATS);
    const crossHoldStart = crossHoldStartGlobal.slice(i, i + ROW_BEATS);
    const crossHoldEnd = crossHoldEndGlobal.slice(i, i + ROW_BEATS);
    const beatMarks = cells.map((_, j) => {
      const globalIdx = i + j;
      const cycleLen = cycleBeats ?? 16;
      if (globalIdx % cycleLen === 0) return SAM;
      return HINDI_NUMS[mod(globalIdx % cycleLen, HINDI_NUMS.length)];
    });
    rows.push({ cells, beatMarks, meendLinks, holdLinks, chordLinks, crossBeatHolds, crossHoldStart, crossHoldEnd });
  }

  let taalNameLabel = '';
  if (taal) {
    const langTaals = TAAL_LABELS[language];
    taalNameLabel = langTaals[taal.name] || taal.englishLabel;
  } else {
    taalNameLabel = `${time.beats}-beat`;
  }

  return {
    title,
    saName: NOTE_NAMES[saSemitone],
    saSemitone,
    saOctave,
    beats: time.beats,
    beatType: time.beatType,
    taal,
    taalNameLabel,
    rows,
    voicesUsed: voiceSet,
    midiEvents: allMidiEvents,
    chordEventCount,
    warnings,
    language,
  };
}

export const NOTATION_CONSTANTS = {
  STEP_TO_SEMITONE,
  SAPTAKS,
  HINDI_NUMS,
  ROW_BEATS,
  REST,
  SAM,
  TAALS,
};
