'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SearchForm from '@/components/SearchForm';
import PostSummary from '@/components/PostSummary';
import ReactPaginate from 'react-paginate';

function SearchPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [posts, setPosts] = useState<any[] | 'empty'>([]);
  const [resultTotal, setResultTotal] = useState(0);
  const RESULTS_PER_PAGE = 6;

  const currentPage = parseInt(searchParams.get('page') || '1');
  const queryString = searchParams.toString();

  const loadPosts = useCallback(async () => {
    setPosts('empty');
    const countRes = await fetch(`/api/posts/count?${queryString}`).then(r => r.json());
    setResultTotal(countRes.count || 0);
    const data = await fetch(`/api/posts?${queryString}`).then(r => r.json());
    setPosts(data);
  }, [queryString]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handlePageClick = (event: { selected: number }) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(event.selected + 1));
    router.push(`/search?${params.toString()}`);
  };

  const pageCount = Math.ceil(resultTotal / RESULTS_PER_PAGE);
  const hasQuery = searchParams.toString() !== '';

  return (
    <>
      <SearchForm />
      <div className="container relative my-16 min-h-[400px]">
        <div className="text-center">
          <h3 className="font-head-ebgaramond text-3xl font-semibold text-[#3a2b1c]">Search results</h3>
          {posts !== 'empty' && posts.length > 0 && (
            <p className="text-sm text-[#8a6f4f] mt-1.5">
              {resultTotal} {resultTotal === 1 ? 'sheet' : 'sheets'} found
            </p>
          )}
        </div>

        {posts === 'empty' ? (
          <span className="paper-pressed block w-max mx-auto mt-6 px-6 py-3 text-[#8a6f4f]">Loading…</span>
        ) : posts.length === 0 ? (
          <span className="paper-pressed block w-max mx-auto mt-6 px-6 py-3 text-[#8a6f4f]">No results found — try a different raga or song.</span>
        ) : (
          <>
            <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 mt-8 gap-[30px]">
              {posts.map((post: any) => (
                <PostSummary key={post._id.toString()} {...post} />
              ))}
            </div>
            {resultTotal > RESULTS_PER_PAGE && (
              <ReactPaginate
                forcePage={currentPage - 1}
                nextLabel="next >"
                onPageChange={handlePageClick}
                pageRangeDisplayed={3}
                marginPagesDisplayed={2}
                pageCount={pageCount}
                previousLabel="< previous"
                pageClassName="page-item"
                pageLinkClassName="page-link"
                previousClassName="page-item"
                previousLinkClassName="page-link"
                nextClassName="page-item"
                nextLinkClassName="page-link"
                breakLabel="..."
                breakClassName="page-item"
                breakLinkClassName="page-link"
                containerClassName="pagination flex gap-x-4 justify-center mt-8"
                activeClassName="active text-rose-600"
                renderOnZeroPageCount={null}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading search...</div>}>
      <SearchPageInner />
    </Suspense>
  );
}
