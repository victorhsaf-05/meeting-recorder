import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiError, handlePrismaError } from '@/lib/utils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const routine = await prisma.routine.findUnique({ where: { id } });
    if (!routine) return apiError('Rotina não encontrada', 404);

    const body = await request.json().catch(() => ({}));

    const execution = await prisma.routineExecution.create({
      data: {
        routineId: id,
        notes: body.notes || null,
      },
    });

    return NextResponse.json(execution, { status: 201 });
  } catch (error: unknown) {
    return handlePrismaError(error, 'Rotina não encontrada');
  }
}
