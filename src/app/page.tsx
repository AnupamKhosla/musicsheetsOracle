import { getDb } from '@/lib/db';
import Link from 'next/link';
import PostSummary from '@/components/PostSummary';
import ConversionDemo from '@/components/ConversionDemo';
import TanpuraStrings from '@/components/ambient/TanpuraStrings';
import WaveDivider from '@/components/ambient/WaveDivider';
import { RAGAS, GENRES, FEATURED_RAGAS } from '@/lib/catalog';

const SARGAM = ['S', 'r', 'R', 'g', 'G', 'm', 'M', 'P', 'd', 'D', 'n', 'N'];

export default async function HomePage() {
  const db = await getDb();
  const collection = db.collection('musicsheets');

  const posts = await collection
    .aggregate([
      { $project: { Artist: 1, sheetName: 1, Genres: 1, scale: 1, date: 1, _id: 1 } },
      { $sort: { date: -1 as const } },
      { $limit: 6 },
    ])
    .toArray();

  return (
    <div className="home-page">
      {/* ── Opening · compact banner + live conversion demo ─────────────── */}
      <section className="relative overflow-hidden">
        <TanpuraStrings />
        <div aria-hidden className="absolute -top-24 end-0 w-[420px] h-[420px] rounded-full bg-rose-200/30 blur-3xl pointer-events-none" />

        <div className="container relative pt-8 pb-8">
          {/* slim banner */}
          <div className="mb-6">
            <p className="text-[12px] font-semibold tracking-[0.22em] uppercase text-rose-600 mb-2">
              Hindustani · Bhatkhande notation
            </p>
            <h1 className="font-head-ebgaramond text-3xl sm:text-5xl leading-[1.05] font-semibold text-gray-900">
              Every raga, <span className="text-rose-600">readable &amp; playable.</span>
            </h1>

            {/* sargam motif strip */}
            <div className="mt-4 flex items-center gap-1.5" aria-hidden>
              {SARGAM.map((s, i) => (
                <span
                  key={i}
                  className="sargam-dot w-7 h-7 sm:w-8 sm:h-8 inline-flex items-center justify-center rounded-lg border text-[13px] sm:text-sm font-semibold transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                  style={{
                    color: i % 2 ? '#be123c' : '#4b5563',
                    borderColor: 'rgba(225,29,72,0.2)',
                    background: i % 2 ? 'rgba(255,241,242,0.85)' : 'rgba(255,255,255,0.85)',
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* the conversion demo — Bhatkhande first on mobile */}
          <ConversionDemo />
        </div>
      </section>

      <div className="container relative -my-1">
        <WaveDivider />
      </div>

      {/* ── Quick raga chips (horizontal scroll) ───────────────────────── */}
      <section className="container relative pb-2">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-2">
          <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-400">Ragas:</span>
          {FEATURED_RAGAS.map((r) => {
            const entry = RAGAS.find((x) => x.label === r);
            return (
              <Link
                key={r}
                href={`/search?scaleName=${entry?.value ?? r}`}
                prefetch={false}
                className="shrink-0 px-3.5 h-8 inline-flex items-center rounded-full bg-white border border-rose-100 text-[13px] font-medium text-rose-700 hover:bg-rose-600 hover:text-white hover:border-rose-600 hover:shadow transition-all duration-200"
              >
                {r}
              </Link>
            );
          })}
          <Link
            href="/search"
            className="shrink-0 px-3 h-8 inline-flex items-center rounded-full text-[13px] font-semibold text-gray-500 hover:text-rose-600 transition-colors"
          >
            All {RAGAS.length} →
          </Link>
        </div>
      </section>

      {/* ── Bento · what the site does ─────────────────────────────────── */}
      <section className="container relative py-8">
        <div className="grid lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 rounded-2xl bg-white border border-gray-100 shadow-sm p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <i className="uil uil-music-note text-2xl text-rose-600" aria-hidden />
            <h3 className="mt-3 font-head-ebgaramond text-xl font-semibold text-gray-900">Two notations, one song</h3>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              Every sheet renders as a Western staff and a Bhatkhande sargam
              grid, beat-aligned, so you can read either tradition — or both at once.
            </p>
          </div>

          <div className="lg:col-span-4 rounded-2xl bg-white border border-gray-100 shadow-sm p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <i className="uil uil-play-circle text-2xl text-rose-600" aria-hidden />
            <h3 className="mt-3 font-head-ebgaramond text-xl font-semibold text-gray-900">Beat-synced playback</h3>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              Press play and the current beat lights up in both notations as it
              sounds. Change tempo and voice while you learn.
            </p>
          </div>

          <div className="lg:col-span-3 rounded-2xl bg-rose-600 text-white shadow-sm p-6 flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div>
              <i className="uil uil-upload-alt text-2xl" aria-hidden />
              <h3 className="mt-3 font-head-ebgaramond text-xl font-semibold">Convert your own</h3>
              <p className="mt-2 text-sm text-rose-100 leading-relaxed">Upload MusicXML, get sargam instantly.</p>
            </div>
            <span className="mt-4 inline-flex items-center justify-center h-10 rounded-lg bg-white/15 text-sm font-semibold opacity-80">
              Contribute soon
            </span>
          </div>

          {/* genre quick links */}
          <div className="lg:col-span-12 rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-3.5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 me-2">Genres</span>
            {GENRES.map((g) => (
              <Link
                key={g.value}
                href={`/search?genre=${g.value}`}
                prefetch={false}
                className="px-3 h-7 inline-flex items-center rounded-full border border-gray-200 text-[12.5px] font-medium text-gray-600 hover:border-rose-300 hover:text-rose-700 hover:bg-rose-50 transition-colors"
              >
                {g.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="container relative -my-1">
        <WaveDivider />
      </div>

      {/* ── Latest sheets ──────────────────────────────────────────────── */}
      <section className="container relative pb-16">
        <div className="flex items-end justify-between mb-6">
          <h2 className="font-head-ebgaramond text-2xl sm:text-3xl font-semibold text-gray-900">Latest music sheets</h2>
          <Link href="/search" className="text-sm font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 group">
            See all
            <i className="uil uil-arrow-right group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-[30px]">
          {posts.map((post: any) => (
            <PostSummary key={post._id.toString()} {...post} />
          ))}
        </div>
      </section>
    </div>
  );
}
