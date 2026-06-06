import type { Metadata } from 'next';
import './globals.scss';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'Musicsheets | Indian Ragas',
  description: 'Indian classical music sheets collection',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-container bg-slate-100 min-h-screen">
          <Navigation />
          <main>{children}</main>
          <footer className="py-3 bg-slate-200">
            <div className="container text-sm text-center">
              Designed and developed solely by{' '}
              <a className="text-rose-500 hover:text-rose-600 underline" href="https://www.linkedin.com/in/anupamkhosla/">
                Anupam Khosla
              </a>
              . The{' '}
              <a className="text-rose-500 hover:text-rose-600 underline" href="https://github.com/AnupamKhosla/musicGitBeanstalk">
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
