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
    const todo = await prisma.todo.update({
      where: { id },
      data: {
        ...(body.action !== undefined && { action: body.action }),
        ...(body.responsible !== undefined && { responsible: body.responsible || null }),
        ...(body.actionOwner !== undefined && { actionOwner: body.actionOwner || null }),
        ...(body.costCenter !== undefined && { costCenter: body.costCenter || null }),
        ...(body.account !== undefined && { account: body.account || null }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.deadline !== undefined && {
          deadline: body.deadline ? (parseDate(body.deadline) ?? null) : null,
        }),
      },
    });
    return NextResponse.json(todo);
  } catch (error: unknown) {
    return handlePrismaError(error, 'To-do não encontrado');
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.todo.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handlePrismaError(error, 'To-do não encontrado');
  }
}
