// Metronome click track. Simple per-beat click using Tone.MembraneSynth.
// Full tala bols (sam/taali/khaali) can be added later.

import * as Tone from 'tone';

export interface MetronomeOptions {
  bpm: number;
  volume?: number; // -30 to 0 dB
}

export interface MetronomeHandle {
  stop: () => void;
}

let clickSynth: Tone.MembraneSynth | null = null;

function getClickSynth() {
  if (!clickSynth) {
    clickSynth = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 2,
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
    }).toDestination();
    clickSynth.volume.value = -15;
  }
  return clickSynth;
}

export function startMetronome(opts: MetronomeOptions): MetronomeHandle {
  const { bpm, volume = -15 } = opts;
  const synth = getClickSynth();
  synth.volume.value = volume;

  const secPerBeat = 60 / bpm;
  let nextBeatTime = Tone.now() + 0.1;
  let stopped = false;

  const scheduleNext = () => {
    if (stopped) return;
    synth.triggerAttackRelease('C2', '16n', nextBeatTime);
    nextBeatTime += secPerBeat;
    Tone.Transport.schedule(scheduleNext, nextBeatTime);
  };

  Tone.Transport.start();
  scheduleNext();

  return {
    stop: () => {
      stopped = true;
      Tone.Transport.stop();
      Tone.Transport.cancel();
    },
  };
}
