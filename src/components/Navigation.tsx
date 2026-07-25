'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { RAGAS, GENRES } from '@/lib/catalog';

// A "meend" — the glide-arc from Bhatkhande notation — drawn under a nav item
// on hover/open. A tiny notehead pops at the arc's end, so each tab reads as a
// little phrase being played.
function MeendArc() {
  return (
    <svg viewBox="0 0 100 12" preserveAspectRatio="none" className="meend-svg" aria-hidden="true">
      <path
        className="meend-arc"
        pathLength={100}
        d="M3,3 Q50,11 97,3"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle className="meend-dot" cx="97" cy="3.2" r="3" fill="currentColor" />
    </svg>
  );
}

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();

  const [songName, setSongName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [scaleName, setScaleName] = useState('');
  const [genre, setGenre] = useState('');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [ragasOpen, setRagasOpen] = useState(false);
  const [genresOpen, setGenresOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(true);

  const navRef = useRef<HTMLElement>(null);

  // Close popovers on route change + outside click.
  useEffect(() => {
    setMobileMenuOpen(false);
    setRagasOpen(false);
    setGenresOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setRagasOpen(false);
        setGenresOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const runSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (songName.trim()) params.set('songName', songName.trim());
    if (artistName.trim()) params.set('artistName', artistName.trim());
    if (scaleName) params.set('scaleName', scaleName);
    if (genre) params.set('genre', genre);
    router.push(`/search?${params.toString()}`);
    setMobileMenuOpen(false);
  };

  const selectClass =
    'h-10 rounded-lg border border-gray-200 bg-white ps-3 pe-8 text-sm text-gray-700 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none transition-colors';

  return (
    <header ref={navRef} className="sticky top-0 z-999 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
      {/* ── Tier 1 · brand + Ragas / Genres dropdowns ───────────────────── */}
      <div className="container flex items-center gap-2 h-14">
        {/* mobile hamburger */}
        <button
          className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-700 active:scale-95 transition-transform"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          <i className={`uil ${mobileMenuOpen ? 'uil-times' : 'uil-bars'} text-lg`} />
        </button>

        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <img className="w-auto h-7" src="/logo.svg" alt="Clef symbol logo" />
          <span className="font-head-ebgaramond text-xl font-semibold tracking-wide text-gray-900 group-hover:text-rose-600 transition-colors">
            MusicSheets
          </span>
        </Link>

        {/* desktop dropdowns — meend-arc text tabs, no pills */}
        <nav className="hidden md:flex items-center gap-7 ms-4" aria-label="Browse">
          <div className="relative">
            <button
              className={`meend-nav ${ragasOpen ? 'is-active' : ''}`}
              onClick={() => { setRagasOpen((v) => !v); setGenresOpen(false); }}
              aria-expanded={ragasOpen}
            >
              <span className="meend-label">
                Ragas
                <i className={`uil uil-angle-down meend-caret ${ragasOpen ? 'rotate-180' : ''}`} />
              </span>
              <MeendArc />
            </button>
            {ragasOpen && (
              <div className="absolute start-0 top-full mt-3 w-[520px] rounded-xl border border-gray-100 bg-white shadow-xl p-4 z-50">
                <div className="grid grid-cols-3 gap-x-4 gap-y-0.5 max-h-[340px] overflow-y-auto">
                  {RAGAS.map((r) => (
                    <Link
                      key={r.value}
                      href={`/search?scaleName=${r.value}`}
                      prefetch={false}
                      className="px-2 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                    >
                      {r.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              className={`meend-nav ${genresOpen ? 'is-active' : ''}`}
              onClick={() => { setGenresOpen((v) => !v); setRagasOpen(false); }}
              aria-expanded={genresOpen}
            >
              <span className="meend-label">
                Genres
                <i className={`uil uil-angle-down meend-caret ${genresOpen ? 'rotate-180' : ''}`} />
              </span>
              <MeendArc />
            </button>
            {genresOpen && (
              <div className="absolute start-0 top-full mt-3 w-52 rounded-xl border border-gray-100 bg-white shadow-xl p-2 z-50">
                {GENRES.map((g) => (
                  <Link
                    key={g.value}
                    href={`/search?genre=${g.value}`}
                    prefetch={false}
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                  >
                    {g.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link href="/search" className="meend-nav">
            <span className="meend-label">All sheets</span>
            <MeendArc />
          </Link>
        </nav>

        <div className="ms-auto flex items-center gap-2">
          {/* mobile search toggle */}
          <button
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-700 active:scale-95 transition-transform"
            onClick={() => setShowSearch((v) => !v)}
            aria-label="Toggle search"
            aria-expanded={showSearch}
          >
            <i className="uil uil-search text-lg" />
          </button>
          <Link
            href="/create"
            className="pointer-events-none cursor-not-allowed hidden sm:inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-gray-200 text-[13.5px] font-semibold text-gray-400"
          >
            Contribute <i className="uil uil-edit" />
          </Link>
        </div>
      </div>

      {/* ── mobile menu · Ragas / Genres / All ─────────────────────────── */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="container py-3 space-y-1 max-h-[60vh] overflow-y-auto">
            <Link
              href="/search"
              className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-700 bg-rose-50"
            >
              All sheets
            </Link>

            <details className="group" open>
              <summary className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-800 cursor-pointer select-none hover:bg-gray-50">
                Ragas
                <i className="uil uil-angle-down text-lg group-open:rotate-180 transition-transform" />
              </summary>
              <div className="grid grid-cols-2 gap-0.5 px-1 pt-1 pb-2">
                {RAGAS.map((r) => (
                  <Link
                    key={r.value}
                    href={`/search?scaleName=${r.value}`}
                    prefetch={false}
                    className="px-2.5 py-1.5 rounded-lg text-[13px] text-gray-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    {r.label}
                  </Link>
                ))}
              </div>
            </details>

            <details className="group">
              <summary className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-800 cursor-pointer select-none hover:bg-gray-50">
                Genres
                <i className="uil uil-angle-down text-lg group-open:rotate-180 transition-transform" />
              </summary>
              <div className="grid grid-cols-2 gap-0.5 px-1 pt-1 pb-2">
                {GENRES.map((g) => (
                  <Link
                    key={g.value}
                    href={`/search?genre=${g.value}`}
                    prefetch={false}
                    className="px-2.5 py-1.5 rounded-lg text-[13px] text-gray-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    {g.label}
                  </Link>
                ))}
              </div>
            </details>
          </div>
        </div>
      )}

      {/* ── Tier 2 · search with filters (collapsible on mobile) ────────── */}
      <form
        onSubmit={runSearch}
        className={`border-t border-gray-100 bg-gray-50/80 ${showSearch ? 'block' : 'hidden md:block'}`}
      >
        <div className="container flex flex-wrap items-center gap-2 py-2.5">
          <div className="relative flex-1 min-w-[150px]">
            <i className="uil uil-search absolute start-3 top-1/2 -translate-y-1/2 text-rose-500" />
            <input
              type="text"
              value={songName}
              onChange={(e) => setSongName(e.target.value)}
              placeholder="Song or sheet name…"
              className="w-full h-10 ps-9 pe-3 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-colors"
            />
          </div>
          <input
            type="text"
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            placeholder="Artist / composer"
            className="hidden sm:block h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-colors w-40"
          />
          <select value={scaleName} onChange={(e) => setScaleName(e.target.value)} className={`${selectClass} max-w-[130px]`} aria-label="Filter by raga">
            <option value="">Any raga</option>
            {RAGAS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <select value={genre} onChange={(e) => setGenre(e.target.value)} className={`${selectClass} hidden sm:block`} aria-label="Filter by genre">
            <option value="">Any genre</option>
            {GENRES.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
          <button
            type="submit"
            className="h-10 px-4 sm:px-5 inline-flex items-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors shadow-sm active:scale-95"
          >
            <i className="uil uil-search" /> <span className="hidden xs:inline">Search</span>
          </button>
        </div>
      </form>
    </header>
  );
}
