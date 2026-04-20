import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getSupabaseAdmin } from './supabase';

const allowed = (process.env.ALLOWED_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login', error: '/login' },
  callbacks: {
    async signIn({ user }) {
      const email = (user.email || '').toLowerCase();
      const ok = allowed.includes(email);
      try {
        await getSupabaseAdmin().from('access_logs').insert({
          email,
          name: user.name ?? null,
          allowed: ok,
          event: ok ? 'login_success' : 'login_denied',
        });
      } catch (e) {
        console.error('access_logs insert failed', e);
      }
      return ok ? true : '/login?error=unauthorized';
    },
    async jwt({ token, user }) {
      if (user?.email) token.email = user.email;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.email) session.user.email = token.email as string;
      return session;
    },
  },
};
