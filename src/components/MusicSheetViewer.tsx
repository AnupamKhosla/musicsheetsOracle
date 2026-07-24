'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import IndianNotation from '@/components/IndianNotation';
import PlayerControls from '@/components/PlayerControls';
import { loadMusicXmlFromUrl, parseMusicXMLString, type ParsedScore } from '@/lib/parseMusicXML';
import { convertToBhatkhande } from '@/lib/bhatkhande';
import { extractWesternEvents, type MidiEvent } from '@/lib/midi';

const OSMDWrapper = dynamic(() => import('@/components/OSMDWrapper'), { ssr: false });

const TABS = [
  { key: 'western', label: 'Western Staff' },
  { key: 'indian', label: 'Indian Bhatkhande' },
];

export default function MusicSheetViewer({
  fileUrl,
  xmlContent,
  sheetName,
}: {
  fileUrl?: string;
  xmlContent?: string;
  sheetName?: string;
}) {
  const [notation, setNotation] = useState('western');
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [events, setEvents] = useState<MidiEvent[] | null>(null);
  const [parsed, setParsed] = useState<ParsedScore | null>(null);

  useEffect(() => {
    if (!fileUrl && !xmlContent) return;
    let cancelled = false;

    const load = xmlContent
      ? Promise.resolve(xmlContent)
      : loadMusicXmlFromUrl(fileUrl!);

    load
      .then((xml) => {
        if (cancelled) return;
        const p = parseMusicXMLString(xml);
        setParsed(p);
        setEvents(extractWesternEvents(p));
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      });
    return () => { cancelled = true; };
  }, [fileUrl, xmlContent]);

  return (
    <div>
      {sheetName && <h2 className="text-2xl font-bold text-center mb-4">{sheetName}</h2>}

      <div className="notation-tabs mt-6">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`notation-tab ${notation === tab.key ? 'active' : ''}`}
            onClick={() => setNotation(tab.key)}
          >
            {tab.key === 'western' ? (
              <span>
                <svg className="tab-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <line x1="2" y1="4" x2="14" y2="4" stroke="currentColor" strokeWidth="0.5"/>
                  <line x1="2" y1="6" x2="14" y2="6" stroke="currentColor" strokeWidth="0.5"/>
                  <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="0.5"/>
                  <line x1="2" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="0.5"/>
                  <line x1="2" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="0.5"/>
                  <ellipse cx="5" cy="6" rx="1.2" ry="0.9" fill="currentColor" transform="rotate(-15 5 6)"/>
                </svg>
                <span className="tab-label">{tab.label}</span>
              </span>
            ) : (
              <span>
                <svg className="tab-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <text x="1" y="13" fontSize="14" fill="currentColor" fontFamily="Noto Sans Devanagari, sans-serif">स</text>
                </svg>
                <span className="tab-label">{tab.label}</span>
              </span>
            )}
          </button>
        ))}
      </div>

      {events !== null && (
        <div style={{ marginBottom: '1rem' }}>
          <PlayerControls events={events} label="Play" onBeatChange={setCurrentBeat} />
        </div>
      )}

      <div className="min-h-[40rem]" style={{ display: notation === 'western' ? 'block' : 'none' }}>
        <OSMDWrapper file={fileUrl} xmlContent={xmlContent} currentBeat={currentBeat} />
      </div>
      <div className="min-h-[40rem]" style={{ display: notation === 'indian' ? 'block' : 'none' }}>
        <IndianNotation fileUrl={fileUrl} xmlContent={xmlContent} currentBeat={currentBeat} />
      </div>
    </div>
  );
}
