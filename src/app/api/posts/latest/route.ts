import { getDb } from '@/lib/db';

export async function GET() {
  const db = await getDb();
  const collection = db.collection('musicsheets');
  const results = await collection
    .aggregate([
      { $project: { Artist: 1, sheetName: 1, Genres: 1, scale: 1, date: 1 } },
      { $sort: { date: -1 as const } },
      { $limit: 6 },
    ])
    .toArray();
  return Response.json(results.map(r => ({ ...r, _id: r._id.toString() })));
}
