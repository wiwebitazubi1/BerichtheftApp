import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { ReportStatus } from '@prisma/client';

/**
 * POST /api/reports/[id]/approve
 *
 * Approves a report by setting its status to GEPRUEFT.  Only instructors
 * (AUSBILDER or ADMIN) may approve a report, and only if it is currently
 * EINGEREICHT.  Returns the updated report summary.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const token = request.cookies.get('authToken')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Ungültiger Token' }, { status: 401 });
  }
  if (payload.role !== 'AUSBILDER' && payload.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Nur Ausbilder dürfen Berichte freigeben' }, { status: 403 });
  }
  const id = parseInt(params.id);
  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) {
    return NextResponse.json({ error: 'Bericht nicht gefunden' }, { status: 404 });
  }
  if (report.status !== ReportStatus.EINGEREICHT) {
    return NextResponse.json({ error: 'Bericht kann nicht freigegeben werden' }, { status: 400 });
  }
  const updated = await prisma.report.update({
    where: { id },
    data: { status: ReportStatus.GEPRUEFT },
    select: { id: true, date: true, type: true, status: true },
  });
  return NextResponse.json({
    id: updated.id,
    date: updated.date.toISOString().split('T')[0],
    type: updated.type,
    status: updated.status,
  });
}