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
          <footer className="py-3 bg-slate-200 mt-auto">
            <div className="container text-sm text-center">
              All rights reserved Designed and developed solely by{' '}
              <a className="text-rose-500 hover:text-rose-600 underline" href="https://www.linkedin.com/in/anupamkhosla/">
                Anupam Khosla
              </a>
              . The{' '}
              <a className="text-rose-500 hover:text-rose-600 underline" href="https://github.com/AnupamKhosla/musicsheetsOracle">
                design and code
              </a>{' '}
              is licenced under CC BY-SA 4.0.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
