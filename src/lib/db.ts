import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.ATLAS_URI || '';
const DB_NAME = 'musicsheets';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

const COLLECTION_VALIDATOR = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['sheetName'],
    properties: {
      sheetName: { bsonType: 'string', description: 'Sheet name is required' },
      Artist: { bsonType: 'string' },
      Genres: { bsonType: 'string' },
      scale: { bsonType: 'string' },
      date: { bsonType: 'date' },
      xmlGz: {
        bsonType: 'binData',
        description: 'Must be Binary (raw gzip bytes). Store via compressXml().',
      },
      source: { bsonType: 'string' },
    },
  },
};

export async function getDb(): Promise<Db> {
  if (cachedDb) return cachedDb;

  if (!MONGODB_URI) {
    throw new Error('ATLAS_URI environment variable is not set');
  }

  cachedClient = new MongoClient(MONGODB_URI, { tls: true });
  await cachedClient.connect();
  cachedDb = cachedClient.db(DB_NAME);

  try {
    await cachedDb.command({
      collMod: 'musicsheets',
      validator: COLLECTION_VALIDATOR,
      validationLevel: 'moderate',
      validationAction: 'warn',
    });
  } catch {}

  return cachedDb;
}
