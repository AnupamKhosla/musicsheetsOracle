'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { RAGAS, GENRES } from '@/lib/catalog';

export default function SearchForm({ searchSubmitCallback }: { searchSubmitCallback?: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = formRef.current!;
    const get = (name: string) => (form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement).value;
    const params = new URLSearchParams();
    const songName = get('songName');
    const artistName = get('artistName');
    const scaleName = get('scaleName');
    const genre = get('genre');
    if (songName) params.set('songName', songName);
    if (artistName) params.set('artistName', artistName);
    if (scaleName) params.set('scaleName', scaleName);
    if (genre) params.set('genre', genre);
    router.push(`/search?${params.toString()}`);
    if (searchSubmitCallback) searchSubmitCallback();
  };

  const fieldClass =
    'w-full h-11 px-3 rounded-lg border border-[#d9c69e] bg-[#f1e7d0] text-sm text-[#3a2b1c] outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-200 transition-colors';

  return (
    <div className="container relative mt-6">
      <form ref={formRef} onSubmit={handleSubmit} className="paper-raised paper-raised--frame p-5">
        <div className="grid lg:grid-cols-5 md:grid-cols-2 grid-cols-1 gap-3">
          <div className="relative">
            <label htmlFor="songName" className="block text-sm font-semibold text-[#8a6f4f] mb-1.5">Song name</label>
            <i className="uil uil-search absolute bottom-3 start-3 text-rose-500" />
            <input name="songName" id="songName" type="text" placeholder="E.g. Jabase" className={`${fieldClass} ps-9`} />
          </div>
          <div>
            <label htmlFor="artistName" className="block text-sm font-semibold text-gray-500 mb-1.5">Artist name</label>
            <input name="artistName" id="artistName" type="text" placeholder="E.g. Tyagaraja" className={fieldClass} />
          </div>
          <div>
            <label htmlFor="scaleName" className="block text-sm font-semibold text-gray-500 mb-1.5">Raga / scale</label>
            <select name="scaleName" id="scaleName" defaultValue="" className={fieldClass}>
              <option value="">Any raga</option>
              {RAGAS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="genre" className="block text-sm font-semibold text-gray-500 mb-1.5">Genre</label>
            <select name="genre" id="genre" defaultValue="" className={fieldClass}>
              <option value="">Any genre</option>
              {GENRES.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <input
              type="submit"
              value="Search"
              className="w-full h-11 cursor-pointer rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold tracking-wide transition-colors shadow-sm"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
