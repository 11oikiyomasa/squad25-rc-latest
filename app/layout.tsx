import { IBM_Plex_Mono, Manrope, Space_Grotesk } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';

const display = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Manrope({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://andregsman.eu.org'),
  title: 'SQUAD.25 — MLBB Roster',
  description: 'A dark editorial roster and montage archive for an MLBB squad.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body className={`${display.variable} ${body.variable} ${mono.variable}`}>{children}</body></html>;
}
