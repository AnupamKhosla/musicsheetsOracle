'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import MusicSheetViewer from '@/components/MusicSheetViewer';
import { parseMusicXMLString } from '@/lib/parseMusicXML';

export default function PostPage() {
  const params = useParams();
  const [post, setPost] = useState<any>({});
  const [passInput, setPassInput] = useState('');
  const [error, setError] = useState('');
  const [lyrics, setLyrics] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/posts/${params.id}`)
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        setPost(data);
        if (data.xmlContent) {
          const parsed = parseMusicXMLString(data.xmlContent);
          setLyrics(parsed.lyrics);
        }
      })
      .catch(() => setError('Failed to load sheet'));
  }, [params.id]);

  const deletePost = async () => {
    const resp = await fetch(`/api/posts/${params.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pass: passInput }),
    });
    if (resp.status !== 200) {
      alert('wrong password');
    }
  };

  return (
    <>
      <div className="text-center mt-12 px-4">
        <h1 className="my-3 font-head-ebgaramond text-3xl sm:text-4xl font-semibold text-[#3a2b1c]">{post.sheetName}</h1>
        <ul className="list-none mt-6 flex flex-wrap justify-center gap-3">
          {[
            { label: 'Artists', value: post.Artist },
            { label: 'Genre', value: post.Genres },
            { label: 'Scale', value: post.scale },
            { label: 'Published', value: post.date ? new Date(post.date).toLocaleDateString() : '' },
          ].map((m) => (
            <li key={m.label} className="paper-raised px-4 py-2">
              <span className="block text-sm font-semibold text-[#8a6f4f]">{m.label}</span>
              <span className="block text-[#3a2b1c]">{m.value}</span>
            </li>
          ))}
        </ul>
      </div>

      <section className="relative">
        <div className="container relative">
          {post.xmlContent && <MusicSheetViewer xmlContent={post.xmlContent} sheetName={post.sheetName} />}
          {!post.xmlContent && post._id && !error && (
            <div className="paper-pressed max-w-[600px] mx-auto my-8 px-6 py-5 text-center">
              <div className="text-lg font-semibold text-[#3a2b1c] mb-2">Sheet content unavailable</div>
              <div className="text-[#6b543c] leading-relaxed">
                The metadata for this sheet is in the database, but the original
                MusicXML content is missing. This can happen for older imports.
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="max-w-[800px] mx-auto my-12 px-4">
        <div className="paper-raised paper-raised--frame px-6 py-8">
          <h2 className="font-head-ebgaramond text-2xl font-semibold text-[#3a2b1c] text-center mb-6 tracking-wide">
            Lyrics
          </h2>
          <div className="font-head-ebgaramond text-2xl leading-loose text-[#3a2b1c] whitespace-pre-wrap text-center max-w-[600px] mx-auto">
            {lyrics.length > 0 ? lyrics.join(' ') : <em className="text-[#8a6f4f]">No lyrics available</em>}
          </div>
        </div>
      </section>

      <form onSubmit={e => { e.preventDefault(); deletePost(); }} className="container flex flex-wrap items-center mb-8">
        <input
          className="paper-pressed text-[#3a2b1c] placeholder-[#a08a68] px-4 py-2 me-2 mt-2 outline-none focus:ring-2 focus:ring-rose-300"
          type="password"
          placeholder="Password"
          value={passInput}
          onChange={e => setPassInput(e.target.value)}
        />
        <button
          type="submit"
          className="text-sm font-semibold py-2 px-4 inline-block tracking-wide align-middle transition-colors text-center bg-rose-700 hover:bg-rose-800 text-[#fdf6e8] rounded-md me-2 mt-2"
        >
          Delete sheet
        </button>
      </form>
    </>
  );
}
