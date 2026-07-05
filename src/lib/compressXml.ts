import { gzipSync, gunzipSync } from 'node:zlib';

export function compressXml(xml: string): string {
  return gzipSync(xml).toString('base64');
}

export function decompressXml(compressed: string): string {
  return gunzipSync(Buffer.from(compressed, 'base64')).toString('utf-8');
}
