'use client';

import { useState, useEffect, useRef } from 'react';
import IndianNotation from '@/components/IndianNotation';
import PlayerControls from '@/components/PlayerControls';
import type { Language } from '@/lib/sargam-data';
import { loadMusicXmlFromUrl, parseMusicXMLString, type ParsedScore } from '@/lib/parseMusicXML';
import { extractWesternEvents, type MidiEvent } from '@/lib/midi';

interface SheetEntry {
  name: string;
  url: string;
  title: string;
}

const SHEETS: SheetEntry[] = [
  { name: 'cannon_in_d',   url: '/sheets/cannon_in_d.xml',                        title: 'Pachelbel — Canon in D' },
  { name: 'chopin',        url: '/sheets/chopin_op9.xml',                         title: 'Chopin — Op. 9' },
  { name: 'estrellita',    url: '/sheets/Estrellita_-__Manuel_M._Ponce.xml',      title: 'M. Ponce — Estrellita' },
  { name: 'rach',          url: '/sheets/Rachmaninov.xml',                        title: 'Rachmaninov' },
  { name: 'anthem',        url: '/sheets/NATIONAL_ANTHEM_OF_INDIA.xml',           title: 'National Anthem of India' },
  { name: 'jabase',        url: '/sheets/Jabase tumsana laagali.xml',             title: 'Jabase Tumsana Laagali' },
  { name: 'sajan',         url: '/sheets/Sajan_more_ghar_aaye.xml',               title: 'Sajan More Ghar Aaye' },
  { name: 'raag_bhup',     url: '/sheets/RaagBhupali_JabseTumSan.mxl',            title: 'Raag Bhupali — Jabse Tum San' },
];

export default function NotationTestPage() {
  const [language, setLanguage] = useState<Language>('hindi');

  return (
    <div className="notation-test" style={{ maxWidth: 1400, margin: '0 auto', padding: '1rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Notation Conversion Test
      </h1>
      <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem' }}>
        Renders Western MusicXML (via OSMD) and the auto-generated Bhatkhande swara grid
        for each sample file. The parent thaat is inferred from the key signature.
        Pick a script (Devanagari / English / Bangla) to change swara labels.
        Use the player to hear the piece — same audio for both views, since pitch
        is pitch.
      </p>

      <div className="notation-test-controls" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.5rem', padding: '0.75rem', background: '#f9fafb', borderRadius: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem' }}>
          Script:&nbsp;
          <select value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
            <option value="hindi">हिन्दी (Hindi)</option>
            <option value="english">English</option>
            <option value="bangla">বাংলা (Bangla)</option>
          </select>
        </label>
      </div>

      {SHEETS.map((sheet) => (
        <section key={sheet.name} className="notation-test-sheet" style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, borderBottom: '2px solid #e11d48', paddingBottom: '0.25rem', marginBottom: '0.75rem' }}>
            {sheet.title}
          </h2>
          <PlayerForSheet url={sheet.url} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#666', marginBottom: '0.5rem' }}>
                Western Staff
              </h3>
              <WesternView fileUrl={sheet.url} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#666', marginBottom: '0.5rem' }}>
                Bhatkhande Swara Grid
              </h3>
              <IndianNotation fileUrl={sheet.url} language={language} />
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

function PlayerForSheet({ url }: { url: string }) {
  const [events, setEvents] = useState<MidiEvent[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadMusicXmlFromUrl(url)
      .then((xml) => {
        if (cancelled) return;
        const parsed: ParsedScore = parseMusicXMLString(xml);
        setEvents(extractWesternEvents(parsed));
      })
      .catch((e) => {
        if (!cancelled) {
          console.error('Failed to prepare events for', url, e);
          setEvents([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (events === null) {
    return <div style={{ color: '#888', fontSize: '0.85rem' }}>Preparing playback…</div>;
  }
  return <PlayerControls events={events} label="Play" />;
}

function WesternView({ fileUrl }: { fileUrl: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<string>('loading');
  const [err, setErr] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    (async () => {
      try {
        const mod = await import('opensheetmusicdisplay');
        if (cancelled || !containerRef.current) return;
        const osmd = new mod.OpenSheetMusicDisplay(containerRef.current, {
          autoResize: true,
          backend: 'svg',
          drawTitle: true,
          drawPartNames: false,
        });
        const xml = await loadMusicXmlFromUrl(fileUrl);
        await osmd.load(xml);
        await osmd.render();
        if (!cancelled) setStatus('ok');
      } catch (e: unknown) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : String(e));
          setStatus('err');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  return (
    <div style={{ border: '1px solid #eee', borderRadius: 4, padding: '0.5rem', minHeight: 200 }}>
      {status === 'loading' && <div style={{ color: '#888', fontSize: '0.85rem' }}>Loading Western view…</div>}
      {status === 'err' && <div style={{ color: '#c00', fontSize: '0.85rem' }}>Western view error: {err}</div>}
      <div ref={containerRef} />
    </div>
  );
}
