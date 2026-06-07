import fs from 'node:fs';
import path from 'node:path';

const MAINT_FILE = path.join(process.cwd(), 'MAINTENANCE');

export async function GET() {
  const maintenance =
    fs.existsSync(MAINT_FILE) &&
    fs.readFileSync(MAINT_FILE, 'utf-8').trim() === '1';
  return Response.json({ status: 'ok', maintenance });
}
