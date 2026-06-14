'use client';

import { useEffect, useRef } from 'react';

export default function MaintenancePage() {
  const logRef = useRef<HTMLPreElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const prevLenRef = useRef(0);
  const reloadedRef = useRef(false);

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
          logRef.current.insertAdjacentHTML('beforeend', chunk);
        }
        prevLenRef.current = html.length;
        logRef.current.scrollTop = logRef.current.scrollHeight;
      } catch {}
    };

    const checkDone = async () => {
      if (reloadedRef.current) return;
      try {
        const resp = await fetch('/api/health', { cache: 'no-store' });
        if (resp.ok) {
          const data = await resp.json();
          if (!data.maintenance) {
            reloadedRef.current = true;
            window.location.reload();
          }
        }
      } catch {}
    };

    fetchLogs();
    const a = setInterval(fetchLogs, 2000);
    const b = setInterval(checkDone, 8000);
    return () => { cancelled = true; clearInterval(a); clearInterval(b); };
  }, []);

  return (
    <div style={{
      background: '#0a0a0f', color: '#c9d1d9', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '40px 20px', fontFamily: 'monospace',
    }}>
      <h1 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#58a6ff', marginBottom: 4 }}>
        musicsheets pipeline
      </h1>
      <p style={{ color: '#8b949e', fontSize: 13, margin: '0 0 20px' }}>
        Indian time: <span ref={clockRef} style={{ color: '#c9d1d9' }} />
      </p>
      <pre ref={logRef} style={{
        width: '100%', maxWidth: 820, minHeight: 200, maxHeight: '65vh',
        overflowY: 'auto', background: '#0d1117', border: '1px solid #21262d',
        borderRadius: 8, padding: 16, fontSize: 13, lineHeight: 1.7,
        whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#d1d5db',
        margin: 0,
      }}>
        Waiting for pipeline...
      </pre>
      <p style={{ color: '#484f58', fontSize: 11, marginTop: 16 }}>
        Do not close this page — reloads automatically when deploy finishes.
      </p>
    </div>
  );
}
