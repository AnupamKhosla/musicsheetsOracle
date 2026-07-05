import { NextRequest } from 'next/server';
import { Binary, ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';
import { compressXml } from '@/lib/compressXml';

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
    .project({ xmlGz: 0, password: 0 })
    .skip((page - 1) * 6)
    .limit(6)
    .toArray();

  return Response.json(results.map(r => ({ ...r, _id: r._id.toString() })));
}

export async function POST(request: NextRequest) {
  const db = await getDb();
  const collection = db.collection('musicsheets');

  const ct = request.headers.get('content-type') || '';

  let sheetName = '', Artist = 'Unknown', Genres = '', scale = 'C', password = '', source = '', xmlContent = '';

  if (ct.includes('multipart/form-data') || ct.includes('application/x-www-form-urlencoded')) {
    const fd = await request.formData();
    sheetName = (fd.get('sheetName') as string) || '';
    Artist = (fd.get('Artist') as string) || 'Unknown';
    Genres = (fd.get('Genres') as string) || '';
    scale = (fd.get('scale') as string) || 'C';
    password = (fd.get('password') as string) || '';
    source = (fd.get('source') as string) || '';
    const file = fd.get('file') as File | null;
    if (file) {
      xmlContent = await file.text();
    }
  } else {
    const body = await request.json();
    sheetName = body.sheetName || '';
    Artist = body.Artist || 'Unknown';
    Genres = body.Genres || '';
    scale = body.scale || 'C';
    password = body.password || '';
    source = body.source || '';
    xmlContent = body.xmlContent || '';
  }

  const doc: any = {
    sheetName,
    Artist,
    Genres,
    scale,
    date: new Date(),
    password,
    source,
  };

  if (xmlContent) {
    doc.xmlGz = new Binary(compressXml(xmlContent));
  }

  const result = await collection.insertOne(doc);
  return Response.json({ ...doc, _id: result.insertedId.toString(), xmlGz: undefined });
}
