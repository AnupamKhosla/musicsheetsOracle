import { getDb } from '@/lib/db';
import SearchForm from '@/components/SearchForm';
import PostSummary from '@/components/PostSummary';
import MusicSheetViewer from '@/components/MusicSheetViewer';

export default async function HomePage() {
  const db = await getDb();
  const posts = await db.collection('musicsheets')
    .aggregate([
      { $project: { Artist: 1, sheetName: 1, Genres: 1, scale: 1, date: 1 } },
      { $sort: { date: -1 as const } },
      { $limit: 6 },
    ])
    .toArray();

  return (
    <>
      <SearchForm />

      <h2 className="text-3xl font-bold mt-6 text-center">Example music sheet</h2>
      <section className="relative">
        <div className="container relative min-h-[40rem]">
          <MusicSheetViewer fileUrl="/sheets/chopin_op9.xml" sheetName="Chopin Op. 9" />
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
              <a
                href="/search"
                className="relative inline-block font-semibold tracking-wide align-middle text-base text-center border-none after:content-[''] after:absolute after:h-px after:w-0 hover:after:w-full after:end-0 hover:after:end-auto after:bottom-0 after:start-0 after:transition-all after:duration-500 text-slate-400 hover:text-rose-600 after:bg-rose-600 duration-500 ease-in-out"
              >
                See all sheets <i className="uil uil-arrow-right align-middle"></i>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
