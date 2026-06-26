import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://partimeku-app.vercel.app',
      lastModified: new Date(),
    },
    {
      url: 'https://partimeku-app.vercel.app/login',
      lastModified: new Date(),
    },
    {
      url: 'https://partimeku-app.vercel.app/register',
      lastModified: new Date(),
    },
  ]
}
