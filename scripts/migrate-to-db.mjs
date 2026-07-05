#!/usr/bin/env node
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, extname, basename } from 'path';
import { gzipSync } from 'zlib';
import { MongoClient, Binary } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: join(import.meta.dirname, '..', '.env') });

const ROOT = join(import.meta.dirname, '..');
const SHEETS_DIR = join(ROOT, 'public', 'sheets');
const URI = process.env.ATLAS_URI || '';
const DB = 'musicsheets';

const XML_EXTS = ['.xml', '.musicxml', '.mxl'];

function extractTitle(content) {
  const m = content.match(/<(?:movement-title|work-title)[^>]*>([^<]+)<\//i);
  return m?.[1]?.trim() || null;
}

function extractComposer(content) {
  const m = content.match(/<creator[^>]*type="composer"[^>]*>([^<]+)<\//i);
  return m?.[1]?.trim() || null;
}

async function main() {
  if (!URI) { console.error('ATLAS_URI not set'); process.exit(1); }
  if (!existsSync(SHEETS_DIR)) { console.error('Sheets dir not found'); process.exit(1); }

  const client = new MongoClient(URI);
  await client.connect();
  const col = client.db(DB).collection('musicsheets');

  const files = readdirSync(SHEETS_DIR).filter(f =>
    XML_EXTS.includes(extname(f).toLowerCase())
  );

  console.log(`Found ${files.length} files in public/sheets/`);

  let imported = 0, skipped = 0, renamed = 0;

  for (const file of files) {
    const ext = extname(file);
    const nameNoExt = basename(file, ext);
    const content = readFileSync(join(SHEETS_DIR, file), 'utf-8');

    const title = extractTitle(content);
    const composer = extractComposer(content);

    const isWp = nameNoExt.startsWith('wp_');
    const sheetName = isWp && title ? title : nameNoExt;

    const existing = await col.findOne({ sheetName });
    if (existing?.xmlGz) {
      skipped++;
      continue;
    }

    const doc = {
      sheetName,
      Artist: composer || 'Unknown',
      Genres: 'Classical',
      scale: 'C',
      date: new Date(),
      password: '',
      source: 'public-domain',
    };

    if (content) {
      doc.xmlGz = new Binary(gzipSync(content));
    }

    if (existing) {
      await col.updateOne({ _id: existing._id }, { $set: { xmlGz: doc.xmlGz } });
      if (existing.sheetName !== sheetName) {
        await col.updateOne({ _id: existing._id }, { $set: { sheetName } });
        console.log(`  \u21BB Renamed: ${existing.sheetName} \u2192 ${sheetName}`);
        renamed++;
      }
    } else {
      await col.insertOne(doc);
    }

    console.log(`  \u2713 ${sheetName}${composer ? ` (${composer})` : ''}`);
    imported++;
  }

  console.log(`\nDone: ${imported} imported, ${renamed} renamed, ${skipped} skipped`);
  await client.close();
}

main().catch(console.error);
