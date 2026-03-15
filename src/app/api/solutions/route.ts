import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiError } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.description?.trim()) {
    return apiError('Descrição é obrigatória', 400);
  }
  if (!body.painId) {
    return apiError('painId é obrigatório', 400);
  }

  const solution = await prisma.solution.create({
    data: {
      description: body.description.trim(),
      painId: body.painId,
    },
  });

  return NextResponse.json(solution, { status: 201 });
}
