import { NextRequest } from 'next/server';
import { Binary, ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';
import { compressXml, validateMusicXml, validateMxlBuffer } from '@/lib/compressXml';

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
    .project({ xmlGz: 0 })
    .skip((page - 1) * 6)
    .limit(6)
    .toArray();

  return Response.json(results.map(r => ({ ...r, _id: r._id.toString() })));
}

export async function POST(request: NextRequest) {
  const db = await getDb();
  const collection = db.collection('musicsheets');

  const ct = request.headers.get('content-type') || '';

  let sheetName = '', Artist = 'Unknown', Genres = '', scale = 'C', source = '';
  let xmlBuffer: Buffer | null = null;

  if (ct.includes('multipart/form-data') || ct.includes('application/x-www-form-urlencoded')) {
    const fd = await request.formData();
    sheetName = (fd.get('sheetName') as string) || '';
    Artist = (fd.get('Artist') as string) || 'Unknown';
    Genres = (fd.get('Genres') as string) || '';
    scale = (fd.get('scale') as string) || 'C';
    source = (fd.get('source') as string) || '';
    const file = fd.get('file') as File | null;
    if (file) {
      const bytes = Buffer.from(await file.arrayBuffer());
      if (validateMxlBuffer(bytes)) {
        xmlBuffer = bytes;
      } else {
        const text = bytes.toString('utf-8');
        if (!validateMusicXml(text)) {
          return Response.json({ error: 'Invalid file: must be MusicXML (.xml) or compressed MXL (.mxl)' }, { status: 400 });
        }
        xmlBuffer = compressXml(text);
      }
    }
  } else {
    const body = await request.json();
    sheetName = body.sheetName || '';
    Artist = body.Artist || 'Unknown';
    Genres = body.Genres || '';
    scale = body.scale || 'C';
    source = body.source || '';
    const xmlContent: string = body.xmlContent || '';
    if (xmlContent) {
      if (!validateMusicXml(xmlContent)) {
        return Response.json({ error: 'Invalid xmlContent: must be valid MusicXML' }, { status: 400 });
      }
      xmlBuffer = compressXml(xmlContent);
    }
  }

  if (!sheetName) {
    return Response.json({ error: 'sheetName is required' }, { status: 400 });
  }

  const doc: any = {
    sheetName,
    Artist,
    Genres,
    scale,
    date: new Date(),
    source,
  };

  if (xmlBuffer) {
    doc.xmlGz = new Binary(xmlBuffer);
  }

  const result = await collection.insertOne(doc);
  return Response.json({ ...doc, _id: result.insertedId.toString(), xmlGz: undefined });
}
