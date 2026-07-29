import NextAuth from 'next-auth';

import { authConfig } from '@/lib/auth.config';

/**
 * Edge-safe NextAuth wrapper for middleware. Full providers (email, demo) live
 * in auth.ts (Node). Middleware only needs the authorized() gate.
 */
export const { auth } = NextAuth(authConfig);
