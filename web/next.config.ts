import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { NextConfig } from 'next';

const webDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(webDir, '..');

const nextConfig: NextConfig = {
  // Keep PGlite off Turbopack's SSR rewriter — App Router pages were throwing
  // `path` TypeError (URL instance) when migrating via the bundled copy.
  serverExternalPackages: ['@electric-sql/pglite'],
  // Allow importing the canonical design-system tokens from the repo root.
  turbopack: {
    root: repoRoot,
  },
};

export default nextConfig;
