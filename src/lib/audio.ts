// Audio playback engine. Wraps Tone.js so the rest of the app doesn't depend
// on its API.
//
// Uses Tone.PolySynth(Tone.Synth) — direct oscillator synthesis, no samples
// to download, instant playback. A voice selector picks the oscillator type
// (sine / triangle / square / sawtooth). Real-instrument voices (piano,
// harmonium) will plug in here later by swapping the synth for a Sampler
// or soundfont-player source — the rest of the API stays the same.

import * as Tone from 'tone';
import type { MidiEvent } from './midi';

const DEFAULT_BPM = 90;

export type Voice = 'sine' | 'triangle' | 'square' | 'sawtooth';

interface VoiceParams {
  oscType: OscillatorType;
  envelope: { attack: number; decay: number; sustain: number; release: number };
}

const VOICE_PARAMS: Record<Voice, VoiceParams> = {
  sine:     { oscType: 'sine',     envelope: { attack: 0.02, decay: 0.1, sustain: 0.6, release: 0.4 } },
  triangle: { oscType: 'triangle', envelope: { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.5 } },
  square:   { oscType: 'square',   envelope: { attack: 0.005, decay: 0.05, sustain: 0.4, release: 0.2 } },
  sawtooth: { oscType: 'sawtooth', envelope: { attack: 0.005, decay: 0.05, sustain: 0.4, release: 0.2 } },
};

let synth: Tone.PolySynth | null = null;
let currentVoice: Voice | null = null;

function getSynth(voice: Voice): Tone.PolySynth {
  if (synth && currentVoice === voice) return synth;
  if (synth) synth.dispose();
  const p = VOICE_PARAMS[voice];
  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: p.oscType },
    envelope: p.envelope,
  }).toDestination();
  currentVoice = voice;
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
  totalDurationMs: number;
}

export async function preloadSamples(_voice: Voice = 'triangle'): Promise<void> {
  // No-op with synth. Kept for API stability so PlayerControls can still
  // call it the same way it would with a real sampler.
  await Tone.start();
}

export async function playEvents(
  events: MidiEvent[],
  opts: PlaybackOptions = {},
): Promise<PlaybackHandle> {
  await Tone.start();
  const s = getSynth(opts.voice ?? 'triangle');

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
      // Dispose the synth outright — releaseAll() respects the envelope's
      // release time so notes fade out audibly, which is fine for ending a
      // piece but not what a Stop button should do. Disposing guarantees
      // silence within one audio frame. A fresh synth is built on the next
      // playEvents() call.
      if (synth === s) {
        synth?.dispose();
        synth = null;
        currentVoice = null;
      } else {
        s.releaseAll(0);
      }
    },
    totalDurationMs: totalSecs * 1000,
  };
}

export async function stopAll(): Promise<void> {
  if (synth) synth.releaseAll();
}
