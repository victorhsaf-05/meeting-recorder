import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiError, handlePrismaError } from '@/lib/utils';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  if (body.description !== undefined && !body.description?.trim()) {
    return apiError('Descrição não pode ser vazia', 400);
  }

  try {
    const solution = await prisma.solution.update({
      where: { id },
      data: {
        ...(body.description !== undefined && { description: body.description.trim() }),
      },
    });
    return NextResponse.json(solution);
  } catch (error: unknown) {
    return handlePrismaError(error, 'Solução não encontrada');
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.solution.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handlePrismaError(error, 'Solução não encontrada');
  }
}
