import type { MetadataRoute } from 'next';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/app-config';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: '#F7F8F6',
    theme_color: '#1E9E6A',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
}
