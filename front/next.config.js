/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep your environment variables for API routing
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
  
  // Add the TypeScript ignore block
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig