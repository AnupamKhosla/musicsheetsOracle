'use client';

import { useEffect, useRef, useCallback } from 'react';

export default function MaintenancePage() {
  const logRef = useRef<HTMLPreElement>(null);
  const istRef = useRef<HTMLSpanElement>(null);
  const lastUpdateRef = useRef<HTMLSpanElement>(null);
  const copyBtnRef = useRef<HTMLButtonElement>(null);
  const retriesRef = useRef(0);

  const formatIST = useCallback((d: Date) => {
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  }, []);

  useEffect(() => {
    const tick = () => {
      if (istRef.current) istRef.current.textContent = formatIST(new Date());
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [formatIST]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const resp = await fetch('/api/logs?' + Date.now(), { cache: 'no-store' });
        if (resp.ok) {
          const text = await resp.text();
          if (logRef.current) logRef.current.innerHTML = colorizeText(text);
          if (lastUpdateRef.current) lastUpdateRef.current.textContent = formatIST(new Date());
          retriesRef.current = 0;
        }
      } catch {
        retriesRef.current++;
      }
    };

    const checkAlive = async () => {
      try {
        const resp = await fetch('/api/health', { cache: 'no-store' });
        if (resp.ok) {
          const data = await resp.json();
          if (!data.maintenance) window.location.reload();
        }
      } catch {}
    };

    fetchLogs();
    const logTimer = setInterval(fetchLogs, 2000);
    const aliveTimer = setInterval(checkAlive, 4000);
    return () => { clearInterval(logTimer); clearInterval(aliveTimer); };
  }, [formatIST]);

  return (
    <div style={{ fontFamily: "ui-monospace,'SF Mono','Fira Code','Cascadia Code',monospace", background:'#0a0a0f', color:'#c9d1d9', minHeight:'100vh', padding:'32px 20px' }}>
      <style>{`
        .log-line.ts{color:#58a6ff}.log-line.info{color:#d1d5db}.log-line.warn{color:#d29922}.log-line.error{color:#f85149}.log-line.ok{color:#3fb950}
        .hw{max-width:800px;margin:0 auto 24px;padding-bottom:16px;border-bottom:1px solid #21262d}
        .hw h1{font-size:1.1rem;font-weight:600;color:#58a6ff;margin-bottom:4px}
        .hw .meta{font-size:.75rem;color:#8b949e}
        .sd{display:inline-flex;align-items:center;gap:6px;font-size:.75rem}
        .sd .dot{width:8px;height:8px;border-radius:50%;background:#3fb950;animation:pulse 1.5s infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
        .lc{max-width:800px;margin:0 auto;background:#0d1117;border:1px solid #21262d;border-radius:8px;overflow:hidden}
        .lh{display:flex;justify-content:space-between;align-items:center;padding:8px 14px;background:#161b22;border-bottom:1px solid #21262d;font-size:.7rem;color:#8b949e}
        #log{padding:14px;font-size:.8125rem;line-height:1.75;white-space:pre-wrap;word-break:break-all;min-height:300px;max-height:65vh;overflow-y:auto;color:#d1d5db}
        .copy-btn{background:#21262d;border:1px solid #30363d;color:#8b949e;padding:3px 10px;border-radius:4px;cursor:pointer;font-family:inherit;font-size:.65rem}
        .copy-btn:hover{background:#30363d;color:#c9d1d9}
        .copy-btn.copied{background:#1a3a2a;border-color:#238636;color:#3fb950}
        .footer{max-width:800px;margin:16px auto 0;font-size:.7rem;color:#484f58;text-align:center}
      `}</style>
      <div className="hw">
        <h1>musicsheets pipeline</h1>
        <div className="meta">
          <span>IST <span ref={istRef} /></span>
          &nbsp;|&nbsp;
          <span className="sd"><span className="dot" /> deploying</span>
        </div>
      </div>
      <div className="lc">
        <div className="lh">
          <span>stdout</span>
          <span>
            <button className="copy-btn" ref={copyBtnRef} onClick={async () => {
              const btn = copyBtnRef.current;
              if (!btn) return;
              try {
                await navigator.clipboard.writeText(logRef.current?.textContent || '');
                btn.textContent = 'Copied!';
                btn.classList.add('copied');
                setTimeout(() => { btn.textContent = 'Copy Logs'; btn.classList.remove('copied'); }, 2000);
              } catch {}
            }}>Copy Logs</button>
            {' '}<span ref={lastUpdateRef} />
          </span>
        </div>
        <pre id="log" ref={logRef}>Waiting for pipeline...</pre>
      </div>
      <div className="footer">Site auto-reloads when deployment finishes. Do not close this page.</div>
    </div>
  );
}

function colorizeText(text: string) {
  return text.split('\n').map(line => {
    let cls = 'info';
    if (/\[.*\]/.test(line)) cls = 'ts';
    if (/FAILED|FATAL|ERROR/i.test(line)) cls = 'error';
    if (/WARN/i.test(line)) cls = 'warn';
    if (/SUCCESS|complete|live|Build successful/i.test(line)) cls = 'ok';
    return '<span class="log-line ' + cls + '">' + line + '</span>';
  }).join('\n');
}
