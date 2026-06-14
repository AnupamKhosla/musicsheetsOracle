'use client';

import { useState, useEffect } from 'react';
import { convertToBhatkhande, NotationData } from '@/lib/bhatkhande';
import { parseMusicXMLString, type ParsedScore } from '@/lib/parseMusicXML';
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
  language: languageProp,
}: {
  fileUrl: string;
  language?: Language;
}) {
  const [parsed, setParsed] = useState<ParsedScore | null>(null);
  const [internalLanguage, setInternalLanguage] = useState<Language>('hindi');
  const language = languageProp ?? internalLanguage;
  const controlsHidden = languageProp !== undefined;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fileUrl) return;
    setLoading(true);
    setError(null);

    fetch(fileUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} fetching ${fileUrl}`);
        return r.text();
      })
      .then((xmlText) => {
        setParsed(parseMusicXMLString(xmlText));
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [fileUrl]);

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
              <RowWithHeader key={ri} beatMarks={row.beatMarks} cells={row.cells} />
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

function RowWithHeader({ beatMarks, cells }: { beatMarks: string[]; cells: string[][] }) {
  return (
    <>
      <tr className="bhatkhande-beat-row">
        {beatMarks.map((mark, i) => (
          <td
            key={i}
            className={`bhatkhande-beat-cell ${mark === '\u0938\u092E' ? 'bhatkhande-sam' : ''}`}
          >
            {mark}
          </td>
        ))}
      </tr>
      <tr className="bhatkhande-swar-row">
        {cells.map((cell, i) => (
          <td
            key={i}
            className={`bhatkhande-swar-cell ${cell.join('') === '\u00B7' ? 'bhatkhande-rest' : ''}`}
          >
            {cell}
          </td>
        ))}
      </tr>
    </>
  );
}
