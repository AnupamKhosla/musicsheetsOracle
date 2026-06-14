'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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

type Source = 'western' | 'indian';

export default function PostPage() {
  const params = useParams();
  const [post, setPost] = useState<any>({});
  const [notation, setNotation] = useState('western');
  const [passInput, setPassInput] = useState('');
  const [error, setError] = useState('');
  const [currentBeat, setCurrentBeat] = useState(-1);

  useEffect(() => {
    fetch(`/api/posts/${params.id}`)
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setPost)
      .catch(() => setError('Failed to load sheet'));
  }, [params.id]);

  const deletePost = async () => {
    const resp = await fetch(`/api/posts/${params.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pass: passInput }),
    });
    if (resp.status !== 200) {
      alert('wrong password');
    }
  };

  const sheetUrl = post.sheetName ? `/sheets/${post.sheetName}.xml` : null;
  const sheetBaseName = post.sheetName || '';
  const [lyrics, setLyrics] = useState<string[]>([]);

  useEffect(() => {
    if (!sheetUrl) return;
    let cancelled = false;
    loadMusicXmlFromUrl(sheetUrl)
      .then((xml) => {
        if (cancelled) return;
        const parsed = parseMusicXMLString(xml);
        setLyrics(parsed.lyrics);
      })
      .catch(() => {
        if (!cancelled) setLyrics([]);
      });
    return () => {
      cancelled = true;
    };
  }, [sheetUrl]);

  // When switching tabs, drop the highlight so the previous view's
  // "current" cell doesn't bleed into the new view.
  useEffect(() => {
    setCurrentBeat(-1);
  }, [notation]);

  return (
    <>
      <div className="text-center mt-12">
        <h1 className="my-3 text-[26px] font-semibold">{post.sheetName}</h1>
        <ul className="list-none mt-6">
          <li className="inline-block font-semibold text-slate-400 mx-4">
            <span className="text-slate-900 dark:text-white block">Artists :</span>
            <span className="block"> {post.Artist} </span>
          </li>
          <li className="inline-block font-semibold text-slate-400 mx-4">
            <span className="text-slate-900 dark:text-white block">Genre :</span>
            <span className="block">{post.Genres}</span>
          </li>
          <li className="inline-block font-semibold text-slate-400 mx-4">
            <span className="text-slate-900 dark:text-white block">Scale :</span>
            <span className="block">{post.scale}</span>
          </li>
          <li className="inline-block font-semibold text-slate-400 mx-4">
            <span className="text-slate-900 dark:text-white block">Published :</span>
            <span className="block">{post.date ? new Date(post.date).toLocaleDateString() : ''}</span>
          </li>
        </ul>
      </div>

      <section className="relative">
        <div className="container relative">
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

          {notation === 'western' && (
            <div className="min-h-[40rem]">
              {sheetUrl && <OSMDWrapper file={sheetUrl} />}
              {sheetUrl && (
                <div style={{ marginTop: '1rem' }}>
                  <PlayerForSheet url={sheetUrl} label="Play Western Staff" source="western" />
                </div>
              )}
            </div>
          )}
          {notation === 'indian' && (
            <div className="min-h-[40rem]">
              {sheetUrl && <IndianNotation fileUrl={sheetUrl} currentBeat={currentBeat} />}
              {sheetUrl && (
                <div style={{ marginTop: '1rem' }}>
                  <PlayerForSheet
                    url={sheetUrl}
                    label="Play Bhatkhande"
                    source="indian"
                    onBeatChange={setCurrentBeat}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {lyrics.length > 0 && (
        <section className="container relative my-8">
          <h2
            style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: '#9F1239',
              borderBottom: '1px solid #fecdd3',
              paddingBottom: '0.4rem',
              marginBottom: '0.75rem',
            }}
          >
            Lyrics
          </h2>
          <div
            style={{
              background: '#fff',
              border: '1px solid #fecdd3',
              borderRadius: 8,
              padding: '1rem 1.25rem',
              fontSize: '1rem',
              lineHeight: 1.7,
              color: '#1C1917',
              whiteSpace: 'pre-wrap',
              fontFamily: '"EB Garamond", Georgia, serif',
            }}
          >
            {lyrics.join(' ')}
          </div>
        </section>
      )}

      <form onSubmit={e => { e.preventDefault(); deletePost(); }} className="container flex items-center mb-5">
        <input
          className="text-sm py-1 px-3 me-2 mt-2 focus:border-rose-700 text-base text-gray-700 placeholder-gray-600 border rounded-lg focus:shadow-outline"
          type="password"
          placeholder="Password"
          value={passInput}
          onChange={e => setPassInput(e.target.value)}
        />
        <button
          type="submit"
          className="text-sm py-1 px-3 inline-block tracking-wide border align-middle transition duration-500 ease-in-out text-base text-center bg-rose-600 hover:bg-rose-700 border-rose-600 hover:border-rose-700 text-white rounded-md me-2 mt-2"
        >
          Delete sheet
        </button>
        <a
          href={'/sheets/' + sheetBaseName}
          download
          className="text-sm py-1 px-3 inline-block tracking-wide border align-middle transition duration-500 ease-in-out text-base text-center bg-slate-600 hover:bg-slate-700 border-slate-600 hover:border-slate-700 text-white rounded-md me-2 mt-2"
        >
          Download
        </a>
      </form>
    </>
  );
}

// Loads MusicXML (handles .mxl zip transparently), extracts MIDI events, and
// hands them to PlayerControls. The "source" prop determines which code path
// derives the events:
//   source="western" → extractWesternEvents() (direct from parsed XML, all voices).
//   source="indian"  → convertToBhatkhande() gives midiEvents that exactly match
//                      the swara grid (all voices, merged beats).
function PlayerForSheet({
  url,
  label,
  source,
  onBeatChange,
}: {
  url: string;
  label: string;
  source: Source;
  onBeatChange?: (beat: number) => void;
}) {
  const [events, setEvents] = useState<MidiEvent[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadMusicXmlFromUrl(url)
      .then((xml) => {
        if (cancelled) return;
        const parsed: ParsedScore = parseMusicXMLString(xml);
        if (source === 'indian') {
          const data = convertToBhatkhande({ ...parsed, language: 'hindi' });
          setEvents(data.midiEvents.length > 0 ? data.midiEvents : extractWesternEvents(parsed));
        } else {
          setEvents(extractWesternEvents(parsed));
        }
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
  }, [url, source]);

  if (events === null) {
    return <div style={{ color: '#888', fontSize: '0.85rem' }}>Preparing playback…</div>;
  }
  return <PlayerControls events={events} label={label} onBeatChange={onBeatChange} />;
}
