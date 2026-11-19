import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/site';
export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL;
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/signup`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/reviews`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${base}/docs/api`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];
}
