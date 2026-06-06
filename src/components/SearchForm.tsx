'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchForm({ searchSubmitCallback }: { searchSubmitCallback?: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = formRef.current!;
    const songName = (form.elements.namedItem('songName') as HTMLInputElement).value;
    const artistName = (form.elements.namedItem('artistName') as HTMLInputElement).value;
    const scaleName = (form.elements.namedItem('scaleName') as HTMLInputElement).value;
    router.push(`/search?songName=${encodeURIComponent(songName)}&artistName=${encodeURIComponent(artistName)}&scaleName=${encodeURIComponent(scaleName)}`);
    if (searchSubmitCallback) searchSubmitCallback();
  };

  return (
    <>
      <section className="relative table w-full py-28 bg-[url('/img/sheet_bg.jpg')] bg-no-repeat bg-center bg-cover">
        <div className="absolute inset-0 bg-black opacity-80"></div>
        <div className="container relative">
          <div className="grid grid-cols-1 text-center mt-10">
            <h3 className="md:text-4xl text-3xl md:leading-normal leading-normal font-medium text-white">
              Indian classical music sheets collection
            </h3>
          </div>
        </div>
      </section>
      <div className="relative">
        <div className="shape absolute sm:-bottom-px -bottom-[2px] start-0 end-0 overflow-hidden z-1 text-gray-100 dark:text-slate-900">
          <svg className="w-full h-auto scale-[2.0] origin-top" viewBox="0 0 2880 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 48H1437.5H2880V0H2160C1442.5 52 720 0 720 0H0V48Z" fill="currentColor"></path>
          </svg>
        </div>
      </div>
      <div className="container relative -mt-16 z-1">
        <div className="grid grid-cols-1">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-md shadow-md dark:shadow-gray-800">
            <form ref={formRef} onSubmit={handleSubmit}>
              <div className="registration-form relative text-dark text-start">
                <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 lg:gap-0 gap-6">
                  <div className="filter-search-form relative">
                    <label htmlFor="songName" className="font-semibold text-sm mb-2">Song name</label>
                    <i className="uil uil-search absolute -bottom-[9px] -translate-y-1/2 start-3 z-1 text-rose-600 text-[20px]"></i>
                    <input
                      name="songName" id="songName" type="text"
                      className="pl-10 form-input lg:rounded-t-sm lg:rounded-e-none lg:rounded-b-none lg:rounded-s-sm lg:outline-0 w-full filter-input-box bg-gray-100 dark:bg-slate-800 border-0 focus:ring-0"
                      placeholder="E.g. Sonata"
                    />
                  </div>
                  <div className="ml-2 filter-search-form relative">
                    <label htmlFor="artistName" className="font-semibold text-sm mb-2">Artist name</label>
                    <input
                      name="artistName" id="artistName" type="text"
                      className="form-input lg:rounded-t-sm lg:rounded-e-none lg:rounded-b-none lg:rounded-s-sm lg:outline-0 w-full filter-input-box bg-gray-100 dark:bg-slate-800 border-0 focus:ring-0"
                      placeholder="E.g. Mozart"
                    />
                  </div>
                  <div className="ml-2 filter-search-form relative">
                    <label htmlFor="scaleName" className="font-semibold text-sm mb-2">Scale/Raga</label>
                    <input
                      name="scaleName" id="scaleName" type="text"
                      className="form-input lg:rounded-t-sm lg:rounded-e-none lg:rounded-b-none lg:rounded-s-sm lg:outline-0 w-full filter-input-box bg-gray-100 dark:bg-slate-800 border-0 focus:ring-0"
                      placeholder="E.g. Major"
                    />
                  </div>
                  <div className="lg:mt-6 flex items-end">
                    <input
                      type="submit" id="search" name="search"
                      className="ml-2 py-2 px-5 cursor-pointer inline-block font-semibold tracking-wide border align-middle transition duration-500 ease-in-out text-base text-center bg-rose-600 hover:bg-rose-700 border-rose-600 hover:border-rose-700 text-white searchbtn w-full !h-10 rounded"
                      value="Search"
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
