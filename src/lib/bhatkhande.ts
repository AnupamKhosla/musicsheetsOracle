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
  voiceUsed: string;
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

function pickPrimaryVoice(notes: ParsedNote[]): string {
  const counts: Record<string, number> = {};
  for (const n of notes) {
    if (n.isRest) continue;
    const v = n.voice || '1';
    counts[v] = (counts[v] || 0) + 1;
  }
  const entries = Object.entries(counts);
  if (entries.length === 0) return '1';
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
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
  const voiceUsed = pickPrimaryVoice(notes);
  const voiceNotes = notes.filter((n) => (n.voice || '1') === voiceUsed);
  if (notes.length > voiceNotes.length) {
    warnings.push(`Showing voice ${voiceUsed} only; other voices ignored.`);
  }

  if (modeSource !== 'none' && key.mode) {
    saOctave = findSaOctave(voiceNotes, saSemitone, keyAlter);
  }

  const divsPerBeat = divisions * (4 / time.beatType);
  if (!Number.isFinite(divsPerBeat) || divsPerBeat <= 0) {
    throw new Error(`Invalid divisions/time: divisions=${divisions}, beatType=${time.beatType}`);
  }

  const labels = SWARA_LABELS[language];

  const allBeats: string[][] = [];
  const ensureBeats = (n: number) => {
    while (allBeats.length <= n) allBeats.push([]);
  };

  let cumDiv = 0;
  let lastStartDiv = 0;
  let tieStartBeat: number | null = null;
  let tieLastDashedBeat = -1;

  const pushSwara = (swaraText: string, startBeat: number, endBeat: number) => {
    ensureBeats(endBeat);
    allBeats[startBeat].push(swaraText);
    for (let b = startBeat + 1; b <= endBeat; b++) {
      allBeats[b].push(TIE);
    }
  };

  for (const note of voiceNotes) {
    if (note.duration <= 0) continue;

    if (tieStartBeat !== null) {
      cumDiv += note.duration;
      const newEndBeat = Math.ceil(cumDiv / divsPerBeat) - 1;
      ensureBeats(newEndBeat);
      const from = Math.max(tieLastDashedBeat + 1, tieStartBeat + 1);
      for (let b = from; b <= newEndBeat; b++) {
        allBeats[b].push(TIE);
      }
      tieLastDashedBeat = newEndBeat;
      if (note.tieStop) {
        tieStartBeat = null;
        tieLastDashedBeat = -1;
      }
      lastStartDiv = cumDiv;
      continue;
    }

    const startDiv = note.isChord ? lastStartDiv : cumDiv;
    const startBeat = Math.floor(startDiv / divsPerBeat);
    const endExclusiveDiv = startDiv + note.duration;
    const endBeat = Math.ceil(endExclusiveDiv / divsPerBeat) - 1;

    ensureBeats(endBeat);

    if (!note.isRest && note.step) {
      const totalAlter = note.alter + (keyAlter[note.step] || 0);
      const ns = STEP_TO_SEMITONE[note.step] + totalAlter;
      const semitoneFromSa = mod(ns - saSemitone, 12);
      const swaraLabel = labels[semitoneFromSa] || labels[0];
      const saptak = saptakForOctave(note.octave, saOctave);
      const marker = SAPTAK_MARKERS[saptak];
      const swaraText = swaraLabel + marker;
      pushSwara(swaraText, startBeat, endBeat);
      tieLastDashedBeat = endBeat;
    }

    if (note.tieStart && !note.tieStop) {
      tieStartBeat = startBeat;
    }

    if (!note.isChord) {
      cumDiv += note.duration;
      lastStartDiv = cumDiv;
    }
  }

  for (let i = 0; i < allBeats.length; i++) {
    if (allBeats[i].length === 0) allBeats[i] = [REST];
  }

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

  // Taal detection: match the time signature's total beat count. 4/4 and 3/4 are
  // the most common Western meters and have no exact sargam-taal equivalent,
  // so we label them generically ("4-beat") without a warning.
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
    voiceUsed,
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
