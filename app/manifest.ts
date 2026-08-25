import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Gießrunde',
    short_name: 'Gießrunde',
    description: 'Euer gemeinsamer Gießplan für zuhause.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fcfbf7',
    theme_color: '#173c2d',
    lang: 'de',
  };
}
