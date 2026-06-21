#!/usr/bin/env ts-node
/**
 * Bulk import public domain MusicXML sheets into MongoDB.
 * Sources:
 *   - OSMD test data (31 classical pieces)
 *   - PDMX repo (130+ public domain scores)
 *   - musetrainer/library (67 scores)
 *   - WindyPigeon collection (various)
 *
 * Usage: npm run import-sheets
 */

import { MongoClient, Db } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SHEETS_DIR = path.join(ROOT, 'public-sheets');
const DB_URI = process.env.ATLAS_URI || 'mongodb://localhost:27017';
const DB_NAME = 'musicsheets';

const SOURCES = [
  {
    name: 'osmd-test',
    url: 'https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/archive/refs/heads/develop.zip',
    extract: 'test/data/*.xml',
  },
  {
    name: 'pdmx',
    url: 'https://github.com/pnlong/PDMX/archive/refs/heads/main.zip',
    extract: 'scores/*.xml',
  },
  {
    name: 'musetrainer',
    url: 'https://github.com/musetrainer/library/archive/refs/heads/main.zip',
    extract: '*.xml',
  },
];

async function downloadSource(source: typeof SOURCES[0]) {
  console.log(`Downloading ${source.name}...`);
  const zipPath = path.join(SHEETS_DIR, `${source.name}.zip`);
  const extractDir = path.join(SHEETS_DIR, source.name);
  
  if (!fs.existsSync(extractDir)) {
    fs.mkdirSync(extractDir, { recursive: true });
    execSync(`curl -sL '${source.url}' -o '${zipPath}'`, { stdio: 'inherit' });
    execSync(`unzip -o '${zipPath}' -d '${extractDir}'`, { stdio: 'inherit' });
  }
}

function findXmlFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findXmlFiles(fullPath));
    } else if (entry.name.endsWith('.xml')) {
      files.push(fullPath);
    }
  }
  return files;
}

function parseMusicXML(xmlContent: string): { title?: string; composer?: string } {
  const titleMatch = xmlContent.match(/<work-title[^>]*>([^<]+)</i);
  const movementMatch = xmlContent.match(/<movement-title[^>]*>([^<]+)</i);
  const composerMatch = xmlContent.match(/<composer[^>]*>([^<]+)</i);
  
  return {
    title: movementMatch?.[1].trim() || titleMatch?.[1].trim(),
    composer: composerMatch?.[1].trim(),
  };
}

async function main() {
  console.log('Setting up public domain sheet import...\n');
  
  if (!fs.existsSync(SHEETS_DIR)) {
    fs.mkdirSync(SHEETS_DIR, { recursive: true });
  }
  
  // Download sources
  for (const source of SOURCES) {
    await downloadSource(source);
  }
  
  // Find all XML files
  const xmlFiles = SOURCES.flatMap(s => 
    findXmlFiles(path.join(SHEETS_DIR, s.name))
  );
  
  console.log(`Found ${xmlFiles.length} MusicXML files.\n`);
  
  // Connect to MongoDB
  const client = new MongoClient(DB_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  const collection = db.collection('musicsheets');
  
  let imported = 0;
  let skipped = 0;
  
  for (const xmlFile of xmlFiles) {
    try {
      const xmlContent = fs.readFileSync(xmlFile, 'utf-8');
      const metadata = parseMusicXML(xmlContent);
      
      if (!metadata.title) {
        skipped++;
        continue;
      }
      
      const sheetName = path.basename(xmlFile, '.xml');
      const existing = await collection.findOne({ sheetName });
      
      if (existing) {
        skipped++;
        continue;
      }
      
      // Save XML to public/sheets
      const destPath = path.join(ROOT, 'public', 'sheets', `${sheetName}.xml`);
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(xmlFile, destPath);
      
      // Insert into DB
      await collection.insertOne({
        sheetName,
        Artist: metadata.composer || 'Unknown',
        Genres: 'Classical',
        scale: 'C',
        date: new Date(),
        password: '', // No password for public domain
        source: 'public-domain',
      });
      
      imported++;
      console.log(`✓ ${sheetName} - ${metadata.composer || 'Unknown'}`);
    } catch (err) {
      console.error(`✗ ${xmlFile}: ${(err as Error).message}`);
    }
  }
  
  await client.close();
  console.log(`\nDone! Imported: ${imported}, Skipped: ${skipped}`);
}

main().catch(console.error);
