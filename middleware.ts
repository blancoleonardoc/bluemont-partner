export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    // Protect everything except login, nextauth endpoints, and next internals
    '/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
