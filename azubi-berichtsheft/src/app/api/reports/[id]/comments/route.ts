import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/reports/[id]/comments
 *
 * Returns all comments for the given report.  Trainees can only access their
 * own reports; instructors can access comments for any report.  Comments
 * include author metadata and creation timestamp.
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
  const id = parseInt(params.id);
  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) {
    return NextResponse.json({ error: 'Bericht nicht gefunden' }, { status: 404 });
  }
  if (payload.role === 'AZUBI' && payload.id !== report.traineeId) {
    return NextResponse.json({ error: 'Zugriff verweigert' }, { status: 403 });
  }
  const comments = await prisma.comment.findMany({
    where: { reportId: id },
    select: {
      id: true,
      text: true,
      author: { select: { id: true, email: true, role: true, name: true } },
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json({ comments });
}

/**
 * POST /api/reports/[id]/comments
 *
 * Creates a new comment on the report.  Both trainees and instructors can
 * comment on a report as long as they have access to it.  The body must
 * include a non‑empty `text` field.
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
  if (payload.role === 'AZUBI' && payload.id !== report.traineeId) {
    return NextResponse.json({ error: 'Zugriff verweigert' }, { status: 403 });
  }
  const { text } = await request.json();
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return NextResponse.json({ error: 'Kommentar erforderlich' }, { status: 400 });
  }
  const comment = await prisma.comment.create({
    data: {
      reportId: id,
      authorId: payload.id,
      text,
    },
    select: {
      id: true,
      text: true,
      author: { select: { id: true, email: true, role: true, name: true } },
      createdAt: true,
    },
  });
  return NextResponse.json({ comment }, { status: 201 });
}