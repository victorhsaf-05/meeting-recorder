import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handlePrismaError, parseDate } from '@/lib/utils';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  try {
    const pendencia = await prisma.pendencia.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.observation !== undefined && { observation: body.observation || null }),
        ...(body.deadline !== undefined && {
          deadline: body.deadline ? (parseDate(body.deadline) ?? null) : null,
        }),
      },
    });
    return NextResponse.json(pendencia);
  } catch (error: unknown) {
    return handlePrismaError(error, 'Pendência não encontrada');
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.pendencia.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handlePrismaError(error, 'Pendência não encontrada');
  }
}
