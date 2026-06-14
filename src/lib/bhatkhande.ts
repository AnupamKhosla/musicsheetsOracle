// Bhatkhande (Indian) notation converter — pure, no DOM dependencies.
// Consumes a normalized ParsedNote array and a few key/time parameters,
// returns a swara-grid data structure ready for rendering.
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
  saptakForOctave,
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
  cells: string[][];
  beatMarks: string[];
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
  '\u0967', '\u0968', '\u0969', '\u096A', '\u096B', '\u096C', '\u096D', '\u096E', '\u096F',
  '\u0967\u0966', '\u0967\u0967', '\u0967\u0968', '\u0967\u0969', '\u0967\u096A', '\u0967\u096B', '\u0967\u096C',
];
const ROW_BEATS = 8;
const TIE = '\u2014';
const REST = '\u00B7';
const SAM = '\u0938\u092E';

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

function buildKeyAlter(fifths: number): Record<string, number> {
  const out: Record<string, number> = {};
  if (fifths > 0) for (let i = 0; i < fifths; i++) out[SHARPS[i]] = 1;
  if (fifths < 0) for (let i = 0; i < Math.abs(fifths); i++) out[FLATS[i]] = -1;
  return out;
}

function pitchToMidi(step: string, alter: number, octave: number, keyAlter: Record<string, number>): number {
  const totalAlter = alter + (keyAlter[step] || 0);
  return (octave + 1) * 12 + STEP_TO_SEMITONE[step] + totalAlter;
}

function noteSemitone(n: ParsedNote, keyAlter: Record<string, number>): number {
  return STEP_TO_SEMITONE[n.step] + n.alter + (keyAlter[n.step] || 0);
}

function findSaOctave(notes: ParsedNote[], saSemitone: number, keyAlter: Record<string, number>): number {
  for (const n of notes) {
    if (n.isRest || !n.step) continue;
    const ns = noteSemitone(n, keyAlter);
    if (mod(ns - saSemitone, 12) === 0) return n.octave;
  }
  return 4;
}

interface VoiceResult {
  beats: string[][];
  midiEvents: MidiEvent[];
}

function processVoice(
  voiceNotes: ParsedNote[],
  labels: Record<number, string>,
  saSemitone: number,
  saOctave: number,
  keyAlter: Record<string, number>,
  divsPerBeat: number,
): VoiceResult {
  const allBeats: string[][] = [];
  const midiEvents: MidiEvent[] = [];

  const ensureBeats = (n: number) => {
    while (allBeats.length <= n) allBeats.push([]);
  };

  let cumDiv = 0;
  let lastStartDiv = 0;
  let tieStartBeat: number | null = null;
  let tieLastDashedBeat = -1;
  let tieMidiStartDiv = 0;
  let tieMidiDuration = 0;
  let tieMidiPitch = 0;

  for (const note of voiceNotes) {
    if (note.duration <= 0) continue;

    // --- tie continuation (swara grid) ---
    if (tieStartBeat !== null) {
      cumDiv += note.duration;
      tieMidiDuration += note.duration;
      const newEndBeat = Math.ceil(cumDiv / divsPerBeat) - 1;
      ensureBeats(newEndBeat);
      const from = Math.max(tieLastDashedBeat + 1, tieStartBeat + 1);
      for (let b = from; b <= newEndBeat; b++) {
        allBeats[b].push(TIE);
      }
      tieLastDashedBeat = newEndBeat;
      if (note.tieStop) {
        const startBeat = tieMidiStartDiv / divsPerBeat;
        const endBeat = cumDiv / divsPerBeat;
        midiEvents.push({
          midi: tieMidiPitch,
          startBeat,
          durationBeats: endBeat - startBeat,
        });
        tieStartBeat = null;
        tieLastDashedBeat = -1;
      }
      lastStartDiv = cumDiv;
      continue;
    }

    const startDiv = note.isChord ? lastStartDiv : cumDiv;
    const displayBeat = Math.floor(startDiv / divsPerBeat);
    const midiStartBeat = startDiv / divsPerBeat;
    const endExclusiveDiv = startDiv + note.duration;
    const endBeat = Math.ceil(endExclusiveDiv / divsPerBeat) - 1;
    const midiDuration = (endExclusiveDiv - startDiv) / divsPerBeat;

    ensureBeats(endBeat);

    if (!note.isRest && note.step) {
      const totalAlter = note.alter + (keyAlter[note.step] || 0);
      const ns = STEP_TO_SEMITONE[note.step] + totalAlter;
      const semitoneFromSa = mod(ns - saSemitone, 12);
      const swaraLabel = labels[semitoneFromSa] || labels[0];
      const saptak = saptakForOctave(note.octave, saOctave);
      const marker = SAPTAK_MARKERS[saptak];
      const swaraText = swaraLabel + marker;

      ensureBeats(endBeat);
      allBeats[displayBeat].push(swaraText);
      for (let b = displayBeat + 1; b <= endBeat; b++) {
        allBeats[b].push(TIE);
      }
      tieLastDashedBeat = endBeat;

      const midi = pitchToMidi(note.step, note.alter, note.octave, keyAlter);
      if (note.tieStart && !note.tieStop) {
        tieStartBeat = displayBeat;
        tieMidiStartDiv = startDiv;
        tieMidiDuration = note.duration;
        tieMidiPitch = midi;
      } else {
        midiEvents.push({ midi, startBeat: midiStartBeat, durationBeats: midiDuration });
      }
    }

    if (!note.isChord) {
      cumDiv += note.duration;
      lastStartDiv = cumDiv;
    }
  }

  // Fill empty beats with REST
  for (let i = 0; i < allBeats.length; i++) {
    if (allBeats[i].length === 0) allBeats[i] = [REST];
  }

  return { beats: allBeats, midiEvents };
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

  // Process all voices independently
  const voiceSet = Array.from(new Set(notes.map((n) => n.voice || '1')));
  const voiceResults: { voice: string; result: VoiceResult }[] = [];
  const allMidiEvents: MidiEvent[] = [];

  for (const voice of voiceSet) {
    const voiceNotes = notes.filter((n) => (n.voice || '1') === voice);
    const result = processVoice(voiceNotes, labels, saSemitone, saOctave, keyAlter, divsPerBeat);
    voiceResults.push({ voice, result });
    allMidiEvents.push(...result.midiEvents);
  }

  // Merge per-voice beats by beat index
  const maxBeats = voiceResults.reduce((m, v) => Math.max(m, v.result.beats.length), 0);
  const allBeats: string[][] = [];
  for (let i = 0; i < maxBeats; i++) {
    allBeats[i] = [];
    for (const { result } of voiceResults) {
      if (i < result.beats.length) {
        for (const swara of result.beats[i]) {
          if (swara !== REST) allBeats[i].push(swara);
        }
      }
    }
    if (allBeats[i].length === 0) allBeats[i] = [REST];
  }

  // Chord event count: notes at beats where 2+ midi events share the same startBeat
  const beatCounts: Record<number, number> = {};
  for (const e of allMidiEvents) {
    beatCounts[e.startBeat] = (beatCounts[e.startBeat] || 0) + 1;
  }
  const chordEventCount = Array.from(Object.values(beatCounts))
    .filter((c) => c >= 2)
    .reduce((a, b) => a + b, 0);

  const rows: DisplayRow[] = [];
  for (let i = 0; i < allBeats.length; i += ROW_BEATS) {
    const cells = allBeats.slice(i, i + ROW_BEATS);
    const beatMarks = cells.map((_, j) => {
      const globalIdx = i + j;
      if (globalIdx === 0) return SAM;
      return HINDI_NUMS[mod(globalIdx, HINDI_NUMS.length)];
    });
    rows.push({ cells, beatMarks });
  }

  const taal = findTaalByBeatCount(time.beats);
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
  TIE,
  REST,
  SAM,
  TAALS,
};
