import type { NextRequest } from 'next/server';
import { html as beautify } from 'js-beautify';

export function proxy(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') return;
  if (request.headers.get('x-pretty-pass')) return;

  const url = new URL(request.url);
  return fetch(url.toString(), {
    headers: { 'x-pretty-pass': '1' },
    redirect: 'follow',
  }).then(async res => {
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('text/html')) return res;
    const text = await res.text();
    const pretty = beautify(text, { indent_size: 2, preserve_newlines: true, max_preserve_newlines: 1 });
    return new Response(pretty, {
      status: res.status,
      headers: res.headers,
    });
  });
}

export const matcher = /^\/((?!_next|api|favicon\.ico).*)/;
