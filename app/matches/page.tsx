import type { Metadata } from 'next';
import ScrimsPage from '@/app/scrims/page';

export const metadata: Metadata = {
  title: 'Matches — SQUAD.25',
  description: 'Public matches, upcoming practice rooms, and verified results for SQUAD.25.',
  alternates: { canonical: '/matches' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Matches — SQUAD.25',
    description: 'Upcoming practice rooms and verified results for SQUAD.25.',
    type: 'website',
    url: '/matches',
  },
};

export default async function MatchesPage() {
  return <ScrimsPage />;
}
