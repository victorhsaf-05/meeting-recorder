import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiError, parseDate } from '@/lib/utils';
import type { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const baseWhere: Prisma.TodoWhereInput = {};

    const responsible = searchParams.get('responsible');
    if (responsible) baseWhere.responsible = { contains: responsible, mode: 'insensitive' };

    const actionOwner = searchParams.get('actionOwner');
    if (actionOwner) baseWhere.actionOwner = { contains: actionOwner, mode: 'insensitive' };

    const costCenter = searchParams.get('costCenter');
    if (costCenter) baseWhere.costCenter = { contains: costCenter, mode: 'insensitive' };

    const account = searchParams.get('account');
    if (account) baseWhere.account = { contains: account, mode: 'insensitive' };

    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    if (dateFrom || dateTo) {
      baseWhere.meetingDate = {};
      if (dateFrom) {
        const d = parseDate(dateFrom);
        if (d) baseWhere.meetingDate.gte = d;
      }
      if (dateTo) {
        const d = parseDate(dateTo);
        if (d) baseWhere.meetingDate.lte = d;
      }
    }

    const todosWhere: Prisma.TodoWhereInput = { ...baseWhere };
    const status = searchParams.get('status');
    if (status) todosWhere.status = status;

    const [todos, statusCounts] = await Promise.all([
      prisma.todo.findMany({
        where: todosWhere,
        include: {
          meeting: { select: { id: true, title: true } },
          pain: {
            select: {
              description: true,
              solutions: { select: { description: true } },
            },
          },
        },
        orderBy: { meetingDate: 'desc' },
      }),
      prisma.todo.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: true,
      }),
    ]);

    const counters = { pendente: 0, emAndamento: 0, concluido: 0, cancelado: 0 };
    for (const row of statusCounts) {
      if (row.status === 'Pendente') counters.pendente = row._count;
      else if (row.status === 'Em andamento') counters.emAndamento = row._count;
      else if (row.status === 'Concluido') counters.concluido = row._count;
      else if (row.status === 'Cancelado') counters.cancelado = row._count;
    }

    return NextResponse.json({ todos, counters });
  } catch (error) {
    console.error('Error fetching todos:', error);
    return apiError('Erro ao buscar to-dos', 500);
  }
}

const MAX_BULK_SIZE = 100;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items = Array.isArray(body) ? body : [body];

    if (items.length > MAX_BULK_SIZE) {
      return apiError(`Máximo de ${MAX_BULK_SIZE} itens por requisição`, 400);
    }

    for (const item of items) {
      if (!item.action?.trim()) {
        return apiError('Campo action é obrigatório', 400);
      }
      if (!item.meetingId) {
        return apiError('Campo meetingId é obrigatório', 400);
      }
    }

    if (items.length === 1) {
      const t = items[0];
      const todo = await prisma.todo.create({
        data: {
          action: t.action,
          responsible: t.responsible || null,
          actionOwner: t.actionOwner || null,
          costCenter: t.costCenter || null,
          account: t.account || null,
          status: t.status || 'Pendente',
          meetingId: t.meetingId,
          painId: t.painId || null,
          meetingDate: parseDate(t.meetingDate) ?? new Date(),
          deadline: t.deadline ? (parseDate(t.deadline) ?? null) : null,
        },
      });
      return NextResponse.json(todo, { status: 201 });
    }

    const todos = await prisma.$transaction(
      items.map((t) =>
        prisma.todo.create({
          data: {
            action: t.action,
            responsible: t.responsible || null,
            actionOwner: t.actionOwner || null,
            costCenter: t.costCenter || null,
            account: t.account || null,
            status: t.status || 'Pendente',
            meetingId: t.meetingId,
            painId: t.painId || null,
            meetingDate: parseDate(t.meetingDate) ?? new Date(),
            deadline: t.deadline ? (parseDate(t.deadline) ?? null) : null,
          },
        })
      )
    );
    return NextResponse.json(todos, { status: 201 });
  } catch (error) {
    console.error('Error creating todos:', error);
    return apiError('Erro ao criar to-dos', 500);
  }
}
