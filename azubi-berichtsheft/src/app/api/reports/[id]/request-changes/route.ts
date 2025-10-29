import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { ReportStatus } from '@prisma/client';

/**
 * POST /api/reports/[id]/request-changes
 *
 * Requests changes on a report by setting its status to AENDERUNGSBEDARF
 * and appending an instructor comment.  Only instructors (AUSBILDER or
 * ADMIN) may perform this action.  The request body must include a
 * `text` field for the comment.  Returns the updated report summary.
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
    return NextResponse.json({ error: 'Nur Ausbilder dürfen Änderungen anfordern' }, { status: 403 });
  }
  const id = parseInt(params.id);
  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) {
    return NextResponse.json({ error: 'Bericht nicht gefunden' }, { status: 404 });
  }
  if (report.status === ReportStatus.GEPRUEFT) {
    return NextResponse.json({ error: 'Der Bericht wurde bereits freigegeben' }, { status: 400 });
  }
  try {
    const { text } = await request.json();
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Kommentar erforderlich' }, { status: 400 });
    }
    await prisma.$transaction([
      prisma.report.update({
        where: { id },
        data: { status: ReportStatus.AENDERUNGSBEDARF },
      }),
      prisma.comment.create({
        data: {
          reportId: id,
          authorId: payload.id,
          text,
        },
      }),
    ]);
    return NextResponse.json({ id, status: ReportStatus.AENDERUNGSBEDARF });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}