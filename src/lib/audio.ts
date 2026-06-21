// Audio playback engine. Wraps Tone.js so the rest of the app doesn't depend
// on its API.
//
// Oscillator voices (sine/triangle/square/sawtooth) use Tone.PolySynth for
// instant playback. Real-instrument voices use Tone.Sampler with Gleitz
// MIDI soundfonts (streamed from CDN, cached by browser).

import * as Tone from 'tone';
import type { MidiEvent } from './midi';

const DEFAULT_BPM = 90;

export type Voice = 'sine' | 'triangle' | 'square' | 'sawtooth' | 'piano';

interface VoiceParams {
  oscType: OscillatorType;
  envelope: { attack: number; decay: number; sustain: number; release: number };
}

const VOICE_PARAMS: Record<Exclude<Voice, 'piano'>, VoiceParams> = {
  sine:     { oscType: 'sine',     envelope: { attack: 0.02, decay: 0.1, sustain: 0.6, release: 0.4 } },
  triangle: { oscType: 'triangle', envelope: { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.5 } },
  square:   { oscType: 'square',   envelope: { attack: 0.005, decay: 0.05, sustain: 0.4, release: 0.2 } },
  sawtooth: { oscType: 'sawtooth', envelope: { attack: 0.005, decay: 0.05, sustain: 0.4, release: 0.2 } },
};

let synth: Tone.PolySynth | Tone.Sampler | null = null;
let currentVoice: Voice | null = null;
let pianoSampler: Tone.Sampler | null = null;

async function getPianoSampler(): Promise<Tone.Sampler> {
  if (pianoSampler) return pianoSampler;
  // Local piano samples (downloaded from FluidR3_GM, ~73KB total)
  pianoSampler = new Tone.Sampler({
    urls: {
      'C4': 'C4.mp3',
      'D#4': 'Ds4.mp3',
      'F#4': 'Fs4.mp3',
      'A4': 'A4.mp3',
    },
    release: 1.5,
    baseUrl: '/sounds/piano/',
  }).toDestination();
  await pianoSampler.loaded;
  return pianoSampler;
}

async function getInstrument(voice: Voice): Promise<Tone.PolySynth | Tone.Sampler> {
  if (currentVoice === voice && synth) return synth;
  if (synth) {
    synth.dispose();
    synth = null;
  }
  currentVoice = voice;
  if (voice === 'piano') {
    synth = await getPianoSampler();
  } else {
    const p = VOICE_PARAMS[voice];
    synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: p.oscType },
      envelope: p.envelope,
    }).toDestination();
  }
  return synth;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const note = NOTE_NAMES[((midi % 12) + 12) % 12];
  return `${note}${octave}`;
}

export interface PlaybackOptions {
  bpm?: number;
  voice?: Voice;
  onFinish?: () => void;
}

export interface PlaybackHandle {
  stop: () => void;
  pause: () => void;
  totalDurationMs: number;
}

export async function preloadSamples(voice: Voice = 'triangle'): Promise<void> {
  await Tone.start();
  if (voice === 'piano') {
    await getPianoSampler();
  }
}

export async function playEvents(
  events: MidiEvent[],
  opts: PlaybackOptions = {},
): Promise<PlaybackHandle> {
  await Tone.start();
  const s = await getInstrument(opts.voice ?? 'triangle');

  const bpm = opts.bpm ?? DEFAULT_BPM;
  const secPerBeat = 60 / bpm;

  const maxEndBeat = events.reduce((m, e) => Math.max(m, e.startBeat + e.durationBeats), 0);
  const totalSecs = Math.max(0.5, maxEndBeat * secPerBeat + 0.5);

  const startAt = Tone.now() + 0.05;
  for (const e of events) {
    const time = startAt + e.startBeat * secPerBeat;
    const dur = Math.max(0.05, e.durationBeats * secPerBeat);
    try {
      s.triggerAttackRelease(midiToNoteName(e.midi), dur, time);
    } catch (err) {
      console.warn('triggerAttackRelease failed for', e, err);
    }
  }

  let stopped = false;
  let finishTimer: number | null = null;
  if (opts.onFinish) {
    finishTimer = window.setTimeout(() => {
      if (!stopped) opts.onFinish?.();
    }, totalSecs * 1000);
  }

  return {
    stop: () => {
      stopped = true;
      if (finishTimer !== null) {
        clearTimeout(finishTimer);
        finishTimer = null;
      }
      if (synth === s) {
        synth?.dispose();
        synth = null;
        currentVoice = null;
      } else {
        s.releaseAll(0);
      }
    },
    pause: () => {
      if (stopped) return;
      s.releaseAll(0.1);
    },
    totalDurationMs: totalSecs * 1000,
  };
}

export async function stopAll(): Promise<void> {
  if (synth) synth.releaseAll();
}
