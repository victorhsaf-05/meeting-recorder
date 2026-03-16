import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiError, handlePrismaError } from '@/lib/utils';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        pains: { include: { solutions: true } },
        todos: { orderBy: { createdAt: 'asc' } },
        participants: { include: { participant: true } },
      },
    });

    if (!meeting) {
      return apiError('Reunião não encontrada', 404);
    }

    return NextResponse.json(meeting);
  } catch (error) {
    console.error('Error fetching meeting:', error);
    return apiError('Erro ao buscar reunião', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  try {
    const meeting = await prisma.meeting.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.context !== undefined && { context: body.context }),
      },
    });
    return NextResponse.json(meeting);
  } catch (error: unknown) {
    return handlePrismaError(error, 'Reunião não encontrada');
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.meeting.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handlePrismaError(error, 'Reunião não encontrada');
  }
}
