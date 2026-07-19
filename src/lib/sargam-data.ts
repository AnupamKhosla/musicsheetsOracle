// Reference data for Bhatkhande (Hindustani) notation.
// Data structures and swara/taal/raga labels ported from
// Studio-kalavati/sargam-spec (EPL-2.0). See:
//   https://github.com/Studio-kalavati/sargam-spec
//
// The data (swara keywords, saptak names, taal definitions, raga varjit-svaras)
// is factual and small; the spec format itself is EPL-2.0.
//
// i-note-seq: 12 chromatic swaras + vishram + avagraha = 14 elements.
// Swara position within an octave maps directly to semitone-from-Sa (0..11).
//   index 0  :s   → semitone 0  → Sa
//   index 1  :-r  → semitone 1  → komal Re
//   index 2  :r   → semitone 2  → shuddh Re
//   index 3  :-g  → semitone 3  → komal Ga
//   index 4  :g   → semitone 4  → shuddh Ga
//   index 5  :m   → semitone 5  → Ma
//   index 6  :m+  → semitone 6  → tivra Ma
//   index 7  :p   → semitone 7  → Pa
//   index 8  :-d  → semitone 8  → komal Dha
//   index 9  :d   → semitone 9  → shuddh Dha
//   index 10 :-n  → semitone 10 → komal Ni
//   index 11 :n   → semitone 11 → shuddh Ni
//   index 12 :-   → vishram (silence/rest marker)
//   index 13 :a   → avagraha (elided syllable marker)

export type SwaraKeyword =
  | 's' | '-r' | 'r' | '-g' | 'g' | 'm' | 'm+' | 'p' | '-d' | 'd' | '-n' | 'n' | '-' | 'a';

export type SaptakKeyword =
  | 'ati-mandra' | 'mandra' | 'madhyam' | 'taar' | 'ati-taar';

export const I_NOTE_SEQ: SwaraKeyword[] = [
  's', '-r', 'r', '-g', 'g', 'm', 'm+', 'p', '-d', 'd', '-n', 'n', '-', 'a',
];

export const SAPTAKS: SaptakKeyword[] = [
  'ati-mandra', 'mandra', 'madhyam', 'taar', 'ati-taar',
];

// Saptak markers, layered on top of the swara glyph. Index = saptak idx (0..4).
// Uses Unicode COMBINING marks so they attach to any base glyph (Latin or
// Devanagari) instead of rendering as a separate spacing character.
//   0 ati-mandra: two dots below (U+0323 × 2)
//   1 mandra:     one dot below  (U+0323)
//   2 madhyam:    no marker
//   3 taar:       one dot above  (U+0307)
//   4 ati-taar:   two dots above (U+0307 × 2)
export const SAPTAK_MARKERS: Record<SaptakKeyword, string> = {
  'ati-mandra': '\u0323\u0323',
  'mandra':     '\u0323',
  'madhyam':    '',
  'taar':       '\u0307',
  'ati-taar':   '\u0307\u0307',
};

export type Language = 'english' | 'hindi' | 'bangla';

// Swara label table, indexed by i-note-seq position. Last two are vishram/avagraha.
// Hindi uses proper Devanagari combining marks (U+0952 anudatta for komal,
// U+0951 udatta for tivra Ma) per the sargam-spec convention.
export const SWARA_LABELS: Record<Language, string[]> = {
  english: ['S', 'r', 'R', 'g', 'G', 'm', 'M', 'P', 'd', 'D', 'n', 'N', '-', 'ऽ'],
  hindi:   ['सा', 'रे॒', 'रे', 'ग॒', 'ग', 'म', 'म॑', 'प', 'ध॒', 'ध', 'नि॒', 'नि', '-', 'ऽ'],
  bangla:  ['সা', '̲রে', 'রে', '̲গ', 'গ', 'ম', '॑ম', 'প', '̲ধ', 'ধ', '̲নি', 'নি', '-', 'ऽ'],
};

export const RAGA_LABELS: Record<Language, Record<string, string>> = {
  english: {},
  hindi: {
    bilawal: 'बिलावल', kalyan: 'कल्यण', khamaj: 'खमाज्', bhairav: 'भैरव',
    kafi: 'काफ़ि', poorvi: 'पुर्वि', marwa: 'मार्वा', asavari: 'असावरि',
    bhairavi: 'भैरवि', todi: 'तोडि',
    bhup: 'भूप', hansadhwani: 'हम्सध्वनि', tilakkamod: 'तिलक कामोद',
    jogkauns: 'जोगकौन्स', darbari: 'दरबारी', yaman: 'यमन', shankara: 'शंकरा',
    sohini: 'सोहिनि', bhimpalasi: 'भिम्पलासि', sarang: 'सारंग', kamod: 'कामोद',
    nand: 'नंद', desh: 'देश', puriyadhanashri: 'पुरिया धनाश्रि', all: 'सारे स्वर',
  },
  bangla: {
    bilawal: 'বিলাবল', kalyan: 'কল্যাণ', khamaj: 'খাম্বাজ', bhairav: 'ভৈরব',
    kafi: 'কাফী', poorvi: 'পূরবী', marwa: 'মাড়োয়া', asavari: 'আশাবরী',
    bhairavi: 'ভৈরবী', todi: 'তোড়ী',
    bhup: 'ভূপালী', hansadhwani: 'হংসধ্বনি', tilakkamod: 'তিলক কামোদ',
    jogkauns: 'যোগকোষ', darbari: 'দরবারী', yaman: 'ইমন', shankara: 'শঙ্করা',
    sohini: 'সোহিনী', bhimpalasi: 'ভীমপলশ্রী', sarang: 'সারং', kamod: 'কামোদ',
    nand: 'নন্দ', desh: 'দেশ', puriyadhanashri: 'পুরিয়া ধানেশ্রী', all: 'সমস্ত স্বর',
  },
};

export const TAAL_LABELS: Record<Language, Record<string, string>> = {
  english: {
    teentaal: 'Teentaal', jhaptaal: 'Jhaptaal', ektaal: 'Ektaal',
    rupak: 'Rupak', dadra: 'Dadra', kehrwa: 'Kehrwa', adachautaal: 'Ada Chautaal',
  },
  hindi: {
    teentaal: 'तीन्ताल', jhaptaal: 'झपताल', ektaal: 'एकताल',
    rupak: 'रूपक', dadra: 'दाद्रा', kehrwa: 'केह्र्वा', adachautaal: 'आडा छौताल',
  },
  bangla: {
    teentaal: 'তিনতাল', jhaptaal: 'ঝাঁপতাল', ektaal: 'একতাল',
    rupak: 'রূপক', dadra: 'দাদরা', kehrwa: 'কাহারবা', adachautaal: 'আড়া চৌতাল',
  },
};

export interface TaalDef {
  name: string;
  numBeats: number;
  bhaags: number[];
  samKhaali: Record<number, string>;
  englishLabel: string;
}

export const TAALS: TaalDef[] = [
  { name: 'teentaal',    numBeats: 16, bhaags: [4, 4, 4, 4],       samKhaali: { 1: 'x', 5: '2', 13: '4', 9: 'o' }, englishLabel: 'Teentaal' },
  { name: 'jhaptaal',    numBeats: 10, bhaags: [2, 3, 2, 3],       samKhaali: { 1: 'x', 3: '2', 8: '4', 6: 'o' }, englishLabel: 'Jhaptaal' },
  { name: 'ektaal',      numBeats: 12, bhaags: [2, 2, 2, 2, 2, 2], samKhaali: { 1: 'x', 3: 'o', 5: '2', 7: 'o', 9: '3', 11: '4' }, englishLabel: 'Ektaal' },
  { name: 'rupak',       numBeats: 7,  bhaags: [3, 2, 2],          samKhaali: { 1: 'o', 4: '1', 6: '2' }, englishLabel: 'Rupak' },
  { name: 'dadra',       numBeats: 6,  bhaags: [3, 3],             samKhaali: { 1: 'x', 4: 'o' }, englishLabel: 'Dadra' },
  { name: 'kehrwa',      numBeats: 8,  bhaags: [4, 4],             samKhaali: { 1: 'x', 5: 'o' }, englishLabel: 'Kehrwa' },
  { name: 'adachautaal', numBeats: 14, bhaags: [2, 2, 2, 2, 2, 2, 2], samKhaali: { 1: 'x', 3: '2', 7: '3', 11: '4', 5: 'o', 9: 'o', 13: 'o' }, englishLabel: 'Ada Chautaal' },
];

export const LIST_OF_THAATS = [
  'bilawal', 'kalyan', 'khamaj', 'bhairav', 'kafi', 'poorvi', 'marwa', 'asavari', 'bhairavi', 'todi',
];

// Swaras that are FORBIDDEN in each raga. Ported from sargam-spec's varjit-svaras.
export const VARJIT_SVARAS: Record<string, SwaraKeyword[]> = {
  bilawal: ['-r', '-g', 'm+', '-d', '-n'],
  kalyan: ['-r', '-g', '-d', '-n'],
  khamaj: ['-r', '-g', 'm+', '-d', 'n'],
  bhairav: ['r', '-g', 'm+', 'd', '-n'],
  kafi: ['-r', 'g', 'm+', '-d', 'n'],
  poorvi: ['r', '-g', 'm', 'd', '-n'],
  marwa: ['r', '-g', 'm', '-d', '-n'],
  asavari: ['-r', 'g', 'm+', 'd', 'n'],
  bhairavi: ['r', 'g', 'm+', 'd', 'n'],
  todi: ['r', 'g', 'm', 'd', '-n'],

  bhup: ['-r', '-g', 'm', 'm+', '-d', '-n', 'n'],
  hansadhwani: ['-r', '-g', 'm', 'm+', '-d', 'd', '-n'],
  tilakkamod: ['-r', '-g', 'm+', '-d'],
  jogkauns: ['-r', 'r', 'm+', 'd'],
  darbari: ['-r', 'g', 'm+', 'd', 'n'],
  yaman: ['-r', '-g', 'm', '-d', '-n'],
  shankara: ['-r', '-g', 'm', 'm+', '-d', '-n'],
  sohini: ['r', '-g', 'm', 'p', '-d', '-n'],
  bhimpalasi: ['-r', 'g', 'm+', '-d', 'n'],
  sarang: ['-r', '-g', 'g', 'm+', 'd', '-d'],
  kamod: ['-r', '-g', '-d', 'n', '-n'],
  nand: ['-r', '-g', '-d', '-n'],
  desh: ['-r', '-g', 'm+', '-d'],
  puriyadhanashri: ['r', '-g', 'm', 'd', '-n'],
  all: [],
};

// Look up the swara keyword for a given semitone-from-Sa.
export function semitoneToSwara(semitone: number): SwaraKeyword {
  return I_NOTE_SEQ[((semitone % 12) + 12) % 12];
}

// Look up a taal by total beat count.
export function findTaalByBeatCount(beats: number): TaalDef | null {
  return TAALS.find((t) => t.numBeats === beats) || null;
}

// Get the saptak for a note given its absolute MIDI pitch and Sa's absolute
// MIDI pitch. Indian saptak boundaries are at Sa, NOT at Western octave
// boundaries (C). The madhya saptak spans [Sa, Sa+12). Notes below Sa are
// mandra regardless of their Western octave number.
//
// Reference: Wikipedia "Svara" — "the number of dots above or below the svara
// symbol means the number of octaves above or below the corresponding svara in
// madhya saptak (middle octave)."
export function saptakForMidi(noteMidi: number, saMidi: number): SaptakKeyword {
  const diff = noteMidi - saMidi;
  if (diff < -12) return 'ati-mandra';
  if (diff < 0) return 'mandra';
  if (diff < 12) return 'madhyam';
  if (diff < 24) return 'taar';
  return 'ati-taar';
}

// Legacy: octave-based saptak (WRONG for notes near Sa that cross Western
// octave boundaries). Kept for reference only — use saptakForMidi instead.
export function saptakForOctave(noteOctave: number, saOctave: number): SaptakKeyword {
  const diff = noteOctave - saOctave;
  if (diff <= -2) return 'ati-mandra';
  if (diff === -1) return 'mandra';
  if (diff === 0) return 'madhyam';
  if (diff === 1) return 'taar';
  return 'ati-taar';
}
