// Fixed, site-wide musical atmosphere: a faint staff wash, warm tonal glows,
// and a handful of note + sargam glyphs bobbing like they've drifted off the
// page. Pure decoration — pointer-events are off and it sits behind content.

const GLYPHS: { ch: string; top: string; left: string; size: number; dur: number; delay: number; o: number; rose?: boolean }[] = [
  { ch: '♪', top: '16%', left: '6%',  size: 26, dur: 9,  delay: 0,    o: 0.09, rose: true },
  { ch: 'स',  top: '30%', left: '88%', size: 24, dur: 11, delay: -3,   o: 0.08 },
  { ch: '♫', top: '58%', left: '10%', size: 30, dur: 10, delay: -5,   o: 0.07 },
  { ch: 'रे', top: '70%', left: '90%', size: 22, dur: 12, delay: -2,   o: 0.07, rose: true },
  { ch: '♩', top: '84%', left: '22%', size: 20, dur: 9,  delay: -6,   o: 0.06 },
  { ch: '♬', top: '12%', left: '70%', size: 22, dur: 10, delay: -4,   o: 0.06 },
  { ch: 'ग',  top: '46%', left: '46%', size: 26, dur: 13, delay: -7,   o: 0.05 },
  { ch: '♪', top: '92%', left: '68%', size: 18, dur: 11, delay: -1.5, o: 0.06, rose: true },
];

export default function MusicAmbient() {
  return (
    <div className="ambient" aria-hidden="true">
      <div className="ambient-staff" />
      <div className="ambient-glow-a" />
      <div className="ambient-glow-b" />
      {GLYPHS.map((g, i) => (
        <span
          key={i}
          className="float-note"
          style={{
            top: g.top,
            left: g.left,
            fontSize: g.size,
            color: g.rose ? '#be123c' : '#64748b',
            animationDuration: `${g.dur}s`,
            animationDelay: `${g.delay}s`,
            ['--o' as string]: g.o,
          }}
        >
          {g.ch}
        </span>
      ))}
    </div>
  );
}
