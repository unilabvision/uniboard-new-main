/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server external packages (moved from experimental)
  serverExternalPackages: [],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'emfvwpztyuykqtepnsfp.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/robots.txt',
        destination: '/api/robots.txt',
      },
      {
        source: '/course-preview/cmcaldohq3boy08mp05g80e0j',
        destination: '/tr/kurs/crispr-cas9-teknolojisi-genomik-duzenleme-egitimi',
      },
    ];
  },
};

export default nextConfig;