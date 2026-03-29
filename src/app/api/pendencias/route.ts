import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiError, parseDate } from '@/lib/utils';
import type { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const where: Prisma.PendenciaWhereInput = {};

    const status = searchParams.get('status');
    if (status) where.status = status;

    const priority = searchParams.get('priority');
    if (priority) where.priority = priority;

    const [pendencias, statusCounts] = await Promise.all([
      prisma.pendencia.findMany({
        where,
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.pendencia.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    const counters = { pendente: 0, emAndamento: 0, concluida: 0, arquivada: 0 };
    for (const row of statusCounts) {
      if (row.status === 'Pendente') counters.pendente = row._count;
      else if (row.status === 'Em andamento') counters.emAndamento = row._count;
      else if (row.status === 'Concluida') counters.concluida = row._count;
      else if (row.status === 'Arquivada') counters.arquivada = row._count;
    }

    return NextResponse.json({ pendencias, counters });
  } catch (error) {
    console.error('Error fetching pendencias:', error);
    return apiError('Erro ao buscar pendências', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.title?.trim()) {
      return apiError('Campo title é obrigatório', 400);
    }

    const pendencia = await prisma.pendencia.create({
      data: {
        title: body.title.trim(),
        description: body.description || null,
        priority: body.priority || 'medium',
        status: body.status || 'Pendente',
        deadline: body.deadline ? (parseDate(body.deadline) ?? null) : null,
        observation: body.observation || null,
      },
    });

    return NextResponse.json(pendencia, { status: 201 });
  } catch (error) {
    console.error('Error creating pendencia:', error);
    return apiError('Erro ao criar pendência', 500);
  }
}
