import { MetadataRoute } from 'next';
import { getDb } from '@/lib/db';

const BASE_URL = 'https://musicsheets.site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = await getDb();
  const collection = db.collection('musicsheets');
  const sheets = await collection
    .find({}, { projection: { _id: 1, date: 1 } })
    .toArray();

  const sheetEntries: MetadataRoute.Sitemap = sheets.map((s) => ({
    url: `${BASE_URL}/post/${s._id.toString()}`,
    lastModified: s.date ? new Date(s.date) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/search`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    ...sheetEntries,
  ];
}
