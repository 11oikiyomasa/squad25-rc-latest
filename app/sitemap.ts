import type { MetadataRoute } from 'next';
import { members } from '@/data/squad';

const siteUrl = 'https://squad25-rc-latest.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: 'weekly', priority: 1 },
    ...members.map((member) => ({ url: `${siteUrl}/member/${member.id}`, changeFrequency: 'monthly' as const, priority: 0.7 })),
  ];
}
