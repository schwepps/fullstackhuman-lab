import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Jailnabi — Where No One Is Innocent',
    short_name: 'Jailnabi',
    description:
      'A daily AI accusation game for Hanabi. Craft prompts to generate fake evidence against your colleagues.',
    start_url: '/',
    display: 'standalone',
    background_color: '#1e1e1e',
    theme_color: '#FF6B00',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}
