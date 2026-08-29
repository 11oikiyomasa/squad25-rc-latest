import { IBM_Plex_Mono, Manrope, Space_Grotesk } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';

const display = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Manrope({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-mono', display: 'swap' });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://andregsman.eu.org';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'No Flaws — MLBB Squad Archive',
    template: '%s | No Flaws',
  },
  description: 'Twenty-five players. One legacy. Public roster, player profiles, montage cuts, and squad archive.',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'No Flaws',
    title: 'No Flaws — MLBB Squad Archive',
    description: 'Twenty-five players. One legacy. Public roster, player profiles, montage cuts, and squad archive.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'No Flaws — MLBB Squad Archive',
    description: 'Twenty-five players. One legacy. Public roster, player profiles, montage cuts, and squad archive.',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body className={`${display.variable} ${body.variable} ${mono.variable}`}>{children}</body></html>;
}
