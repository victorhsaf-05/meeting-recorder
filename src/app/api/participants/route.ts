import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiError } from '@/lib/utils';

export async function GET() {
  const participants = await prisma.participant.findMany({
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(participants);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.name?.trim()) {
    return apiError('Nome é obrigatório', 400);
  }

  try {
    const participant = await prisma.participant.create({
      data: {
        name: body.name.trim(),
        costCenter: body.costCenter?.trim() || null,
        role: body.role?.trim() || null,
      },
    });
    return NextResponse.json(participant, { status: 201 });
  } catch (error: unknown) {
    if (
      error instanceof Object &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return apiError('Participante com este nome já existe', 409, 'DUPLICATE_NAME');
    }
    throw error;
  }
}
