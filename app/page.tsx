import type { Metadata } from 'next';
import { getSquadContent } from '@/lib/content';
import { getPublicScrims } from '@/lib/scrims';
import HomeUX from '@/components/home-ux';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { profile, members } = await getSquadContent();
  return {
    title: `${profile.name} — MLBB Squad Archive`,
    description: `${profile.tagline} Public roster, player profiles, montage cuts, and squad archive.`,
    openGraph: { title: `${profile.name} — MLBB Squad Archive`, description: `${profile.tagline} Public roster, player profiles, montage cuts, and squad archive.`, type: 'website', images: members[0]?.photo ? [{ url: members[0].photo, alt: `${profile.name} roster` }] : [] },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function Home() {
  const [content, scrims] = await Promise.all([getSquadContent(), getPublicScrims()]);
  return <HomeUX content={content} scrims={scrims} />;
}
