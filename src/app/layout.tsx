import type { Metadata } from 'next';
import './globals.scss';
import '@iconscout/unicons/css/line.css';
import Navigation from '@/components/Navigation';
import LocatorDev from '@/components/LocatorDev';
import MusicAmbient from '@/components/ambient/MusicAmbient';

export const metadata: Metadata = {
  title: 'Musicsheets | Indian Ragas',
  description: 'Indian classical music sheets collection',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css?family=Nunito:300,400,500,600,700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Alex+Brush&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@300&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Kaushan+Script&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <LocatorDev />
        <MusicAmbient />
        <div className="app-container relative z-10 min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-1 flex flex-col">{children}</main>
          <footer className="mt-auto border-t border-rose-100 bg-[#fdf6f3]">
            <div className="container flex flex-col md:flex-row md:items-center gap-4 py-8">
              <a href="/" className="flex items-center gap-3 group">
                <img className="w-auto h-14" src="/logo.svg" alt="MusicSheets — tanpura shaped as a musical note" />
                <span className="leading-tight">
                  <span className="block font-head-ebgaramond text-xl font-semibold text-gray-900 group-hover:text-rose-700 transition-colors">
                    Music<span className="text-rose-700">Sheets</span>
                  </span>
                  <span className="block text-sm text-gray-500">Western staff &amp; Bhatkhande sargam, side by side</span>
                </span>
              </a>
              <p className="text-sm text-gray-500 md:ms-auto md:text-end max-w-md">
                Designed &amp; developed by{' '}
                <a className="text-rose-700 hover:text-rose-900 underline decoration-rose-300 underline-offset-2" href="https://www.linkedin.com/in/anupamkhosla/">
                  Anupam Khosla
                </a>
                .{' '}
                <a className="text-rose-700 hover:text-rose-900 underline decoration-rose-300 underline-offset-2" href="https://github.com/AnupamKhosla/musicsheetsOracle">
                  Design &amp; code
                </a>{' '}
                licensed CC BY-SA 4.0.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
