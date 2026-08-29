import type { MetadataRoute } from 'next';
import { members } from '@/data/squad';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://squad25-rc-latest.vercel.app').replace(/\/$/, '');
  return [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    ...members.map((member) => ({ url: `${base}/member/${member.id}`, changeFrequency: 'monthly' as const, priority: 0.7 })),
  ];
}
