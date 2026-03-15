import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiError } from '@/lib/utils';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  try {
    const participant = await prisma.participant.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.costCenter !== undefined && {
          costCenter: body.costCenter?.trim() || null,
        }),
        ...(body.role !== undefined && { role: body.role?.trim() || null }),
      },
    });
    return NextResponse.json(participant);
  } catch (error: unknown) {
    if (error instanceof Object && 'code' in error) {
      const prismaError = error as { code: string };
      if (prismaError.code === 'P2025') {
        return apiError('Participante não encontrado', 404);
      }
      if (prismaError.code === 'P2002') {
        return apiError('Participante com este nome já existe', 409, 'DUPLICATE_NAME');
      }
    }
    throw error;
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.participant.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (
      error instanceof Object &&
      'code' in error &&
      (error as { code: string }).code === 'P2025'
    ) {
      return apiError('Participante não encontrado', 404);
    }
    throw error;
  }
}
