import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Keep PGlite off Turbopack's SSR rewriter — App Router pages were throwing
  // `path` TypeError (URL instance) when migrating via the bundled copy.
  serverExternalPackages: ['@electric-sql/pglite'],
};

export default nextConfig;
