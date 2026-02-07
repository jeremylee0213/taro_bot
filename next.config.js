/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  output: 'export',
  basePath: isProd ? '/taro_bot' : '',
  assetPrefix: isProd ? '/taro_bot/' : '',
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
