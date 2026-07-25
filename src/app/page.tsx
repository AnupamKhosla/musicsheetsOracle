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
        <div aria-hidden className="opener-staff absolute -top-10 end-0 w-[520px] h-[220px] pointer-events-none" />

        <div className="container relative pt-8 pb-8">
          {/* slim banner */}
          <div className="mb-6">
            <p className="text-sm font-semibold tracking-[0.22em] uppercase text-rose-600 mb-2">
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
                  className="sargam-dot w-7 h-7 sm:w-8 sm:h-8 inline-flex items-center justify-center rounded-lg border text-sm font-semibold transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
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

      <div className="container relative my-3">
        <WaveDivider />
      </div>

      {/* ── Quick raga chips (horizontal scroll) ───────────────────────── */}
      <section className="container relative pb-2">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-2">
          <span className="shrink-0 text-sm font-semibold uppercase tracking-wide text-gray-400">Ragas:</span>
          {FEATURED_RAGAS.map((r) => {
            const entry = RAGAS.find((x) => x.label === r);
            return (
              <Link
                key={r}
                href={`/search?scaleName=${entry?.value ?? r}`}
                prefetch={false}
                className="shrink-0 px-3.5 h-8 inline-flex items-center rounded-full bg-white border border-rose-100 text-sm font-medium text-rose-700 hover:bg-rose-600 hover:text-white hover:border-rose-600 hover:shadow transition-all duration-200"
              >
                {r}
              </Link>
            );
          })}
          <Link
            href="/search"
            className="shrink-0 px-3 h-8 inline-flex items-center rounded-full text-sm font-semibold text-gray-500 hover:text-rose-600 transition-colors"
          >
            All {RAGAS.length} →
          </Link>
        </div>
      </section>

      {/* ── Bento · what the site does ─────────────────────────────────── */}
      <section className="container relative py-8">
        <div className="grid lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 paper-raised p-6">
            <i className="uil uil-music-note text-2xl text-rose-700" aria-hidden />
            <h3 className="mt-3 font-head-ebgaramond text-xl font-semibold text-[#3a2b1c]">Two notations, one song</h3>
            <p className="mt-2 text-sm text-[#6b543c] leading-relaxed">
              Every sheet renders as a Western staff and a Bhatkhande sargam
              grid, beat-aligned, so you can read either tradition — or both at once.
            </p>
          </div>

          <div className="lg:col-span-4 paper-raised p-6">
            <i className="uil uil-play-circle text-2xl text-rose-700" aria-hidden />
            <h3 className="mt-3 font-head-ebgaramond text-xl font-semibold text-[#3a2b1c]">Beat-synced playback</h3>
            <p className="mt-2 text-sm text-[#6b543c] leading-relaxed">
              Press play and the current beat lights up in both notations as it
              sounds. Change tempo and voice while you learn.
            </p>
          </div>

          <div className="lg:col-span-3 paper-raised p-6 flex flex-col justify-between !bg-[linear-gradient(145deg,#d3365a,#9f1239)]">
            <div>
              <i className="uil uil-upload-alt text-2xl text-[#f3e7d0]" aria-hidden />
              <h3 className="mt-3 font-head-ebgaramond text-xl font-semibold text-[#fdf6e8]">Convert your own</h3>
              <p className="mt-2 text-sm text-[#f7dcc8] leading-relaxed">Upload MusicXML, get sargam instantly.</p>
            </div>
            <span className="mt-4 inline-flex items-center justify-center h-10 rounded-lg bg-[#fdf6e8]/15 text-sm font-semibold text-[#fdf6e8]">
              Contribute soon
            </span>
          </div>

          {/* genre quick links */}
          <div className="lg:col-span-12 paper-pressed px-5 py-3.5 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold uppercase tracking-wide text-[#8a6f4f] me-2">Genres</span>
            {GENRES.map((g) => (
              <Link
                key={g.value}
                href={`/search?genre=${g.value}`}
                prefetch={false}
                className="px-3 h-7 inline-flex items-center rounded-full border border-[#d9c69e] text-sm font-medium text-[#6b543c] hover:border-rose-400 hover:text-rose-800 hover:bg-[#f7edd8] transition-colors"
              >
                {g.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="container relative mt-6 mb-8">
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
