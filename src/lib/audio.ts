// Audio playback engine. Wraps Tone.js so the rest of the app doesn't depend
// on its API.
//
// Oscillator voices (sine/triangle/square/sawtooth) use Tone.PolySynth for
// instant playback. Real-instrument voices use Tone.Sampler with Salamander
// grand-piano samples stored locally under public/sounds/piano/.

import * as Tone from 'tone';
import type { MidiEvent } from './midi';

const DEFAULT_BPM = 90;

export type Voice = 'sine' | 'triangle' | 'square' | 'sawtooth' | 'piano' | 'harmonium';

interface VoiceParams {
  oscType: OscillatorType;
  envelope: { attack: number; decay: number; sustain: number; release: number };
}

const VOICE_PARAMS: Record<Exclude<Voice, 'piano' | 'harmonium'>, VoiceParams> = {
  sine:     { oscType: 'sine',     envelope: { attack: 0.02, decay: 0.1, sustain: 0.1, release: 0.05 } },
  triangle: { oscType: 'triangle', envelope: { attack: 0.02, decay: 0.1, sustain: 0.1, release: 0.05 } },
  square:   { oscType: 'square',   envelope: { attack: 0.005, decay: 0.05, sustain: 0.1, release: 0.05 } },
  sawtooth: { oscType: 'sawtooth', envelope: { attack: 0.005, decay: 0.05, sustain: 0.1, release: 0.05 } },
};

let synth: Tone.PolySynth | Tone.Sampler | null = null;
let currentVoice: Voice | null = null;
let pianoSampler: Tone.Sampler | null = null;
let harmoniumSynth: Tone.PolySynth | null = null;

async function getPianoSampler(): Promise<Tone.PolySynth | Tone.Sampler> {
  // Return cached sampler if it exists.  It will only be nulled out below on
  // explicit load failure so a disposed instance is never re-used.
  if (pianoSampler) return pianoSampler;

  pianoSampler = new Tone.Sampler({
    urls: {
      C3: 'C3.mp3',
      'D#3': 'Ds3.mp3',
      'F#3': 'Fs3.mp3',
      A3: 'A3.mp3',
      C4: 'C4.mp3',
      'D#4': 'Ds4.mp3',
      'F#4': 'Fs4.mp3',
      A4: 'A4.mp3',
      C5: 'C5.mp3',
      'D#5': 'Ds5.mp3',
      'F#5': 'Fs5.mp3',
      A5: 'A5.mp3',
    },
    release: 1.5,
    baseUrl: '/sounds/piano/',
    onerror: (err: any) => {
      console.warn('Piano sampler load error:', err);
    },
  }).toDestination();

  try {
    await Promise.race([
      pianoSampler.loaded,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Piano load timeout')), 8000),
      ),
    ]);
  } catch (e) {
    console.warn('Piano samples failed to load, using synth fallback', e);
    pianoSampler?.dispose();
    pianoSampler = null;
    return new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.005, decay: 0.3, sustain: 0.1, release: 1.2 },
    }).toDestination();
  }

  return pianoSampler;
}

async function getInstrument(voice: Voice): Promise<Tone.PolySynth | Tone.Sampler> {
  if (voice === 'harmonium') {
    if (harmoniumSynth) {
      synth = harmoniumSynth;
      currentVoice = voice;
      return synth;
    }
    // Harmonium: reed organ approximation — sawtooth, slow attack, long release
    harmoniumSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.08, decay: 0.05, sustain: 0.2, release: 0.05 },
    }).toDestination();
    synth = harmoniumSynth;
    currentVoice = voice;
    return synth;
  }
  if (currentVoice === voice && synth) return synth;

  // Dispose the old synth only for oscillator voices.  Piano & harmonium
  // are cached and reused.
  if (synth && currentVoice && !['piano', 'harmonium'].includes(currentVoice)) {
    synth.dispose();
  }
  synth = null;
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
  /** Start playback from this beat offset (for resume after pause). */
  offsetBeats?: number;
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
  const offsetBeats = opts.offsetBeats ?? 0;

  // Filter events after offset and adjust their timing
  const filteredEvents = offsetBeats > 0
    ? events.filter(e => e.startBeat >= offsetBeats).map(e => ({
        ...e,
        startBeat: e.startBeat - offsetBeats,
      }))
    : events;

  if (filteredEvents.length === 0) {
    opts.onFinish?.();
    return {
      stop: () => {},
      pause: () => {},
      totalDurationMs: 0,
    };
  }

  const maxEndBeat = filteredEvents.reduce((m, e) => Math.max(m, e.startBeat + e.durationBeats), 0);
  const totalSecs = Math.max(0.5, maxEndBeat * secPerBeat + 0.5);

  // ── Transport-based scheduling gives real pause/rescue ──
  Tone.Transport.stop();
  Tone.Transport.cancel();
  Tone.Transport.position = 0;
  Tone.Transport.bpm.value = bpm;

  for (const e of filteredEvents) {
    const time = e.startBeat * secPerBeat;
    const dur = Math.max(0.05, e.durationBeats * secPerBeat);
    Tone.Transport.schedule((t) => {
      try {
        s.triggerAttackRelease(midiToNoteName(e.midi), dur, t);
      } catch (err) {
        console.warn('triggerAttackRelease failed for', e, err);
      }
    }, time);
  }

  let stopped = false;
  let finishEvent: number | null = null;
  if (opts.onFinish) {
    finishEvent = Tone.Transport.schedule(() => {
      if (!stopped) opts.onFinish?.();
    }, totalSecs);
  }

  // Kick off transport a hair later so scheduling is settled
  Tone.Transport.start(Tone.now() + 0.05);

  return {
    stop: () => {
      stopped = true;
      Tone.Transport.stop();
      if (finishEvent !== null) {
        Tone.Transport.clear(finishEvent);
        finishEvent = null;
      }
      s.releaseAll();
    },
    pause: () => {
      if (stopped) return;
      Tone.Transport.pause();
      s.releaseAll();
    },
    totalDurationMs: totalSecs * 1000,
  };
}

export async function stopAll(): Promise<void> {
  Tone.Transport.stop();
  Tone.Transport.cancel();
  if (synth) synth.releaseAll();
}
