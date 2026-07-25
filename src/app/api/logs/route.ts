import fs from 'node:fs';
import path from 'node:path';

const LOGS_FILE = path.join(process.cwd(), 'ops/deploy-logs.html');

export async function GET() {
  if (!fs.existsSync(LOGS_FILE)) {
    return new Response('<pre>Waiting for pipeline...</pre>', {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }
  const content = fs.readFileSync(LOGS_FILE, 'utf-8');
  // npm/next pad their output with blank lines; drop empty/whitespace-only
  // lines so the live pipeline log reads as one clean, dense stream.
  const cleaned = content
    .split('\n')
    .filter((line) => line.trim() !== '')
    .join('\n');
  return new Response(cleaned, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
