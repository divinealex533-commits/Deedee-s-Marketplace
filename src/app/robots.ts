import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.APP_URL ?? '';
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/dashboard', '/admin', '/api/'] }],
    sitemap: base ? `${base}/sitemap.xml` : undefined,
  };
}
