import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiError } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.description?.trim()) {
    return apiError('Descrição é obrigatória', 400);
  }
  if (!body.meetingId) {
    return apiError('meetingId é obrigatório', 400);
  }

  const pain = await prisma.pain.create({
    data: {
      description: body.description.trim(),
      meetingId: body.meetingId,
    },
  });

  return NextResponse.json(pain, { status: 201 });
}
