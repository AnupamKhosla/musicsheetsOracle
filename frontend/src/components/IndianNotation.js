import { useState, useEffect } from 'react';

/*
 * Bhatkhande Notation — Devanagari script + beat grid layout
 *
 * Renders Indian classical music notation from MusicXML:
 *   - Devanagari swaras (सा, रे, ग, म, प, ध, नि) with proper modifiers
 *   - Beat-based grid: one column per beat, multiple notes per cell
 *   - Komal (flat): underline combining mark
 *   - Tivra Ma: vertical line combining mark above
 *   - Taar saptak (upper octave): anusvara/dot above using candrabindu
 *   - Mandra saptak (lower octave): dot below combining mark
 *   - Sam (first beat) marked as 'सम'
 */

// Western step → semitone (relative to C)
const STEP_TO_SEMITONE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// Circle of fifths: which notes are sharped/flatted by the key signature
const SHARPS = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
const FLATS  = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];

// Devanagari swara names (Bhatkhande system)
// Format: [shuddh, komal, teevra]
const SWARA_NAMES = {
  0:  { shuddh: '\u0938\u093E' },                                      // सा  — Sa
  1:  { shuddh: '\u0930\u0947',    komal: '\u0930\u0947\u0332' },      // रे   / रे̲  — Re
  2:  { shuddh: '\u0930\u0947' },                                      // रे   — Shuddh Re
  3:  { shuddh: '\u0917',          komal: '\u0917\u0332' },            // ग    / ग̲   — Ga
  4:  { shuddh: '\u0917' },                                            // ग    — Shuddh Ga
  5:  { shuddh: '\u092E' },                                            // म    — Ma
  6:  { shuddh: '\u092E\u0951' },                                      // म॑   — Tivra Ma
  7:  { shuddh: '\u092A' },                                            // प    — Pa
  8:  { shuddh: '\u0927',          komal: '\u0927\u0332' },            // ध    / ध̲   — Dha
  9:  { shuddh: '\u0927' },                                            // ध    — Shuddh Dha
  10: { shuddh: '\u0928\u093F',    komal: '\u0928\u093F\u0332' },      // नि   / नि̲  — Ni
  11: { shuddh: '\u0928\u093F' },                                      // नि   — Shuddh Ni
};

// Hindi numerals 1-16 for beat markers
const HINDI_NUMS = ['\u0967','\u0968','\u0969','\u096A','\u096B','\u096C','\u096D','\u096E','\u096F','\u0967\u0966','\u0967\u0967','\u0967\u0968','\u0967\u0969','\u0967\u096A','\u0967\u096B','\u0967\u096C'];
// १ २ ३ ४ ५ ६ ७ ८ ९ १० ११ १२ १३ १४ १५ १६

const MADHYAM_OCTAVE = 4;

export default function IndianNotation({ fileUrl }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!fileUrl) return;
    setLoading(true);
    setError(null);

    fetch(fileUrl)
      .then(r => r.text())
      .then(xmlText => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, 'application/xml');
        const errNode = doc.querySelector('parsererror');
        if (errNode) throw new Error('Invalid MusicXML: ' + errNode.textContent);

        const result = parseMusicXML(doc);
        setData(result);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [fileUrl]);

  if (loading) return <div className="p-8 text-center text-gray-500">Notation loading…</div>;
  if (error) return <div className="p-8 text-center text-red-600">Notation error: {error}</div>;
  if (!data || data.rows.length === 0) return null;

  return (
    <div>
      <div className="bhatkhande-notice">⚠ Experimental — may contain some translation errors.</div>
      <div className="bhatkhande-notation">
      <div className="bhatkhande-header">
        {data.title && <span className="bhatkhande-title">{data.title}</span>}
        <span className="bhatkhande-info">
          {data.raga && <>Raga: {data.raga} &nbsp;</>}
          Tal: {data.beatType}/{data.beats} &nbsp;·&nbsp; Sa = {data.saName}
        </span>
      </div>

      <div className="bhatkhande-scroll">
        <table className="bhatkhande-grid">
          <thead>
            <tr className="bhatkhande-beat-row">
              {data.beatMarks.map((mark, i) => (
                <td key={i} className={`bhatkhande-beat-cell ${mark === '\u0938\u092E' ? 'bhatkhande-sam' : ''}`}>
                  {mark}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, ri) => (
              <tr key={ri} className="bhatkhande-swar-row">
                {row.cells.map((cell, ci) => (
                  <td key={ci} className={`bhatkhande-swar-cell ${cell === '\u00B7' ? 'bhatkhande-rest' : ''}`}>
                    {Array.isArray(cell) ? cell.join(' ') : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}

function parseMusicXML(doc) {
  // --- Key signature → Sa semitone ---
  const keyEl = doc.querySelector('key');
  const fifths = keyEl ? parseInt(keyEl.querySelector('fifths')?.textContent || '0') : 0;
  const modeEl = keyEl?.querySelector('mode');
  const mode = modeEl ? modeEl.textContent : 'major';

  let saSemitone = ((fifths * 7) + 120) % 12;
  if (mode === 'minor' || mode === 'none') saSemitone = (saSemitone + 9) % 12;

  // Build key-signature alter map
  const keyAlter = {};
  if (fifths > 0)  for (let i = 0; i < fifths; i++) keyAlter[SHARPS[i]] = 1;
  if (fifths < 0)  for (let i = 0; i < Math.abs(fifths); i++) keyAlter[FLATS[i]] = -1;

  // Sa name for display
  const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const saName = NOTE_NAMES[saSemitone];

  // --- Title ---
  const titleEl = doc.querySelector('movement-title');
  const title = titleEl?.textContent || '';

  // --- Time signature ---
  const timeEl = doc.querySelector('time');
  const beats = timeEl ? parseInt(timeEl.querySelector('beats')?.textContent || '4') : 4;
  const beatType = timeEl ? parseInt(timeEl.querySelector('beat-type')?.textContent || '4') : 4;

  // --- Divisions ---
  const firstAttr = doc.querySelector('attributes');
  const divEl = firstAttr?.querySelector('divisions');
  const divisions = divEl ? parseInt(divEl.textContent) : 1;
  const divsPerBeat = divisions * (4 / beatType);

  // --- Parse notes into beats ---
  // An array of arrays (beats), each containing swara strings for that beat
  const allBeats = [];
  let globalBeatIdx = 0;

  const parts = doc.querySelectorAll('part');
  parts.forEach(part => {
    const partMeasures = part.querySelectorAll('measure');
    partMeasures.forEach(measure => {
      const notes = measure.querySelectorAll('note');
      let cumDiv = 0;

      notes.forEach(note => {
        const rest = note.querySelector('rest');
        const duration = parseInt(note.querySelector('duration')?.textContent || '0');
        if (duration <= 0) return;

        const startBeat = Math.floor(cumDiv / divsPerBeat);
        const endExclusiveDiv = cumDiv + duration;
        const endBeat = Math.ceil(endExclusiveDiv / divsPerBeat) - 1;

        // Ensure beat arrays exist up to endBeat
        while (allBeats.length <= globalBeatIdx + endBeat) allBeats.push([]);

        if (rest) {
          // Rests are already handled (empty arrays stay as default)
        } else {
          const pitch = note.querySelector('pitch');
          if (!pitch) { cumDiv += duration; return; }

          const step = pitch.querySelector('step')?.textContent;
          const alterEl = pitch.querySelector('alter');
          const explicitAlter = alterEl ? parseInt(alterEl.textContent) : 0;
          const octave = parseInt(pitch.querySelector('octave')?.textContent || '4');

          if (!step) { cumDiv += duration; return; }

          // Compute semitone
          const totalAlter = explicitAlter + (keyAlter[step] || 0);
          const noteSemitone = STEP_TO_SEMITONE[step] + totalAlter;
          const semitoneFromSa = ((noteSemitone - saSemitone) + 120) % 12;

          // Select swara variant
          const swara = SWARA_NAMES[semitoneFromSa];
          if (!swara) { cumDiv += duration; return; }
          let swaraText = swara.komal && explicitAlter < 0 ? swara.komal : swara.shuddh;

          // Octave markers
          const octDiff = octave - MADHYAM_OCTAVE;
          if (octDiff >= 1) {
            // Upper octave: anusvara above
            swaraText += '\u0902'; // ं
          } else if (octDiff <= -1) {
            // Lower octave: dot below
            swaraText += '\u0323'; // ̣
          }

          // Place note in the start beat
          allBeats[globalBeatIdx + startBeat].push(swaraText);

          // If the note spans multiple beats, add dashes in continuation beats
          for (let b = startBeat + 1; b <= endBeat; b++) {
            allBeats[globalBeatIdx + b].push('\u2014'); // em-dash —
            // Actually for Bhatkhande notation, use a holding mark:
            // allBeats[globalBeatIdx + b].push('—');
          }
        }

        cumDiv += duration;
      });

      // Advance global beat counter by the number of beats this measure occupied
      const beatsConsumed = Math.ceil(cumDiv / divsPerBeat);
      globalBeatIdx += Math.max(beatsConsumed, 1);
    });
  });

  // Mark rest beats (empty arrays) with a dot
  for (let i = 0; i < allBeats.length; i++) {
    if (!allBeats[i] || allBeats[i].length === 0) {
      allBeats[i] = ['\u00B7']; // middle dot ·
    }
  }

  // --- Build display rows: group beats into visual rows ---
  const ROW_BEATS = 8;
  const displayRows = [];
  for (let i = 0; i < allBeats.length; i += ROW_BEATS) {
    const cells = allBeats.slice(i, i + ROW_BEATS);
    displayRows.push({ cells });
  }

  if (displayRows.length === 0) return { rows: [], beatMarks: [] };

  const totalBeats = displayRows[0].cells.length;
  const beatMarks = [];
  for (let i = 0; i < totalBeats; i++) {
    // Only the very first beat of the entire composition is सम
    beatMarks.push(i === 0 ? '\u0938\u092E' : HINDI_NUMS[i]);
  }

  return {
    title,
    saName,
    saSemitone,
    beats,
    beatType,
    rows: displayRows,
    beatMarks,
    raga: '',
    tal: '',
    talBeats: beats,
  };
}
