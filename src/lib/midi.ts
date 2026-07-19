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

export function pitchToMidi(step: string, alter: number, octave: number, keyAlter: Record<string, number>): number {
  // MusicXML <alter> is authoritative when non-zero (encoders include it for
  // every chromatic pitch, including key-signature accidentals). Adding
  // keyAlter on top double-counts: F# in D major → F+1+1 = F## instead of F#.
  // Fall back to keyAlter only when <alter> was absent (=0).
  const totalAlter = (alter !== 0) ? alter : (keyAlter[step] || 0);
  return (octave + 1) * 12 + STEP_TO_SEMITONE[step] + totalAlter;
}

function processVoiceMidi(voiceNotes: ParsedNote[], keyAlter: Record<string, number>, divsPerBeat: number): MidiEvent[] {
  const events: MidiEvent[] = [];
  let cumDiv = 0;
  let lastStartDiv = 0;
  let tieStart: { startDiv: number; duration: number; midi: number } | null = null;

  for (const note of voiceNotes) {
    if (note.duration <= 0) continue;

    if (tieStart && !note.isChord) {
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

  // Flush any pending tie at end of voice. Same reasoning as bhatkhande.ts:
  // a final <tie type="start"/> with no stop should still produce a MIDI
  // event spanning the held duration.
  if (tieStart) {
    const startBeat = tieStart.startDiv / divsPerBeat;
    const endBeat = cumDiv / divsPerBeat;
    events.push({
      midi: tieStart.midi,
      startBeat,
      durationBeats: endBeat - startBeat,
    });
    tieStart = null;
  }

  return events;
}

// Convert a parsed score to a list of timed MIDI events from ALL voices.
// Walks the same chord/tie semantics as the Bhatkhande converter so the audio
// matches the swara grid exactly. Multi-voice: each voice is processed
// independently and their events are merged so chords across voices play
// simultaneously.
export function extractWesternEvents(parsed: ParsedScore): MidiEvent[] {
  const keyAlter = buildKeyAlter(parsed.key.fifths);
  const divsPerBeat = parsed.divisions * (4 / parsed.time.beatType);
  if (!Number.isFinite(divsPerBeat) || divsPerBeat <= 0) return [];

  const voiceSet = new Set(parsed.notes.map((n) => n.voice || '1'));
  const allEvents: MidiEvent[] = [];

  for (const voice of voiceSet) {
    const voiceNotes = parsed.notes.filter((n) => (n.voice || '1') === voice);
    allEvents.push(...processVoiceMidi(voiceNotes, keyAlter, divsPerBeat));
  }

  // Deduplicate unison voices: when multiple voices produce the exact same
  // event (same midi, startBeat, durationBeats), keep only one. This matches
  // the visual grid's unison dedup in bhatkhande.ts and prevents audio from
  // playing doubled notes on multi-voice unison scores.
  const seen = new Set<string>();
  const deduped: MidiEvent[] = [];
  for (const ev of allEvents) {
    const key = `${ev.midi}|${ev.startBeat}|${ev.durationBeats}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(ev);
  }

  return deduped;
}

// Convert the Bhatkhande swara grid to MIDI events. Since each swara maps to
// the same absolute pitch the Western score encodes, this returns the same
// MIDI events as extractWesternEvents — but we expose it separately so the
// player can be wired to either source, and so the API documents intent.
export function extractIndianEvents(parsed: ParsedScore, _data: NotationData): MidiEvent[] {
  return extractWesternEvents(parsed);
}
