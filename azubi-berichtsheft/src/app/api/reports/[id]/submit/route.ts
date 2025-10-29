import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { ReportStatus } from '@prisma/client';

/**
 * POST /api/reports/[id]/submit
 *
 * Transitions a report from ENTWURF or AENDERUNGSBEDARF to EINGEREICHT.
 * Only the trainee who owns the report may submit it.  Returns the updated
 * report summary.
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
  const id = parseInt(params.id);
  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) {
    return NextResponse.json({ error: 'Bericht nicht gefunden' }, { status: 404 });
  }
  if (payload.role !== 'AZUBI' || payload.id !== report.traineeId) {
    return NextResponse.json({ error: 'Nur der Azubi kann diesen Bericht einreichen' }, { status: 403 });
  }
  if (![ReportStatus.ENTWURF, ReportStatus.AENDERUNGSBEDARF].includes(report.status)) {
    return NextResponse.json({ error: 'Der Bericht ist nicht einreichbar' }, { status: 400 });
  }
  const updated = await prisma.report.update({
    where: { id },
    data: { status: ReportStatus.EINGEREICHT },
    select: { id: true, date: true, type: true, status: true },
  });
  return NextResponse.json({
    id: updated.id,
    date: updated.date.toISOString().split('T')[0],
    type: updated.type,
    status: updated.status,
  });
}