/** @type {import('next').NextConfig} */
const nextConfig = {
  // ogl ships untranspiled ESM — let Next compile it with the app.
  transpilePackages: ["ogl"],
  experimental: {
    viewTransition: true,
  },
};

export default nextConfig;
