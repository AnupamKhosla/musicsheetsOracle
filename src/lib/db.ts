import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.ATLAS_URI || '';
const DB_NAME = 'musicsheets';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getDb(): Promise<Db> {
  if (cachedDb) return cachedDb;

  if (!MONGODB_URI) {
    throw new Error('ATLAS_URI environment variable is not set');
  }

  cachedClient = new MongoClient(MONGODB_URI, { tls: true });
  await cachedClient.connect();
  cachedDb = cachedClient.db(DB_NAME);

  return cachedDb;
}
