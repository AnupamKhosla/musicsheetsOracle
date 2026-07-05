import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';
import { decompressXml } from '@/lib/compressXml';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return Response.json({ error: 'Invalid ID' }, { status: 400 });
  }
  const db = await getDb();
  const collection = db.collection('musicsheets');
  const result = await collection.findOne({ _id: objectId });
  if (!result) return Response.json({ error: 'Not found' }, { status: 404 });

  const { xmlGz, ...rest } = result;
  const output: any = { ...rest, _id: result._id.toString() };

  if (xmlGz) {
    output.xmlContent = decompressXml(xmlGz.buffer);
  }

  return Response.json(output);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { pass } = await request.json();
  if (pass !== process.env.DELETE_KEY) {
    return Response.json({}, { status: 401 });
  }
  const db = await getDb();
  const collection = db.collection('musicsheets');
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return Response.json(result);
}
