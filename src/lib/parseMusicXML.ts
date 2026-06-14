// Pure MusicXML parser. Browser-only (uses DOMParser). Shared between
// the Bhatkhande converter and the audio player so they agree on the
// same ParsedNote[].

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

export interface ParsedScore {
  key: { fifths: number; mode: string };
  time: { beats: number; beatType: number };
  divisions: number;
  title: string;
  notes: ParsedNote[];
}

const SHARPS = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
const FLATS = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];

export function buildKeyAlter(fifths: number): Record<string, number> {
  const out: Record<string, number> = {};
  if (fifths > 0) for (let i = 0; i < fifths; i++) out[SHARPS[i]] = 1;
  if (fifths < 0) for (let i = 0; i < Math.abs(fifths); i++) out[FLATS[i]] = -1;
  return out;
}

export function parseMusicXMLString(xml: string): ParsedScore {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  return parseMusicXMLDoc(doc);
}

export function parseMusicXMLDoc(doc: Document): ParsedScore {
  const errNode = doc.querySelector('parsererror');
  if (errNode) throw new Error('Invalid MusicXML: ' + errNode.textContent);

  const firstPart = doc.querySelector('score-partwise > part') || doc.querySelector('part');
  if (!firstPart) throw new Error('No <part> elements found in MusicXML');

  const firstMeasure = firstPart.querySelector('measure');
  if (!firstMeasure) throw new Error('No <measure> elements found in first part');

  const attrs = firstMeasure.querySelector('attributes');
  const keyEl = attrs?.querySelector('key');
  const fifths = keyEl ? parseInt(keyEl.querySelector('fifths')?.textContent || '0') : 0;
  const mode = keyEl?.querySelector('mode')?.textContent || 'major';

  const timeEl = attrs?.querySelector('time');
  const beats = timeEl ? parseInt(timeEl.querySelector('beats')?.textContent || '4') : 4;
  const beatType = timeEl ? parseInt(timeEl.querySelector('beat-type')?.textContent || '4') : 4;

  const divisionsEl = attrs?.querySelector('divisions');
  const divisions = divisionsEl ? parseInt(divisionsEl.textContent || '1') : 1;

  const title = doc.querySelector('work > work-title')?.textContent
    || doc.querySelector('movement-title')?.textContent
    || '';

  const notes: ParsedNote[] = [];
  firstPart.querySelectorAll('measure note').forEach((noteEl) => {
    const isRest = noteEl.querySelector('rest') !== null;
    const duration = parseInt(noteEl.querySelector('duration')?.textContent || '0');
    let step = '';
    let alter = 0;
    let octave = 4;
    if (!isRest) {
      const pitch = noteEl.querySelector('pitch');
      if (pitch) {
        step = pitch.querySelector('step')?.textContent || '';
        alter = parseInt(pitch.querySelector('alter')?.textContent || '0');
        octave = parseInt(pitch.querySelector('octave')?.textContent || '4');
      }
    }
    const isChord = noteEl.querySelector('chord') !== null;
    const voice = noteEl.querySelector('voice')?.textContent || '1';
    const tieStart = noteEl.querySelector('tie[type="start"]') !== null;
    const tieStop = noteEl.querySelector('tie[type="stop"]') !== null;
    notes.push({ step, alter, octave, duration, voice, isChord, isRest, tieStart, tieStop });
  });

  return { key: { fifths, mode }, time: { beats, beatType }, divisions, title, notes };
}
