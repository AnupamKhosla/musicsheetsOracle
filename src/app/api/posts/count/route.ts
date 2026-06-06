import { NextRequest } from 'next/server';
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

  const count = await collection.find(query).count();
  return Response.json({ count });
}
