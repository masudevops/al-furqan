/** @type {import('next').NextConfig} */
const nextConfig = {
  // The service worker must always be revalidated so an update reaches installed apps.
  async headers() {
    return [{ source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }, { key: "Service-Worker-Allowed", value: "/" }] }];
  },
};

export default nextConfig;
