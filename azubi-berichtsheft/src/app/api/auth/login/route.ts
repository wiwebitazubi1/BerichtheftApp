import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signToken, setAuthCookie } from '@/lib/auth';

/**
 * POST /api/auth/login
 *
 * Authenticates a user using email and password.  On success, returns the
 * user object and sets an HttpOnly cookie containing a signed JWT.  On
 * failure, returns a 401 status with an error message.  Passwords are
 * compared using bcrypt’s constant‑time comparison to prevent timing attacks.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'E‑Mail und Passwort erforderlich' }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Ungültige Anmeldedaten' }, { status: 401 });
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Ungültige Anmeldedaten' }, { status: 401 });
    }
    const token = signToken({ id: user.id, role: user.role });
    const response = NextResponse.json({ user: { id: user.id, role: user.role, email: user.email } });
    setAuthCookie(response, token);
    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}