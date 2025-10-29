import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth';
import { Role } from '@prisma/client';

/**
 * POST /api/auth/register
 *
 * Registers a new user.  Expects a JSON body with `email`, `password`,
 * optional `name`, and `role` (AZUBI or AUSBILDER).  Passwords are hashed
 * using bcrypt before being stored.  Returns 201 on success and sets an
 * authentication cookie.  Returns 400 if the user already exists or the
 * payload is invalid.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json();
    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Ungültige Daten' }, { status: 400 });
    }
    if (role !== 'AZUBI' && role !== 'AUSBILDER') {
      return NextResponse.json({ error: 'Ungültige Rolle' }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Benutzer existiert bereits' }, { status: 400 });
    }
    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashed,
        role: role as Role,
        name,
      },
      select: { id: true, role: true, email: true },
    });
    const token = signToken({ id: user.id, role: user.role });
    const response = NextResponse.json({ user });
    setAuthCookie(response, token);
    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}