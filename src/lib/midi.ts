// MIDI conversion. Standard MIDI numbering: C4 = 60, A4 = 69.

import type { ParsedScore, ParsedNote } from './parseMusicXML';
import { buildKeyAlter } from './parseMusicXML';
import type { NotationData } from './bhatkhande';

const STEP_TO_SEMITONE: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
};

export interface MidiEvent {
  midi: number;
  startBeat: number;
  durationBeats: number;
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
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

function pitchToMidi(step: string, alter: number, octave: number, keyAlter: Record<string, number>): number {
  const totalAlter = alter + (keyAlter[step] || 0);
  return (octave + 1) * 12 + STEP_TO_SEMITONE[step] + totalAlter;
}

// Convert a parsed score to a list of timed MIDI events on the primary voice.
// Walks the same chord/tie semantics as the Bhatkhande converter so the audio
// matches the swara grid exactly.
export function extractWesternEvents(parsed: ParsedScore): MidiEvent[] {
  const keyAlter = buildKeyAlter(parsed.key.fifths);
  const voice = pickPrimaryVoice(parsed.notes);
  const voiceNotes = parsed.notes.filter((n) => (n.voice || '1') === voice);
  const divsPerBeat = parsed.divisions * (4 / parsed.time.beatType);
  if (!Number.isFinite(divsPerBeat) || divsPerBeat <= 0) return [];

  const events: MidiEvent[] = [];
  let cumDiv = 0;
  let lastStartDiv = 0;
  let tieStart: { startDiv: number; duration: number; midi: number } | null = null;

  for (const note of voiceNotes) {
    if (note.duration <= 0) continue;

    if (tieStart) {
      cumDiv += note.duration;
      tieStart.duration += note.duration;
      if (note.tieStop) {
        const startBeat = tieStart.startDiv / divsPerBeat;
        const endBeat = cumDiv / divsPerBeat;
        events.push({
          midi: tieStart.midi,
          startBeat,
          durationBeats: endBeat - startBeat,
        });
        tieStart = null;
      }
      lastStartDiv = cumDiv;
      continue;
    }

    const startDiv = note.isChord ? lastStartDiv : cumDiv;
    const endExclusiveDiv = startDiv + note.duration;
    const startBeat = startDiv / divsPerBeat;
    const durationBeats = (endExclusiveDiv - startDiv) / divsPerBeat;

    if (!note.isRest && note.step) {
      const midi = pitchToMidi(note.step, note.alter, note.octave, keyAlter);

      if (note.tieStart && !note.tieStop) {
        tieStart = { startDiv, duration: note.duration, midi };
      } else {
        events.push({ midi, startBeat, durationBeats });
      }
    }

    if (!note.isChord) {
      cumDiv += note.duration;
      lastStartDiv = cumDiv;
    }
  }

  return events;
}

// Convert the Bhatkhande swara grid to MIDI events. Since each swara maps to
// the same absolute pitch the Western score encodes, this returns the same
// MIDI events as extractWesternEvents — but we expose it separately so the
// player can be wired to either source, and so the API documents intent.
export function extractIndianEvents(parsed: ParsedScore, _data: NotationData): MidiEvent[] {
  // The notes are 1-to-1: the swara grid and the western events represent the
  // same pitches, so the MIDI sequence is identical. The Indian view adds
  // swara labels; the audio is the same.
  return extractWesternEvents(parsed);
}
