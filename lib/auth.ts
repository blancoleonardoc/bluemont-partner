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
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
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
    async jwt({ token, account, user }) {
      // primeira vez que loga, account vem preenchido com tokens do Google
      if (account) {
        (token as any).accessToken = account.access_token;
        (token as any).refreshToken = account.refresh_token;
        (token as any).accessTokenExpires = account.expires_at ? account.expires_at * 1000 : undefined;
      }
      if (user?.email) token.email = user.email;
      if (user?.name) token.name = user.name;
      if (user?.image) (token as any).picture = user.image;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.email) session.user.email = token.email as string;
        if (token.name) session.user.name = token.name as string;
        if ((token as any).picture) session.user.image = (token as any).picture;
      }
      (session as any).accessToken = (token as any).accessToken;
      return session;
    },
  },
};
