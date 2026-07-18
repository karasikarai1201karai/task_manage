import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Any Planner',
  description: 'ADHD向けタイムライン型タスク管理アプリ',
  appleWebApp: { capable: true, statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',   // ノッチ・ホームバー対応
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className={`${inter.className} h-full`}>
        {children}
      </body>
    </html>
  );
}
