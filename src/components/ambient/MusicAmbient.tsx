// Faint line-engravings of Indian instruments pressed into the paper itself —
// a tanpura standing down the right margin and a tabla pair low on the left,
// like the plates of an old treatise. Static, low-opacity, behind everything.

export default function MusicAmbient() {
  return (
    <div className="instruments-bg" aria-hidden="true">
      {/* Tanpura */}
      <svg className="instr-tanpura" viewBox="0 0 200 620" fill="none" stroke="currentColor">
        <g strokeWidth="2.5">
          <ellipse cx="100" cy="470" rx="72" ry="96" />
          <ellipse cx="100" cy="470" rx="58" ry="80" strokeWidth="1.2" opacity="0.6" />
          <path d="M86 388 L88 96 M114 388 L112 96" />
          <path d="M88 96 C88 78 96 70 100 70 C104 70 112 78 112 96" />
          <path d="M100 70 C94 60 96 48 104 46 C112 44 116 52 110 58" strokeWidth="2" />
          <circle cx="78" cy="120" r="6" strokeWidth="2" />
          <circle cx="78" cy="150" r="6" strokeWidth="2" />
          <circle cx="122" cy="135" r="6" strokeWidth="2" />
          <ellipse cx="100" cy="430" rx="26" ry="7" strokeWidth="1.8" />
          <path d="M92 100 L90 428 M100 100 L100 428 M108 100 L110 428" strokeWidth="1.2" opacity="0.7" />
        </g>
      </svg>

      {/* Tabla pair */}
      <svg className="instr-tabla" viewBox="0 0 320 220" fill="none" stroke="currentColor">
        <g strokeWidth="2.5">
          <ellipse cx="105" cy="112" rx="74" ry="74" />
          <ellipse cx="105" cy="112" rx="52" ry="52" strokeWidth="1.4" opacity="0.7" />
          <circle cx="105" cy="112" r="21" strokeWidth="2" />
          <circle cx="105" cy="112" r="8" strokeWidth="1.4" opacity="0.7" />
          <ellipse cx="243" cy="120" rx="62" ry="62" />
          <ellipse cx="243" cy="120" rx="43" ry="43" strokeWidth="1.4" opacity="0.7" />
          <circle cx="243" cy="120" r="17" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}
