import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const db = await getDb();
  const collection = db.collection('musicsheets');

  let query: any = {};
  if (searchParams.get('songName')) query.sheetName = { $regex: searchParams.get('songName'), $options: 'i' };
  if (searchParams.get('artistName')) query.Artist = { $regex: searchParams.get('artistName'), $options: 'i' };
  if (searchParams.get('scaleName')) query.scale = { $regex: searchParams.get('scaleName'), $options: 'i' };
  if (searchParams.get('genre')) query.Genres = { $regex: searchParams.get('genre'), $options: 'i' };
  if (searchParams.get('date')) query.date = { $regex: searchParams.get('date'), $options: 'i' };

  const page = parseInt(searchParams.get('page') || '1');

  const results = await collection
    .find(query, { sort: ['date', 'asc'] } as any)
    .skip((page - 1) * 6)
    .limit(6)
    .toArray();

  return Response.json(results.map(r => ({ ...r, _id: r._id.toString() })));
}

export async function POST(request: NextRequest) {
  const db = await getDb();
  const collection = db.collection('musicsheets');
  let newDocument = await request.json();
  newDocument.date = new Date();
  return Response.json(newDocument);
}
