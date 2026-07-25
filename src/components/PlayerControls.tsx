'use client';

import { useState, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import type { MidiEvent } from '@/lib/midi';
import { playEvents, preloadSamples, type PlaybackHandle, type Voice } from '@/lib/audio';

interface PlayerControlsProps {
  events: MidiEvent[];
  defaultBpm?: number;
  label?: string;
  voice?: Voice;
  /** Called on every animation frame with the current beat index (0-based). */
  onBeatChange?: (beat: number) => void;
  /** Called whenever playback starts/stops so the UI can react (e.g. an EQ). */
  onPlayingChange?: (playing: boolean) => void;
}

const VOICE_LABELS: Record<Voice, string> = {
  sine: 'Sine (pure)',
  triangle: 'Triangle (organ-like)',
  square: 'Square (8-bit)',
  sawtooth: 'Sawtooth (buzzy)',
  piano: 'Piano (real samples)',
  harmonium: 'Harmonium (reed organ)',
};

export default function PlayerControls({
  events,
  defaultBpm = 90,
  label = 'Play',
  voice = 'triangle',
  onBeatChange,
  onPlayingChange,
}: PlayerControlsProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'playing' | 'paused' | 'done'>('idle');
  const [bpm, setBpm] = useState<number>(defaultBpm);
  const [selectedVoice, setSelectedVoice] = useState<Voice>(voice);
  const handleRef = useRef<PlaybackHandle | null>(null);
  const animRef = useRef<number | null>(null);
  const bpmRef = useRef<number>(defaultBpm);
  const offsetRef = useRef<number>(0); // beat offset the current Transport run represents
  const pausePositionRef = useRef<number>(0); // beat position when paused

  useEffect(() => {
    onPlayingChange?.(state === 'playing');
  }, [state, onPlayingChange]);

  useEffect(() => {
    return () => {
      handleRef.current?.stop();
      handleRef.current = null;
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
    };
  }, []);

  // The highlight must share the audio's clock. Audio is scheduled on
  // Tone.Transport; reading performance.now() here drifts against it, so we
  // derive the beat from Tone.Transport.seconds instead — same clock, no drift.
  const startBeatTracking = (offsetBeats: number = 0) => {
    if (!onBeatChange) return;
    offsetRef.current = offsetBeats;
    bpmRef.current = bpm;
    let lastBeat = Math.floor(offsetBeats) - 1;
    const tick = () => {
      const beat = offsetRef.current + Tone.Transport.seconds * (bpmRef.current / 60);
      if (Math.floor(beat) !== lastBeat) {
        lastBeat = Math.floor(beat);
        onBeatChange(beat);
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
  };

  const stopBeatTracking = (resetCursor: boolean = true) => {
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    if (resetCursor) {
      onBeatChange?.(0);
    }
  };

  const play = async () => {
    if (events.length === 0) return;
    if (state === 'paused') {
      // Resume from pause - pass offset to audio
      setState('playing');
      const resumeOffset = pausePositionRef.current;

      // Restart audio from pause position
      handleRef.current = await playEvents(events, {
        bpm,
        voice: selectedVoice,
        offsetBeats: resumeOffset,
        onFinish: () => {
          handleRef.current = null;
          pausePositionRef.current = 0;
          setState('done');
          stopBeatTracking(true);
        },
      });

      // Restart beat tracking from the paused position
      startBeatTracking(resumeOffset);
      return;
    }
    
    // Fresh start
    setState('loading');
    try {
      await preloadSamples(selectedVoice);
      handleRef.current?.stop();
      handleRef.current = await playEvents(events, {
        bpm,
        voice: selectedVoice,
        onFinish: () => {
          handleRef.current = null;
          pausePositionRef.current = 0;
          setState('done');
          stopBeatTracking(true);
        },
      });
      setState('playing');
      startBeatTracking();
    } catch (e) {
      console.error('Playback failed', e);
      setState('idle');
      stopBeatTracking(true);
    }
  };

  const pause = () => {
    if (state !== 'playing') return;
    pausePositionRef.current = offsetRef.current + Tone.Transport.seconds * (bpm / 60);
    handleRef.current?.pause();
    setState('paused');
    stopBeatTracking(false);
  };

  const stop = () => {
    handleRef.current?.stop();
    handleRef.current = null;
    pausePositionRef.current = 0;
    setState('idle');
    stopBeatTracking(true);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.5rem 0.75rem',
        background: '#fef2f2',
        border: '1px solid #fecdd3',
        borderRadius: 6,
        fontSize: '0.875rem',
        flexWrap: 'wrap',
      }}
    >
      {state === 'idle' && (
        <button onClick={play} style={btnPrimary}>▶ {label}</button>
      )}
      {state === 'loading' && (
        <span style={{ color: '#9F1239' }}>Starting…</span>
      )}
      {state === 'playing' && (
        <button onClick={pause} style={btnPrimary}>⏸ Pause</button>
      )}
      {state === 'paused' && (
        <button onClick={play} style={btnPrimary}>▶ Resume</button>
      )}
      {state === 'done' && (
        <button onClick={play} style={btnPrimary}>↻ Replay</button>
      )}
      {(state === 'playing' || state === 'paused') && (
        <button onClick={stop} style={btnDanger}>⏹ Stop</button>
      )}
      <label style={{ display: 'flex', alignItems: 'center', color: '#9F1239' }}>
        Voice:&nbsp;
        <select
          value={selectedVoice}
          onChange={(e) => setSelectedVoice(e.target.value as Voice)}
          style={selectStyle}
        >
          {Object.entries(VOICE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </label>
      <label style={{ display: 'flex', alignItems: 'center', color: '#9F1239' }}>
        Tempo:&nbsp;
        <input
          type="number"
          min={30}
          max={240}
          value={bpm}
          onChange={(e) => setBpm(parseInt(e.target.value, 10) || 90)}
          style={inputStyle}
        />
        &nbsp;BPM
      </label>
      <span style={{ color: '#9F1239', fontSize: '0.875rem', marginLeft: 'auto' }}>
        ({events.length} notes)
      </span>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  padding: '0.4rem 0.9rem',
  background: '#E11D48',
  color: 'white',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontWeight: 500,
};

const btnDanger: React.CSSProperties = {
  ...btnPrimary,
  background: '#6b7280',
};

const selectStyle: React.CSSProperties = {
  padding: '0.2rem 0.4rem',
  border: '1px solid #fda4af',
  borderRadius: 4,
  background: 'white',
  cursor: 'pointer',
};

const inputStyle: React.CSSProperties = {
  ...selectStyle,
  width: 60,
};
