import { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GCTU HostelHub - Ghana Hostel Booking',
    short_name: 'HostelHub',
    description: 'Find and book hostels near GCTU - MoMo 0206834470',
    start_url: '/',
    display: 'standalone',
    background_color: '#1a237e',
    theme_color: '#1a237e',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ]
  }
}