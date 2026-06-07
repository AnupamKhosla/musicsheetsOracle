'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import IndianNotation from '@/components/IndianNotation';

const OSMDWrapper = dynamic(() => import('@/components/OSMDWrapper'), { ssr: false });

const TABS = [
  { key: 'western', label: 'Western Staff' },
  { key: 'indian', label: 'Indian Bhatkhande' },
];

export default function PostPage() {
  const params = useParams();
  const [post, setPost] = useState<any>({});
  const [notation, setNotation] = useState('western');
  const [passInput, setPassInput] = useState('');
  const [error, setError] = useState('');

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
          <div className="notation-tabs mt-6">
            {TABS.map(tab => (
              <button
                key={tab.key}
                className={`notation-tab ${notation === tab.key ? 'active' : ''}`}
                onClick={() => setNotation(tab.key)}
              >
                {tab.key === 'western' ? (
                  <span>
                    <svg className="tab-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <line x1="2" y1="4" x2="14" y2="4" stroke="currentColor" strokeWidth="0.5"/>
                      <line x1="2" y1="6" x2="14" y2="6" stroke="currentColor" strokeWidth="0.5"/>
                      <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="0.5"/>
                      <line x1="2" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="0.5"/>
                      <line x1="2" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="0.5"/>
                      <ellipse cx="5" cy="6" rx="1.2" ry="0.9" fill="currentColor" transform="rotate(-15 5 6)"/>
                    </svg>
                    <span className="tab-label">{tab.label}</span>
                  </span>
                ) : (
                  <span>
                    <svg className="tab-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <text x="1" y="13" fontSize="14" fill="currentColor" fontFamily="Noto Sans Devanagari, sans-serif">स</text>
                    </svg>
                    <span className="tab-label">{tab.label}</span>
                  </span>
                )}
              </button>
            ))}
          </div>

          {notation === 'western' && (
            <div className="min-h-[40rem]">
              {post.sheetName && <OSMDWrapper file={'/sheets/' + post.sheetName + '.xml'} />}
            </div>
          )}
          {notation === 'indian' && (
            <div className="min-h-[40rem]">
              {post.sheetName && <IndianNotation fileUrl={'/sheets/' + post.sheetName + '.xml'} />}
            </div>
          )}
        </div>
      </section>

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
          href={'/sheets/' + post.sheetName}
          download
          className="text-sm py-1 px-3 inline-block tracking-wide border align-middle transition duration-500 ease-in-out text-base text-center bg-slate-600 hover:bg-slate-700 border-slate-600 hover:border-slate-700 text-white rounded-md me-2 mt-2"
        >
          Download
        </a>
      </form>
    </>
  );
}
