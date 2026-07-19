'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import IndianNotation from '@/components/IndianNotation';
import PlayerControls from '@/components/PlayerControls';
import { parseMusicXMLString } from '@/lib/parseMusicXML';
import { extractWesternEvents, type MidiEvent } from '@/lib/midi';

const OSMDWrapper = dynamic(() => import('@/components/OSMDWrapper'), { ssr: false });

export default function SideBySideViewer({
  sheetId,
  xmlContent,
  sheetName,
}: {
  sheetId?: string;
  xmlContent?: string;
  sheetName?: string;
}) {
  const [xml, setXml] = useState(xmlContent || '');
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [events, setEvents] = useState<MidiEvent[] | null>(null);

  useEffect(() => {
    if (xmlContent) {
      setXml(xmlContent);
      return;
    }
    if (!sheetId) return;
    let cancelled = false;
    fetch(`/api/posts/${sheetId}`)
      .then(r => r.json())
      .then(d => {
        if (!cancelled && d.xmlContent) setXml(d.xmlContent);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [sheetId, xmlContent]);

  useEffect(() => {
    if (!xml) return;
    try {
      const p = parseMusicXMLString(xml);
      setEvents(extractWesternEvents(p));
    } catch {
      setEvents([]);
    }
  }, [xml]);

  if (!xml) return null;

  return (
    <div>
      {sheetName && <h3 className="text-xl font-bold text-center mb-4">{sheetName}</h3>}

      {events !== null && (
        <div style={{ marginBottom: '1rem' }}>
          <PlayerControls events={events} label="Play" onBeatChange={setCurrentBeat} />
        </div>
      )}

      <div className="grid lg:grid-cols-2 grid-cols-1 gap-6">
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 text-center">
            Western Staff
          </h4>
          <OSMDWrapper xmlContent={xml} currentBeat={currentBeat} />
        </div>
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 text-center">
            Indian Bhatkhande
          </h4>
          <IndianNotation xmlContent={xml} currentBeat={currentBeat} />
        </div>
      </div>
    </div>
  );
}
