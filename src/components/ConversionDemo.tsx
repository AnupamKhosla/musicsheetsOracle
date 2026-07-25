'use client';

// A tiny self-contained demo that shows the site's core promise: one line of
// Western staff on top, the machine-translated Bhatkhande sargam directly
// below it, with beat-synced playback of a simple raga phrase ending in a
// chord. No network fetch — the XML is embedded so it renders instantly.

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import IndianNotation from '@/components/IndianNotation';
import PlayerControls from '@/components/PlayerControls';
import EqBars from '@/components/ambient/EqBars';
import { parseMusicXMLString } from '@/lib/parseMusicXML';
import { extractWesternEvents, type MidiEvent } from '@/lib/midi';

const OSMDWrapper = dynamic(() => import('@/components/OSMDWrapper'), { ssr: false });

// Raag Bhupali (Sa = C), full aroh–avroh across 16 beats (one teentaal cycle):
//   aroh  : S R G P | D  S'          (measures 1–2)
//   avroh : S' D P G | R S + S-chord  (measures 3–4, closing tanpura-style triad)
const DEMO_XML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <work><work-title>Raag Bhupali — aroh avroh</work-title></work>
  <part-list><score-part id="P1"><part-name>Demo</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths><mode>major</mode></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>
      <note><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>
    </measure>
    <measure number="2">
      <note><pitch><step>A</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>half</type></note>
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>2</duration><voice>1</voice><type>half</type></note>
    </measure>
    <measure number="3">
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>
      <note><pitch><step>A</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>
      <note><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>
    </measure>
    <measure number="4">
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>half</type></note>
      <note><chord/><pitch><step>E</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>half</type></note>
      <note><chord/><pitch><step>G</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>half</type></note>
    </measure>
  </part>
</score-partwise>`;

export default function ConversionDemo() {
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [playing, setPlaying] = useState(false);

  // Parse on the client only — parseMusicXMLString needs the browser DOMParser,
  // which doesn't exist during SSR. Starting from [] and filling in via an
  // effect keeps the server and first client render identical (no hydration
  // mismatch on the "N notes" count), then updates after mount.
  const [events, setEvents] = useState<MidiEvent[]>([]);
  useEffect(() => {
    try {
      setEvents(extractWesternEvents(parseMusicXMLString(DEMO_XML)));
    } catch {
      setEvents([]);
    }
  }, []);

  useEffect(() => {
    return () => setCurrentBeat(-1);
  }, []);

  return (
    <div className="rounded-2xl bg-white border border-rose-100 shadow-lg shadow-rose-100/40 overflow-hidden">
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-rose-50 bg-rose-50/50">
        <span className="inline-flex items-center gap-2.5 text-sm font-semibold text-rose-700">
          <EqBars className="text-rose-600" active={playing} />
          Live conversion · press play
        </span>
        <span className="text-sm text-gray-600 hidden sm:inline">Raag Bhupali · aroh–avroh · 16 beats</span>
      </div>

      {/* The two notations, beat-aligned. On mobile the Bhatkhande grid comes
          first (it's the hero); on desktop the Western line sits on top so the
          conversion reads top-to-bottom. The connector always sits between. */}
      <div className="flex flex-col">
        <div className="order-1 lg:order-3 px-2 sm:px-5 pb-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-1 text-center">
            Indian Bhatkhande (sargam)
          </p>
          <IndianNotation xmlContent={DEMO_XML} currentBeat={currentBeat} language="english" />
        </div>

        {/* animated connector — middle in both layouts */}
        <div className="order-2 flex items-center justify-center gap-2 py-1.5" aria-hidden>
          <span className="h-px w-10 bg-rose-200" />
          <span className="text-rose-700 text-sm font-semibold tracking-widest uppercase">
            ⇅ beat-for-beat
          </span>
          <span className="h-px w-10 bg-rose-200" />
        </div>

        <div className="order-3 lg:order-1 px-3 sm:px-5 pt-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-1 text-center">
            Western staff
          </p>
          <div className="demo-western">
            <OSMDWrapper xmlContent={DEMO_XML} currentBeat={currentBeat} autoResize />
          </div>
        </div>
      </div>

      <div className="px-3 sm:px-5 pb-4">
        <PlayerControls events={events} label="Play the phrase" onBeatChange={setCurrentBeat} onPlayingChange={setPlaying} />
      </div>
    </div>
  );
}
