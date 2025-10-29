/** @type {import('next').NextConfig} */
const nextConfig = {
  // Opt into app directory and enable server actions where needed.
  experimental: {
    serverActions: true
  },
  reactStrictMode: true,
  // Add any other Next.js configuration here as needed.
};

module.exports = nextConfig;