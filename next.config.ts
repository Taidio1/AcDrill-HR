import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

export default withPWA({
  reactStrictMode: true,
  output: 'standalone',
  outputFileTracingRoot: process.cwd(),
});
