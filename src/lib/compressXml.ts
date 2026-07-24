import { gzipSync, gunzipSync } from 'node:zlib';

export function compressXml(xml: string): Buffer {
  return gzipSync(Buffer.from(xml, 'utf-8'));
}

const GZIP_MAGIC_0 = 0x1f;
const GZIP_MAGIC_1 = 0x8b;
const ZIP_MAGIC_0 = 0x50;
const ZIP_MAGIC_1 = 0x4b;

export async function decompressXmlFromDb(data: Buffer | Uint8Array): Promise<string> {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);

  if (buf.length < 2) throw new Error('xmlGz: empty or too short');

  if (buf[0] === GZIP_MAGIC_0 && buf[1] === GZIP_MAGIC_1) {
    const decompressed = gunzipSync(buf);
    if (decompressed[0] === ZIP_MAGIC_0 && decompressed[1] === ZIP_MAGIC_1) {
      return extractXmlFromMxl(decompressed);
    }
    return decompressed.toString('utf-8');
  }

  if (buf[0] === ZIP_MAGIC_0 && buf[1] === ZIP_MAGIC_1) {
    return extractXmlFromMxl(buf);
  }

  const asUtf8 = buf.toString('utf-8');
  if (asUtf8.trimStart().startsWith('<?xml') || asUtf8.trimStart().startsWith('<score-partwise')) {
    return asUtf8;
  }

  try {
    const decoded = Buffer.from(asUtf8, 'base64');
    if (decoded.length > 2 && decoded[0] === GZIP_MAGIC_0 && decoded[1] === GZIP_MAGIC_1) {
      const inner = gunzipSync(decoded);
      if (inner[0] === ZIP_MAGIC_0 && inner[1] === ZIP_MAGIC_1) {
        return extractXmlFromMxl(inner);
      }
      return inner.toString('utf-8');
    }
    if (decoded.length > 2 && decoded[0] === ZIP_MAGIC_0 && decoded[1] === ZIP_MAGIC_1) {
      return extractXmlFromMxl(decoded);
    }
  } catch {}

  throw new Error('xmlGz: unrecognised format');
}

async function extractXmlFromMxl(buf: Buffer): Promise<string> {
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(buf);

  const containerFile = zip.file('META-INF/container.xml');
  if (containerFile) {
    const containerXml = await containerFile.async('text');
    const match = containerXml.match(/full-path="([^"]+)"/);
    if (match) {
      const scoreFile = zip.file(match[1]);
      if (scoreFile) return scoreFile.async('text');
    }
  }

  const xmlFile = zip.file(/\.xml$/i)?.[0] || zip.file(/\.musicxml$/i)?.[0];
  if (xmlFile) return xmlFile.async('text');

  throw new Error('Invalid MXL: no XML score file found in archive');
}

export function validateMusicXml(content: string): boolean {
  const trimmed = content.trimStart();
  return trimmed.startsWith('<?xml') || trimmed.startsWith('<score-partwise');
}

export function validateMxlBuffer(buf: Buffer): boolean {
  return buf.length > 4 && buf[0] === ZIP_MAGIC_0 && buf[1] === ZIP_MAGIC_1 && buf[2] === 0x03 && buf[3] === 0x04;
}
