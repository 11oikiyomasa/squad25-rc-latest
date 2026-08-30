import type { MetadataRoute } from 'next';
import { members } from '@/data/squad';

const siteUrl = 'https://squad25-rc-latest.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/roster`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}/matches`, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${siteUrl}/media`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/recruitment`, changeFrequency: 'monthly', priority: 0.75 },
    ...members.map((member) => ({ url: `${siteUrl}/member/${member.id}`, changeFrequency: 'monthly' as const, priority: 0.7 })),
  ];
}
