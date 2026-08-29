import type { MetadataRoute } from 'next';

const siteUrl = 'https://squad25-rc-latest.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
