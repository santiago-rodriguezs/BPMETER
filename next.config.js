/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { isServer }) => {
    // Allow AudioWorklet files to be loaded
    if (!isServer) {
      config.module.rules.push({
        test: /\.worklet\.(js|ts)$/,
        use: { loader: 'worklet-loader' },
      });
    }
    return config;
  },
};

module.exports = nextConfig;

