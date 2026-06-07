import type { Metadata } from 'next';
import './globals.scss';
import Navigation from '@/components/Navigation';
import MaintenancePage from '@/components/MaintenancePage';
import { isManagedPlatform } from '@/lib/platform';
import fs from 'node:fs';
import path from 'node:path';

export const metadata: Metadata = {
  title: 'Musicsheets | Indian Ragas',
  description: 'Indian classical music sheets collection',
};

const MAINT_FILE = path.join(process.cwd(), 'MAINTENANCE');

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const maintenance =
    !isManagedPlatform() &&
    fs.existsSync(MAINT_FILE) &&
    fs.readFileSync(MAINT_FILE, 'utf-8').trim() === '1';

  if (maintenance) {
    return (
      <html lang="en" dir="ltr">
        <body>
          <MaintenancePage />
        </body>
      </html>
    );
  }

  return (
    <html lang="en" dir="ltr">
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
