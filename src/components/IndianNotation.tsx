'use client';

import { useState, useEffect } from 'react';
import { convertToBhatkhande, NotationData } from '@/lib/bhatkhande';
import { loadMusicXmlFromUrl, parseMusicXMLString, type ParsedScore } from '@/lib/parseMusicXML';
import type { Language } from '@/lib/sargam-data';
import { RAGA_LABELS } from '@/lib/sargam-data';

// Heuristic: suggest a parent thaat (10-thaat system) from a Western key sig.
//   major  → bilawal  (Ionian = all shuddh, all standard major keys)
//   minor  → kafi when |fifths| is 1 or 2 (komal ga + komal dha)
//          → asavari otherwise (3 komal swaras: ga, dha, ni)
function suggestThaat(fifths: number, mode: string): string | null {
  if (mode === 'major') return 'bilawal';
  if (mode === 'minor') {
    const abs = Math.abs(fifths);
    if (abs === 1 || abs === 2) return 'kafi';
    return 'asavari';
  }
  return null;
}

export default function IndianNotation({
  fileUrl,
  xmlContent,
  language: languageProp,
  currentBeat = -1,
}: {
  fileUrl?: string;
  xmlContent?: string;
  language?: Language;
  /** Current beat index (0-based, fractional). -1 = not playing. */
  currentBeat?: number;
}) {
  const [parsed, setParsed] = useState<ParsedScore | null>(null);
  // Default to English sargam: cleaner than Devanagari (which stacks combining
  // marks for komal/tivra + saptak dot below in visually-confusing orders).
  const [internalLanguage, setInternalLanguage] = useState<Language>('english');
  const language = languageProp ?? internalLanguage;
  const controlsHidden = languageProp !== undefined;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fileUrl && !xmlContent) return;
    setLoading(true);
    setError(null);

    const load = xmlContent
      ? Promise.resolve(xmlContent)
      : loadMusicXmlFromUrl(fileUrl!);

    load
      .then((xmlText) => {
        setParsed(parseMusicXMLString(xmlText));
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [fileUrl, xmlContent]);

  if (loading) return <div className="p-8 text-center text-gray-500">Notation loading…</div>;
  if (error) return <div className="p-8 text-center text-red-600">Notation error: {error}</div>;
  if (!parsed) return null;

  const data: NotationData = convertToBhatkhande({ ...parsed, language });
  const thaatSuggestion = suggestThaat(parsed.key.fifths, parsed.key.mode);
  const thaatLabel = thaatSuggestion
    ? (RAGA_LABELS[language][thaatSuggestion] || thaatSuggestion)
    : null;

  return (
    <div className="bhatkhande-notation">
      <div className="bhatkhande-notice">⚠ Experimental — may contain translation errors</div>

      {!controlsHidden && (
        <div className="bhatkhande-controls">
          <label>
            Script:&nbsp;
            <select value={language} onChange={(e) => setInternalLanguage(e.target.value as Language)}>
              <option value="hindi">हिन्दी (Hindi)</option>
              <option value="english">English</option>
              <option value="bangla">বাংলা (Bangla)</option>
            </select>
          </label>
        </div>
      )}

      <div className="bhatkhande-header">
        {data.title && <span className="bhatkhande-title">{data.title}</span>}
        <span className="bhatkhande-info">
          Tal: {data.taalNameLabel} ({data.beats}/{data.beatType})
          {thaatLabel && <> · Thaat: {thaatLabel}</>}
          &nbsp;·&nbsp; Sa = {data.saName} (oct {data.saOctave})
        </span>
      </div>

      <div className="bhatkhande-scroll">
        <table className="bhatkhande-grid">
          <tbody>
            {data.rows.map((row, ri) => (
              <RowWithHeader
                key={ri}
                beatMarks={row.beatMarks}
                cells={row.cells}
                meendLinks={row.meendLinks}
                holdLinks={row.holdLinks}
                chordLinks={row.chordLinks}
                crossBeatHolds={row.crossBeatHolds}
                rowStartBeat={ri * 8}
                currentBeat={currentBeat}
              />
            ))}
          </tbody>
        </table>
      </div>

      {data.rows.length === 0 && (
        <div className="p-4 text-center text-gray-500">No notes to display.</div>
      )}
    </div>
  );
}

function RowWithHeader({
  beatMarks,
  cells,
  meendLinks,
  holdLinks,
  chordLinks,
  crossBeatHolds,
  rowStartBeat,
  currentBeat,
}: {
  beatMarks: string[];
  cells: string[][][];
  meendLinks: boolean[][][];
  holdLinks: boolean[][][];
  chordLinks: boolean[][][];
  crossBeatHolds: boolean[];
  rowStartBeat: number;
  currentBeat: number;
}) {
  const isCurrent = (globalBeat: number) =>
    currentBeat >= 0 && currentBeat >= globalBeat && currentBeat < globalBeat + 1;

  return (
    <>
      <tr className="bhatkhande-beat-row">
        {beatMarks.map((mark, i) => {
          const globalBeat = rowStartBeat + i;
          return (
            <td
              key={i}
              className={`bhatkhande-beat-cell ${mark === '\u0938\u092E' ? 'bhatkhande-sam' : ''} ${isCurrent(globalBeat) ? 'bhatkhande-current' : ''}`}
            >
              {mark}
            </td>
          );
        })}
      </tr>
      <tr className="bhatkhande-swar-row">
        {cells.map((cell, i) => {
          const globalBeat = rowStartBeat + i;
          const isRest = cell.length === 1 && cell[0].length === 1 && cell[0][0] === '\u00B7';
          const meend = meendLinks[i] || [];
          const hold = holdLinks[i] || [];
          const chord = chordLinks[i] || [];
          const cbHold = crossBeatHolds[i] || false;
          const cbHoldStart = cbHold && (i === 0 || !crossBeatHolds[i - 1]);
          const cbHoldEnd = cbHold && (i === crossBeatHolds.length - 1 || !crossBeatHolds[i + 1]);
          return (
            <td
              key={i}
              className={`bhatkhande-swar-cell ${isRest ? 'bhatkhande-rest' : ''} ${isCurrent(globalBeat) ? 'bhatkhande-current' : ''} ${cbHold ? 'bhatkhande-cross-hold' : ''} ${cbHoldStart ? 'bhatkhande-cross-hold-start' : ''} ${cbHoldEnd ? 'bhatkhande-cross-hold-end' : ''}`}
            >
              {cell.map((subRow, si) => {
                const subMeend = meend[si] || [];
                const subHold = hold[si] || [];
                const subChord = chord[si] || [];
                return (
                  <div key={si} className="bhatkhande-subrow">
                    {subRow.map((s, pos) => (
                      <span
                        key={pos}
                        className={`bhatkhande-swara ${subChord[pos] ? 'bhatkhande-chord' : ''} ${subMeend[pos] ? 'bhatkhande-meend-end' : ''} ${pos > 0 && subMeend[pos - 1] ? 'bhatkhande-meend-start' : ''} ${subHold[pos] ? 'bhatkhande-hold-end' : ''} ${pos > 0 && subHold[pos - 1] ? 'bhatkhande-hold-start' : ''}`}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                );
              })}
            </td>
          );
        })}
      </tr>
    </>
  );
}
