'use client';

import { useEffect, useRef } from 'react';

export default function MaintenancePage() {
  const logRef = useRef<HTMLPreElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const prevLenRef = useRef(0);

  useEffect(() => {
    // IST clock
    const tick = () => {
      if (clockRef.current) {
        clockRef.current.textContent = new Date().toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit',
        });
      }
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const resp = await fetch('/api/logs?' + Date.now(), { cache: 'no-store' });
        if (resp.ok) {
          const html = await resp.text();
          if (logRef.current) {
            if (prevLenRef.current === 0) {
              logRef.current.innerHTML = html;
            } else if (html.length > prevLenRef.current) {
              const chunk = html.slice(prevLenRef.current);
              // Append as raw HTML so <pre> and <span> tags from deploy.sh render inline
              const div = document.createElement('div');
              div.innerHTML = chunk;
              for (const child of Array.from(div.childNodes)) {
                logRef.current.appendChild(child);
              }
            }
            prevLenRef.current = html.length;
          }
        }
      } catch {}
    };

    const checkDone = async () => {
      try {
        const resp = await fetch('/api/health', { cache: 'no-store' });
        if (resp.ok) {
          const data = await resp.json();
          if (!data.maintenance) window.location.reload();
        }
      } catch {}
    };

    fetchLogs();
    const a = setInterval(fetchLogs, 2000);
    const b = setInterval(checkDone, 4000);
    return () => { clearInterval(a); clearInterval(b); };
  }, []);

  return (
    <div style={{ background: '#0e1111', color: '#ccc', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', padding: 24 }}>
      <h2 style={{ color: '#c9d1d9', margin: 0 }}>musicsheets — deploying</h2>
      <p style={{ color: '#8b949e', fontSize: 13, margin: '4px 0 20px' }}>
        IST <span ref={clockRef} />
      </p>
      <pre ref={logRef} style={{
        width: '100%', maxWidth: 800, maxHeight: '60vh', overflow: 'auto',
        background: '#161b22', border: '1px solid #21262d', borderRadius: 6,
        padding: 16, fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap',
        wordBreak: 'break-all', margin: 0,
      }}>
        Waiting for pipeline...
      </pre>
      <p style={{ color: '#484f58', fontSize: 11, marginTop: 16 }}>
        This page auto-reloads when the deploy finishes.
      </p>
    </div>
  );
}
