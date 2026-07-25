// A tiny equalizer — five bars. Static (varied heights, no motion) by default
// so it's accessible; pass `active` while music actually plays to bounce them.

export default function EqBars({ className = '', active = false }: { className?: string; active?: boolean }) {
  return (
    <span className={`eq ${active ? 'eq-active' : ''} ${className}`} aria-hidden="true">
      <span className="eq-bar" />
      <span className="eq-bar" />
      <span className="eq-bar" />
      <span className="eq-bar" />
      <span className="eq-bar" />
    </span>
  );
}
