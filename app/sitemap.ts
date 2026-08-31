import type { MetadataRoute } from 'next';

const BASE = 'https://www.my-vantage.app';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE },
    { url: `${BASE}/login` },
    { url: `${BASE}/signup` },
    { url: `${BASE}/terms` },
    { url: `${BASE}/privacy` },
  ];
}
