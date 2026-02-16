/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['assets.coingecko.com', 'raw.githubusercontent.com', 'tokens.1inch.io'],
  },
};

module.exports = nextConfig;
