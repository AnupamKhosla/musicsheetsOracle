'use client';

import { useEffect, useRef, useState } from 'react';

const LOG_STYLES = `
  @keyframes log-highlight {
    0% { background: rgba(88, 166, 255, 0.12); border-left-color: #58a6ff; }
    100% { background: transparent; border-left-color: transparent; }
  }
  .log-line-new {
    display: block;
    border-left: 2px solid transparent;
    animation: log-highlight 3s ease-out forwards;
  }
  .scroll-btn {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: #1f2937;
    color: #c9d1d9;
    border: 1px solid #374151;
    border-radius: 20px;
    padding: 8px 16px;
    font-size: 13px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: opacity 0.2s;
    z-index: 10;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  }
  .scroll-btn:hover { background: #374151; }
  .live-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #3fb950;
    margin-right: 6px;
    animation: pulse-dot 2s ease-in-out infinite;
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
`;

export default function MaintenancePage() {
  const logRef = useRef<HTMLPreElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const prevLenRef = useRef(0);
  const reloadedRef = useRef(false);
  const atBottomRef = useRef(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [status, setStatus] = useState('Deploy in progress');

  useEffect(() => {
    const tick = () => {
      if (clockRef.current) {
        clockRef.current.textContent = new Date().toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit',
        });
      }
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    const onScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
      atBottomRef.current = atBottom;
      if (atBottom) setShowScrollBtn(false);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchLogs = async () => {
      try {
        const resp = await fetch('/api/logs?' + Date.now(), { cache: 'no-store' });
        if (!resp.ok || cancelled) return;
        const html = await resp.text();
        if (!logRef.current || cancelled) return;
        if (prevLenRef.current === 0) {
          logRef.current.innerHTML = html;
        } else if (html.length > prevLenRef.current) {
          const chunk = html.slice(prevLenRef.current);
          const lines = chunk.split('\n');
          const frag = document.createDocumentFragment();
          for (let i = 0; i < lines.length; i++) {
            const span = document.createElement('span');
            span.className = 'log-line-new';
            span.textContent = lines[i];
            frag.appendChild(span);
            if (i < lines.length - 1) {
              frag.appendChild(document.createTextNode('\n'));
            }
          }
          logRef.current.appendChild(frag);
          if (atBottomRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
          } else {
            setShowScrollBtn(true);
          }
        }
        prevLenRef.current = html.length;
      } catch {}
    };

    const checkDone = async () => {
      if (reloadedRef.current) return;
      try {
        const resp = await fetch('/api/health', { cache: 'no-store' });
        if (resp.ok) {
          const data = await resp.json();
          if (!data.maintenance) {
            setStatus('Deploy complete — reloading...');
            reloadedRef.current = true;
            setTimeout(() => window.location.reload(), 1500);
          }
        }
      } catch {}
    };

    fetchLogs();
    const a = setInterval(fetchLogs, 2000);
    const b = setInterval(checkDone, 8000);
    return () => { cancelled = true; clearInterval(a); clearInterval(b); };
  }, []);

  const scrollToBottom = () => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
      atBottomRef.current = true;
      setShowScrollBtn(false);
    }
  };

  return (
    <>
      <style>{LOG_STYLES}</style>
      <div style={{
        background: '#0a0a0f', color: '#c9d1d9', minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '40px 20px', fontFamily: 'monospace',
      }}>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#58a6ff', marginBottom: 4 }}>
          musicsheets pipeline
        </h1>
        <p style={{ color: '#8b949e', fontSize: 13, margin: '0 0 4px' }}>
          Indian time: <span ref={clockRef} style={{ color: '#c9d1d9' }} />
        </p>
        <p style={{ color: '#8b949e', fontSize: 12, margin: '0 0 20px', display: 'flex', alignItems: 'center' }}>
          <span className="live-dot" />
          {status}
        </p>
        <pre ref={logRef} style={{
          width: '100%', maxWidth: 820, minHeight: 200, maxHeight: '65vh',
          overflowY: 'auto', background: '#0d1117', border: '1px solid #21262d',
          borderRadius: 8, padding: 16, fontSize: 14, lineHeight: 1.7,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#d1d5db',
          margin: 0,
        }}>
          Waiting for pipeline...
        </pre>
        {showScrollBtn && (
          <button className="scroll-btn" onClick={scrollToBottom}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
            New logs below
          </button>
        )}
      </div>
    </>
  );
}
