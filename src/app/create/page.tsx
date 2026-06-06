'use client';

import { useState } from 'react';

export default function CreatePage() {
  const [author, setAuthor] = useState('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [body, setBody] = useState('');
  const [toastOpen, setToastOpen] = useState(false);

  const handleSubmit = async () => {
    await fetch('/api/posts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ author, title, tags: tags.split(','), body }),
    }).then(resp => resp.json());
    setAuthor('');
    setTitle('');
    setTags('');
    setBody('');
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 3000);
  };

  return (
    <div className="container my-16">
      <h2 className="text-3xl font-bold mb-6">Write New Post</h2>
      <form className="space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-semibold mb-1">Author</label>
          <input className="form-input w-full rounded border-gray-300" onChange={e => setAuthor(e.target.value)} value={author} />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Title</label>
          <input className="form-input w-full rounded border-gray-300" onChange={e => setTitle(e.target.value)} value={title} />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Tags</label>
          <input className="form-input w-full rounded border-gray-300" onChange={e => setTags(e.target.value)} value={tags} />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Post body</label>
          <textarea className="form-textarea w-full rounded border-gray-300" rows={10} onChange={e => setBody(e.target.value)} value={body} />
        </div>
        <button
          type="button"
          className="py-2 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded font-semibold"
          onClick={handleSubmit}
        >
          Save Blog Post
        </button>
      </form>
      {toastOpen && (
        <div className="mt-4 p-3 bg-green-100 text-green-800 rounded">Post Created!</div>
      )}
    </div>
  );
}
