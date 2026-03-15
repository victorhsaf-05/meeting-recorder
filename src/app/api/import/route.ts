import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiError } from '@/lib/utils';
import type { ImportExcelRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
  const body: ImportExcelRequest = await request.json();

  if (!body.title?.trim()) {
    return apiError('Título é obrigatório', 400);
  }

  if (!body.date) {
    return apiError('Data é obrigatória', 400);
  }

  if (!body.todos?.length) {
    return apiError('Nenhum to-do para importar', 400);
  }

  const hasAction = body.todos.some((t) => t.action?.trim());
  if (!hasAction) {
    return apiError('Pelo menos um to-do deve ter uma ação', 400);
  }

  try {
    const meeting = await prisma.$transaction(async (tx) => {
      // Extract unique names from responsible and actionOwner
      const uniqueNames = [
        ...new Set([
          ...body.todos.map((t) => t.responsible).filter(Boolean),
          ...body.todos.map((t) => t.actionOwner).filter(Boolean),
        ]),
      ] as string[];

      // Upsert participants
      const participants = [];
      for (const name of uniqueNames) {
        const participant = await tx.participant.upsert({
          where: { name },
          update: {},
          create: { name },
        });
        participants.push(participant);
      }

      // Create meeting
      const meeting = await tx.meeting.create({
        data: {
          title: body.title,
          date: new Date(body.date),
        },
      });

      // Create meeting-participant links
      if (participants.length > 0) {
        await tx.meetingParticipant.createMany({
          data: participants.map((p) => ({
            meetingId: meeting.id,
            participantId: p.id,
          })),
        });
      }

      // Create todos (respecting status from spreadsheet)
      const validTodos = body.todos.filter((t) => t.action?.trim());
      if (validTodos.length > 0) {
        await tx.todo.createMany({
          data: validTodos.map((t) => ({
            action: t.action,
            responsible: t.responsible || null,
            actionOwner: t.actionOwner || null,
            costCenter: t.costCenter || null,
            account: t.account || null,
            status: t.status || 'Pendente',
            meetingId: meeting.id,
            meetingDate: t.meetingDate
              ? new Date(t.meetingDate)
              : new Date(body.date),
            deadline: t.deadline ? new Date(t.deadline) : null,
          })),
        });
      }

      return meeting;
    });

    const full = await prisma.meeting.findUnique({
      where: { id: meeting.id },
      include: {
        pains: { include: { solutions: true } },
        todos: true,
        participants: { include: { participant: true } },
      },
    });

    return NextResponse.json(full, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Erro ao importar';
    return apiError(message, 500);
  }
}
