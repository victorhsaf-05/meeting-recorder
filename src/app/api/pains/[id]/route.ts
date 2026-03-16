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
    const pain = await prisma.pain.update({
      where: { id },
      data: {
        ...(body.description !== undefined && { description: body.description.trim() }),
      },
    });
    return NextResponse.json(pain);
  } catch (error: unknown) {
    return handlePrismaError(error, 'Dor não encontrada');
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.pain.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handlePrismaError(error, 'Dor não encontrada');
  }
}
