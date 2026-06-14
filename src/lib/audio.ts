// Audio playback engine. Wraps Tone.js so the rest of the app doesn't depend
// on its API. Uses Tone.Sampler with the Salamander grand piano samples
// (free, hosted by Tone.js). One global Sampler instance is reused across
// all players.

import * as Tone from 'tone';
import type { MidiEvent } from './midi';

const DEFAULT_BPM = 90;

let sampler: Tone.Sampler | null = null;
let initPromise: Promise<Tone.Sampler> | null = null;

const SAMPLER_URLS: Record<string, string> = {
  A1: 'A1.mp3',
  A2: 'A2.mp3',
  A3: 'A3.mp3',
  A4: 'A4.mp3',
  A5: 'A5.mp3',
  A6: 'A6.mp3',
  C1: 'C1.mp3',
  C2: 'C2.mp3',
  C3: 'C3.mp3',
  C4: 'C4.mp3',
  C5: 'C5.mp3',
  'D#3': 'Ds3.mp3',
  'F#3': 'Fs3.mp3',
  'A#3': 'As3.mp3',
  'C#4': 'Cs4.mp3',
  'F#4': 'Fs4.mp3',
};

async function getSampler(): Promise<Tone.Sampler> {
  if (sampler) return sampler;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const s = new Tone.Sampler({
      urls: SAMPLER_URLS,
      baseUrl: 'https://tonejs.github.io/audio/salamander/',
      release: 1,
    }).toDestination();
    await Tone.loaded();
    return s;
  })();
  return initPromise;
}

export interface PlaybackOptions {
  bpm?: number;
  onFinish?: () => void;
}

export interface PlaybackHandle {
  stop: () => void;
  totalDurationMs: number;
}

export async function preloadSamples(): Promise<void> {
  await getSampler();
}

export async function playEvents(
  events: MidiEvent[],
  opts: PlaybackOptions = {},
): Promise<PlaybackHandle> {
  await Tone.start();
  const s = await getSampler();

  const bpm = opts.bpm ?? DEFAULT_BPM;
  const secPerBeat = 60 / bpm;

  const maxEndBeat = events.reduce((m, e) => Math.max(m, e.startBeat + e.durationBeats), 0);
  const totalSecs = Math.max(0.5, maxEndBeat * secPerBeat + 0.5);

  const startAt = Tone.now() + 0.05;
  for (const e of events) {
    const time = startAt + e.startBeat * secPerBeat;
    const dur = Math.max(0.05, e.durationBeats * secPerBeat);
    s.triggerAttackRelease(Tone.Frequency(e.midi, 'midi').toFrequency(), dur, time);
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
      s.releaseAll();
    },
    totalDurationMs: totalSecs * 1000,
  };
}

export async function stopAll(): Promise<void> {
  if (sampler) {
    sampler.releaseAll();
  }
}
