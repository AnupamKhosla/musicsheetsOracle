const dotenv = require('dotenv');
dotenv.config();

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const uri = process.env.ATLAS_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function run() {
  await client.connect();
  const db = client.db('musicsheets');
  const col = db.collection('musicsheets');
  
  const files = fs.readdirSync('./public/sheets').filter(f => f.endsWith('.xml') || f.endsWith('.musicxml'));
  console.log(`Found ${files.length} files`);
  
  let imported = 0;
  for (const file of files) {
    const xml = fs.readFileSync(path.join('./public/sheets', file), 'utf-8');
    const title = xml.match(/<(?:movement-title|work-title)[^>]*>([^<]+)<\//i)?.[1]?.trim();
    const composer = xml.match(/<composer[^>]*>([^<]+)<\//i)?.[1]?.trim();
    const sheetName = path.basename(file, path.extname(file));
    
    const exists = await col.findOne({ sheetName });
    if (exists) continue;
    
    await col.insertOne({
      sheetName,
      Artist: composer || 'Unknown',
      Genres: 'Classical',
      scale: 'C',
      date: new Date(),
      password: '',
      source: 'public-domain',
    });
    imported++;
  }
  
  console.log(`Imported: ${imported}`);
  await client.close();
}

run().catch(console.error);
