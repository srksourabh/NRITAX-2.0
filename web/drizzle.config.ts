import { defineConfig } from 'drizzle-kit';

/** Must match EMBEDDED_DATA_DIR in src/lib/db/index.ts. */
const EMBEDDED_DATA_DIR = './.data/nritax';

// DDL cannot run through a transaction pooler, so prefer the direct connection
// when one is configured. See DIRECT_URL in .env.example.
const url = process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();

export default url
  ? defineConfig({
      dialect: 'postgresql',
      schema: './src/lib/db/schema.ts',
      out: './drizzle',
      dbCredentials: { url },
    })
  : defineConfig({
      dialect: 'postgresql',
      driver: 'pglite',
      schema: './src/lib/db/schema.ts',
      out: './drizzle',
      dbCredentials: { url: EMBEDDED_DATA_DIR },
    });
