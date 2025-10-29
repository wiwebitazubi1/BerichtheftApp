import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { ReportStatus, ReportType } from '@prisma/client';

/**
 * GET /api/reports?date=yyyy-MM-dd
 *
 * Returns a list of report summaries for a given date.  Trainees only see
 * their own reports; instructors see all reports.  The response is of the
 * form `{ reports: [...] }`.  Each report contains id, date, type and
 * status.
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
  const { id: userId, role } = payload;
  const { searchParams } = new URL(request.url);
  const dateFilter = searchParams.get('date');
  const where: any = {};
  if (role === 'AZUBI') {
    where.traineeId = userId;
  }
  if (dateFilter) {
    const start = new Date(dateFilter);
    const end = new Date(dateFilter);
    // Include weekly reports that span multiple days; for simplicity, treat date equal
    end.setDate(end.getDate() + 1);
    where.date = {
      gte: start,
      lt: end,
    };
  }
  const reports = await prisma.report.findMany({
    where,
    select: {
      id: true,
      date: true,
      type: true,
      status: true,
    },
    orderBy: { date: 'asc' },
  });
  const result = reports.map((r) => ({
    id: r.id,
    date: r.date.toISOString().split('T')[0],
    type: r.type,
    status: r.status,
  }));
  return NextResponse.json({ reports: result });
}

/**
 * POST /api/reports
 *
 * Creates a new report in draft status.  Only trainees can create reports for
 * themselves.  Expects a JSON body with `date`, `type` (TAG or WOCHE) and
 * `content`.  Returns the created report summary.
 */
export async function POST(request: NextRequest) {
  const token = request.cookies.get('authToken')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Ungültiger Token' }, { status: 401 });
  }
  if (payload.role !== 'AZUBI') {
    return NextResponse.json({ error: 'Nur Auszubildende können Berichte erstellen' }, { status: 403 });
  }
  try {
    const { date, type, content } = await request.json();
    if (!date || !content) {
      return NextResponse.json({ error: 'Datum und Inhalt erforderlich' }, { status: 400 });
    }
    const report = await prisma.report.create({
      data: {
        traineeId: payload.id,
        date: new Date(date),
        type: (type || 'TAG') as ReportType,
        content,
        status: ReportStatus.ENTWURF,
      },
      select: { id: true, date: true, type: true, status: true },
    });
    return NextResponse.json({ report: {
      id: report.id,
      date: report.date.toISOString().split('T')[0],
      type: report.type,
      status: report.status,
    } }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}