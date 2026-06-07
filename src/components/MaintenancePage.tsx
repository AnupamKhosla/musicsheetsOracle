'use client';

import { useEffect, useState, useCallback } from 'react';

export default function MaintenancePage() {
  const [logs, setLogs] = useState('Waiting for pipeline...');
  const [ist, setIst] = useState('');
  const [lastUpdate, setLastUpdate] = useState('');
  const [copied, setCopied] = useState(false);
  const [retries, setRetries] = useState(0);

  const formatIST = useCallback((d: Date) => {
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, []);

  useEffect(() => {
    const tick = () => setIst(formatIST(new Date()));
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
          setLogs(text || 'Pipeline running...');
          setLastUpdate(formatIST(new Date()));
          setRetries(0);
        }
      } catch {
        setRetries(r => r + 1);
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(logs);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const colorize = (text: string) => {
    return text.split('\n').map((line, i) => {
      let cls = 'info';
      if (line.match(/\[.*\]/)) cls = 'ts';
      if (line.match(/FAILED|FATAL|ERROR/i)) cls = 'error';
      if (line.match(/WARN/i)) cls = 'warn';
      if (line.match(/SUCCESS|complete|live|Build successful/i)) cls = 'ok';
      return (
        <span key={i} className={`log-line ${cls}`}>
          {line}
          {'\n'}
        </span>
      );
    });
  };

  return (
    <div style={{
      fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
      background: '#0a0a0f', color: '#c9d1d9', minHeight: '100vh', padding: '32px 20px',
    }}>
      <style>{`
        .log-line.ts    { color: #58a6ff; }
        .log-line.info  { color: #d1d5db; }
        .log-line.warn  { color: #d29922; }
        .log-line.error { color: #f85149; }
        .log-line.ok    { color: #3fb950; }
        .header-wrap { max-width: 800px; margin: 0 auto 24px; padding-bottom: 16px; border-bottom: 1px solid #21262d; }
        .header-wrap h1 { font-size: 1.1rem; font-weight: 600; color: #58a6ff; margin-bottom: 4px; }
        .header-wrap .meta { font-size: 0.75rem; color: #8b949e; }
        .status-dot { display: inline-flex; align-items: center; gap: 6px; font-size: 0.75rem; }
        .status-dot .dot { width: 8px; height: 8px; border-radius: 50%; background: #3fb950; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
        .log-container { max-width: 800px; margin: 0 auto; background: #0d1117; border: 1px solid #21262d; border-radius: 8px; overflow: hidden; }
        .log-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 14px; background: #161b22; border-bottom: 1px solid #21262d; font-size: 0.7rem; color: #8b949e; }
        #log { padding: 14px; font-size: 0.8125rem; line-height: 1.75; white-space: pre-wrap; word-break: break-all; min-height: 300px; max-height: 65vh; overflow-y: auto; color: #d1d5db; }
        .copy-btn { background: #21262d; border: 1px solid #30363d; color: #8b949e; padding: 3px 10px; border-radius: 4px; cursor: pointer; font-family: inherit; font-size: 0.65rem; }
        .copy-btn:hover { background: #30363d; color: #c9d1d9; }
        .copy-btn.copied { background: #1a3a2a; border-color: #238636; color: #3fb950; }
        .footer { max-width: 800px; margin: 16px auto 0; font-size: 0.7rem; color: #484f58; text-align: center; }
      `}</style>

      <div className="header-wrap">
        <h1>musicsheets pipeline</h1>
        <div className="meta">
          <span>IST {ist}</span>
          &nbsp;|&nbsp;
          <span className="status-dot"><span className="dot"></span> deploying</span>
        </div>
      </div>

      <div className="log-container">
        <div className="log-header">
          <span>stdout</span>
          <span>
            <button
              className={`copy-btn${copied ? ' copied' : ''}`}
              onClick={handleCopy}
            >
              {copied ? 'Copied!' : 'Copy Logs'}
            </button>
            {' '}
            <span>{lastUpdate}</span>
          </span>
        </div>
        <pre id="log">{retries > 60 ? 'Logs unavailable. SSH into VPS.' : colorize(logs)}</pre>
      </div>

      <div className="footer">
        Site auto-reloads when deployment finishes. Do not close this page.
      </div>
    </div>
  );
}
