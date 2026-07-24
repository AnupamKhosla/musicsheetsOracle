// A tiny live equalizer — five bars bouncing out of phase. Drop it next to any
// "live / playing" label to make it feel like sound is actually happening.

export default function EqBars({ className = '' }: { className?: string }) {
  return (
    <span className={`eq ${className}`} aria-hidden="true">
      <span className="eq-bar" />
      <span className="eq-bar" />
      <span className="eq-bar" />
      <span className="eq-bar" />
      <span className="eq-bar" />
    </span>
  );
}
