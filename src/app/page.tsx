import { getDb } from '@/lib/db';
import Link from 'next/link';
import SearchForm from '@/components/SearchForm';
import PostSummary from '@/components/PostSummary';
import SideBySideViewer from '@/components/SideBySideViewer';

export default async function HomePage() {
  const db = await getDb();
  const posts = await db.collection('musicsheets')
    .aggregate([
      { $project: { Artist: 1, sheetName: 1, Genres: 1, scale: 1, date: 1, _id: 1 } },
      { $sort: { date: -1 as const } },
      { $limit: 6 },
    ])
    .toArray();

  const exampleSheet = await db.collection('musicsheets').findOne(
    { sheetName: { $regex: 'Jabase', $options: 'i' }, xmlGz: { $exists: true } },
    { projection: { _id: 1, sheetName: 1, scale: 1 }, sort: { date: -1 as const } }
  );
  const exampleId = exampleSheet?._id?.toString() || '';
  const exampleName = exampleSheet?.sheetName || 'Raag Bhupali';
  const exampleScale = exampleSheet?.scale || 'Bhoopali';

  return (
    <>
      <SearchForm />

      <h2 className="text-3xl font-bold mt-6 text-center">{exampleName} — Western &amp; Bhatkhande</h2>
      <p className="text-center text-slate-500 mt-2 mb-4 text-sm">
        {exampleScale} — a beginner-friendly raga taught in every Indian music class, shown side by side
      </p>
      <section className="relative">
        <div className="container relative">
          {exampleId && <SideBySideViewer sheetId={exampleId} sheetName={exampleName} />}
        </div>
      </section>

      <section className="relative mt-12">
        <div className="container relative">
          <h3 className="text-2xl font-bold text-center">Latest music sheets</h3>
          <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 mt-8 gap-[30px]">
            {posts.map((post: any) => (
              <PostSummary key={post._id.toString()} {...post} />
            ))}
          </div>
          <div className="grid md:grid-cols-12 grid-cols-1 mt-8 pb-8">
            <div className="md:col-span-12 text-center">
              <Link
                href="/search"
                className="relative inline-block font-semibold tracking-wide align-middle text-base text-center border-none after:content-[''] after:absolute after:h-px after:w-0 hover:after:w-full after:end-0 hover:after:end-auto after:bottom-0 after:start-0 after:transition-all after:duration-500 text-slate-400 hover:text-rose-600 after:bg-rose-600 duration-500 ease-in-out"
              >
                See all sheets <i className="uil uil-arrow-right align-middle"></i>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
