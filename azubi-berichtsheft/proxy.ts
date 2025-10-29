import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './src/lib/auth';

/**
 * Global proxy middleware for route protection.
 *
 * The new `proxy.ts` file replaces `middleware.ts` in Next.js 16 to make the
 * application’s network boundary explicit【381574850828656†L129-L146】.  This
 * function runs on every request and can rewrite, redirect, or modify the
 * response.  Here we use it to enforce that authenticated users can access
 * protected routes (/calendar and /reports), while allowing access to public
 * routes (like /login and /register).  Unauthenticated users attempting to
 * access protected routes are redirected to the login page.
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Bypass proxy for static files, API routes, and the root page
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  // Public pages that don’t require authentication
  const publicPaths = ['/login', '/register'];
  const isPublic = publicPaths.some((path) => pathname.startsWith(path));
  if (isPublic) {
    return NextResponse.next();
  }
  // For protected routes, check for a valid JWT cookie
  const token = request.cookies.get('authToken')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  const data = verifyToken(token);
  if (!data) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  // If authenticated, continue to the requested page
  return NextResponse.next();
}