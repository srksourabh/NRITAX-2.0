/**
 * Auth.js v5. Sign in with an email magic link or with Google.
 *
 * Sessions live in the database rather than in a JWT, so signing out — or
 * deleting a user — takes effect immediately instead of waiting for a token to
 * expire. A tax filing is worth that round trip.
 */

import { DrizzleAdapter } from '@auth/drizzle-adapter';
import NextAuth from 'next-auth';
import Nodemailer from 'next-auth/providers/nodemailer';

import { authConfig } from '@/lib/auth.config';
import { db } from '@/lib/db';
import { accounts, sessions, users, verificationTokens } from '@/lib/db/schema';

const emailServer = process.env.AUTH_EMAIL_SERVER?.trim();
const emailFrom = process.env.AUTH_EMAIL_FROM?.trim() || 'NRITAX <no-reply@localhost>';

/**
 * With AUTH_EMAIL_SERVER unset there is no SMTP server to send through, so the
 * sign-in URL is printed to the terminal and the developer pastes it into the
 * browser. Development only: set AUTH_EMAIL_SERVER and Nodemailer sends the
 * mail itself, and this branch is never taken.
 */
const emailProvider = emailServer
  ? Nodemailer({ server: emailServer, from: emailFrom })
  : Nodemailer({
      from: emailFrom,
      sendVerificationRequest({ identifier, url }) {
        console.info(`\n  Sign-in link for ${identifier}\n  ${url}\n`);
      },
    });

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: 'database' },
  providers: [...authConfig.providers, emailProvider],
});
