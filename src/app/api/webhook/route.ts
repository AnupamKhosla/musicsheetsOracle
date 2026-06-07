import { isManagedPlatform } from '@/lib/platform';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import path from 'node:path';

export async function POST(request: Request) {
  if (isManagedPlatform()) {
    return new Response('Not available on managed platforms', { status: 404 });
  }

  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    return new Response('Webhook secret not configured', { status: 500 });
  }

  const signature = request.headers.get('x-hub-signature-256');
  const rawBody = await request.text();
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(rawBody).digest('hex');

  try {
    if (!signature || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
      return new Response('Invalid signature', { status: 401 });
    }
  } catch {
    return new Response('Invalid signature', { status: 401 });
  }

  if (request.headers.get('x-github-event') === 'ping') {
    return new Response('pong');
  }

  const deployScript = path.join(process.cwd(), 'ops/scripts/deploy.sh');
  spawn('bash', [deployScript, process.cwd()], { detached: true, stdio: 'ignore' });

  return new Response('Deploy started', { status: 202 });
}
