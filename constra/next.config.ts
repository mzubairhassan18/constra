import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  // cacheComponents is deliberately OFF: Next 16's staged-render scheduler is
  // incompatible with workerd (pages hang -> Error 1101). The OpenNext fix
  // (opennextjs-cloudflare#1318) is not released yet — re-enable once it lands.
  // See DEPLOY.md. App never uses "use cache"; all pages are dynamic anyway.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
