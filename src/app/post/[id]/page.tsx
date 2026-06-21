'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import MusicSheetViewer from '@/components/MusicSheetViewer';
import { loadMusicXmlFromUrl, parseMusicXMLString } from '@/lib/parseMusicXML';

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
      .then(setPost)
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

  const sheetUrl = post.sheetName ? `/sheets/${post.sheetName}.xml` : null;
  const sheetBaseName = post.sheetName || '';

  useEffect(() => {
    if (!sheetUrl) return;
    let cancelled = false;
    loadMusicXmlFromUrl(sheetUrl)
      .then((xml) => {
        if (cancelled) return;
        const parsed = parseMusicXMLString(xml);
        setLyrics(parsed.lyrics);
      })
      .catch(() => {
        if (!cancelled) setLyrics([]);
      });
    return () => {
      cancelled = true;
    };
  }, [sheetUrl]);

  return (
    <>
      <div className="text-center mt-12">
        <h1 className="my-3 text-[26px] font-semibold">{post.sheetName}</h1>
        <ul className="list-none mt-6">
          <li className="inline-block font-semibold text-slate-400 mx-4">
            <span className="text-slate-900 dark:text-white block">Artists :</span>
            <span className="block"> {post.Artist} </span>
          </li>
          <li className="inline-block font-semibold text-slate-400 mx-4">
            <span className="text-slate-900 dark:text-white block">Genre :</span>
            <span className="block">{post.Genres}</span>
          </li>
          <li className="inline-block font-semibold text-slate-400 mx-4">
            <span className="text-slate-900 dark:text-white block">Scale :</span>
            <span className="block">{post.scale}</span>
          </li>
          <li className="inline-block font-semibold text-slate-400 mx-4">
            <span className="text-slate-900 dark:text-white block">Published :</span>
            <span className="block">{post.date ? new Date(post.date).toLocaleDateString() : ''}</span>
          </li>
        </ul>
      </div>

      <section className="relative">
        <div className="container relative">
          {sheetUrl && <MusicSheetViewer fileUrl={sheetUrl} sheetName={post.sheetName} />}
        </div>
      </section>

      {lyrics.length > 0 && (
        <section
          style={{
            maxWidth: 800,
            margin: '3rem auto',
            padding: '2rem 1.5rem',
          }}
        >
          <h2
            style={{
              fontSize: '1.6rem',
              fontWeight: 700,
              color: '#1C1917',
              textAlign: 'center',
              marginBottom: '1.5rem',
              letterSpacing: '0.5px',
            }}
          >
            Lyrics
          </h2>
          <div
            style={{
              fontSize: '24px',
              lineHeight: 2,
              color: '#1C1917',
              whiteSpace: 'pre-wrap',
              textAlign: 'center',
              fontFamily: '"EB Garamond", Georgia, serif',
              maxWidth: 600,
              margin: '0 auto',
            }}
          >
            {lyrics.join(' ')}
          </div>
        </section>
      )}

      <form onSubmit={e => { e.preventDefault(); deletePost(); }} className="container flex items-center mb-5">
        <input
          className="text-sm py-1 px-3 me-2 mt-2 focus:border-rose-700 text-base text-gray-700 placeholder-gray-600 border rounded-lg focus:shadow-outline"
          type="password"
          placeholder="Password"
          value={passInput}
          onChange={e => setPassInput(e.target.value)}
        />
        <button
          type="submit"
          className="text-sm py-1 px-3 inline-block tracking-wide border align-middle transition duration-500 ease-in-out text-base text-center bg-rose-600 hover:bg-rose-700 border-rose-600 hover:border-rose-700 text-white rounded-md me-2 mt-2"
        >
          Delete sheet
        </button>
        <a
          href={'/sheets/' + sheetBaseName}
          download
          className="text-sm py-1 px-3 inline-block tracking-wide border align-middle transition duration-500 ease-in-out text-base text-center bg-slate-600 hover:bg-slate-700 border-slate-600 hover:border-slate-700 text-white rounded-md me-2 mt-2"
        >
          Download
        </a>
      </form>
    </>
  );
}
