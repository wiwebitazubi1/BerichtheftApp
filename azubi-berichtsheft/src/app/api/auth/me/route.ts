import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user based on the JWT stored in the
 * cookie.  If no valid token is present the response is 401.
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get('authToken')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
  }
  const data = verifyToken(token);
  if (!data) {
    return NextResponse.json({ error: 'Ungültiger Token' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: data.id },
    select: { id: true, email: true, role: true, name: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 401 });
  }
  return NextResponse.json(user);
}