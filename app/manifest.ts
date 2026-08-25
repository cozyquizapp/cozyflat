import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CozyFlat – Unser Zuhause',
    short_name: 'CozyFlat',
    description: 'Pflanzen und Haushalt gemeinsam im Blick behalten.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fcfbf7',
    theme_color: '#173c2d',
    lang: 'de',
    icons: [
      {
        src: '/app-icon.png',
        sizes: 'any',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
