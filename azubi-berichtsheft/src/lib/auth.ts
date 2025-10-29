import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

/**
 * Utility functions for hashing passwords and signing/verifying JWTs.
 */
const HASH_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, HASH_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Sign a JWT containing the user’s id and role.  The token is issued for 7 days
 * and must be stored in an HttpOnly cookie for security.  The secret must be
 * provided via the AUTH_SECRET environment variable.
 */
export function signToken(payload: { id: number; role: string }): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is not set');
  }
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export function verifyToken(token: string): { id: number; role: string } | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is not set');
  }
  try {
    return jwt.verify(token, secret) as { id: number; role: string };
  } catch {
    return null;
  }
}

/**
 * Extracts the JWT from the request cookies and returns the associated user
 * record from the database. If no valid token exists, `null` is returned.
 */
export async function getUserFromRequest(request: NextRequest) {
  const cookie = request.cookies.get('authToken');
  if (!cookie) return null;
  const data = verifyToken(cookie.value);
  if (!data) return null;
  return prisma.user.findUnique({ where: { id: data.id } });
}

/**
 * Middleware helper to enforce authentication on API routes.  If the user is
 * unauthenticated, a 401 response is returned.  Otherwise the user object is
 * returned for use in the route handler.
 */
export async function requireAuth(request: NextRequest): Promise<
  | { id: number; role: string; email: string }
  | { error: string }
> {
  const cookie = request.cookies.get('authToken');
  if (!cookie) {
    return { error: 'Unauthorized' };
  }
  const data = verifyToken(cookie.value);
  if (!data) {
    return { error: 'Unauthorized' };
  }
  const user = await prisma.user.findUnique({
    where: { id: data.id },
    select: { id: true, role: true, email: true },
  });
  if (!user) {
    return { error: 'Unauthorized' };
  }
  return user;
}

/**
 * Helper to set the authentication cookie in a response.
 */
export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set('authToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}