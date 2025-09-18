import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */

  // Disable static export for dynamic routes
  output: 'export', // Commented out to allow dynamic routes
};

module.exports = nextConfig;
