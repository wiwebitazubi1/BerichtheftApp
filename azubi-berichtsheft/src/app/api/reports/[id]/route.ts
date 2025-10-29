import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { ReportStatus, ReportType } from '@prisma/client';

/**
 * GET /api/reports/[id]
 *
 * Returns the full report details including content and status.  Trainees can
 * only access their own reports; instructors can access any report.
 */
export async function GET(
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
  const reportId = parseInt(params.id);
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: {
      id: true,
      traineeId: true,
      date: true,
      type: true,
      content: true,
      status: true,
      comments: {
        select: {
          id: true,
          text: true,
          author: { select: { id: true, email: true, role: true, name: true } },
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!report) {
    return NextResponse.json({ error: 'Bericht nicht gefunden' }, { status: 404 });
  }
  if (payload.role === 'AZUBI' && payload.id !== report.traineeId) {
    return NextResponse.json({ error: 'Zugriff verweigert' }, { status: 403 });
  }
  return NextResponse.json({
    id: report.id,
    date: report.date.toISOString().split('T')[0],
    type: report.type,
    content: report.content,
    status: report.status,
    comments: report.comments,
  });
}

/**
 * PUT /api/reports/[id]
 *
 * Updates a report.  Only trainees can update their own reports and only if
 * the status is ENTWURF or AENDERUNGSBEDARF.  Expects a JSON body with
 * optional `content`, `date` and `type`.
 */
export async function PUT(
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
    return NextResponse.json({ error: 'Nur der Azubi kann diesen Bericht bearbeiten' }, { status: 403 });
  }
  if (![ReportStatus.ENTWURF, ReportStatus.AENDERUNGSBEDARF].includes(report.status)) {
    return NextResponse.json({ error: 'Dieser Bericht kann nicht bearbeitet werden' }, { status: 400 });
  }
  const body = await request.json();
  const data: any = {};
  if (body.content) data.content = body.content;
  if (body.date) data.date = new Date(body.date);
  if (body.type) data.type = body.type as ReportType;
  const updated = await prisma.report.update({
    where: { id },
    data,
    select: { id: true, date: true, type: true, status: true },
  });
  return NextResponse.json({
    id: updated.id,
    date: updated.date.toISOString().split('T')[0],
    type: updated.type,
    status: updated.status,
  });
}