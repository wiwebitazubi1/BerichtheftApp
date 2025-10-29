import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/calendar
 *
 * Returns a summary of report statuses for each day.  The response is an
 * object with a `statuses` property, mapping ISO date strings (yyyy-MM-dd)
 * to a status indicator.  Trainees only see their own reports; instructors
 * see all reports.  Status precedence is RED > YELLOW > GREEN.
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get('authToken')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Ungültiger Token' }, { status: 401 });
  }
  const userId = payload.id;
  const role = payload.role;
  // Fetch reports; restrict to user if trainee
  const reports = await prisma.report.findMany({
    where: role === 'AZUBI' ? { traineeId: userId } : {},
    select: { id: true, date: true, status: true },
  });
  const statuses: Record<string, { status: 'RED' | 'YELLOW' | 'GREEN' | 'NONE' }> = {};
  for (const report of reports) {
    const iso = report.date.toISOString().split('T')[0];
    const current = statuses[iso]?.status;
    let newStatus: 'RED' | 'YELLOW' | 'GREEN' | 'NONE' = 'NONE';
    switch (report.status) {
      case 'AENDERUNGSBEDARF':
        newStatus = 'RED';
        break;
      case 'EINGEREICHT':
        newStatus = 'YELLOW';
        break;
      case 'GEPRUEFT':
      case 'ENTWURF':
        newStatus = 'GREEN';
        break;
      default:
        newStatus = 'NONE';
    }
    // Determine the more severe status if multiple reports exist on the same day
    if (!current || current === 'NONE') {
      statuses[iso] = { status: newStatus };
    } else {
      // Precedence: RED > YELLOW > GREEN > NONE
      const order = { RED: 3, YELLOW: 2, GREEN: 1, NONE: 0 } as const;
      if (order[newStatus] > order[current as keyof typeof order]) {
        statuses[iso] = { status: newStatus };
      }
    }
  }
  return NextResponse.json({ statuses });
}