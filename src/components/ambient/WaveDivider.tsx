// A waveform used as a section divider — a smooth audio-style curve whose
// dashes flow like a signal being played.

export default function WaveDivider() {
  return (
    <svg
      className="wave-divider"
      viewBox="0 0 1200 26"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d="M0,13 C40,13 60,3 100,3 S160,23 200,23 260,6 300,6 360,20 400,20 460,4 500,4 560,22 600,22 660,8 700,8 760,18 800,18 860,5 900,5 960,21 1000,21 1060,9 1100,9 1160,15 1200,15" />
    </svg>
  );
}
