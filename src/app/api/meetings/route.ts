import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiError } from '@/lib/utils';
import type { CreateMeetingRequest } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');

  const where = search
    ? { transcription: { contains: search, mode: 'insensitive' as const } }
    : {};

  const meetings = await prisma.meeting.findMany({
    where,
    select: {
      id: true,
      title: true,
      date: true,
      createdAt: true,
      _count: { select: { todos: true } },
    },
    orderBy: { date: 'desc' },
  });

  return NextResponse.json(meetings);
}

export async function POST(request: NextRequest) {
  const body: CreateMeetingRequest = await request.json();

  if (!body.transcription?.trim()) {
    return apiError('Transcrição é obrigatória', 400);
  }

  const meeting = await prisma.$transaction(async (tx) => {
    const meeting = await tx.meeting.create({
      data: {
        title: body.title,
        date: new Date(body.date),
        transcription: body.transcription,
        context: body.context,
      },
    });

    if (body.participantIds?.length > 0) {
      await tx.meetingParticipant.createMany({
        data: body.participantIds.map((pid) => ({
          meetingId: meeting.id,
          participantId: pid,
        })),
      });
    }

    for (const painData of body.pains || []) {
      const pain = await tx.pain.create({
        data: {
          description: painData.description,
          meetingId: meeting.id,
        },
      });

      if (painData.solutions?.length > 0) {
        await tx.solution.createMany({
          data: painData.solutions.map((s) => ({
            description: s,
            painId: pain.id,
          })),
        });
      }

      if (painData.todos?.length > 0) {
        await tx.todo.createMany({
          data: painData.todos.map((t) => ({
            action: t.action,
            responsible: t.responsible || null,
            actionOwner: t.actionOwner || null,
            costCenter: t.costCenter || null,
            account: t.account || null,
            status: t.status || 'Pendente',
            meetingId: meeting.id,
            painId: pain.id,
            meetingDate: new Date(t.meetingDate || body.date),
            deadline: t.deadline ? new Date(t.deadline) : null,
          })),
        });
      }
    }

    if (body.orphanTodos?.length) {
      await tx.todo.createMany({
        data: body.orphanTodos.map((t) => ({
          action: t.action,
          responsible: t.responsible || null,
          actionOwner: t.actionOwner || null,
          costCenter: t.costCenter || null,
          account: t.account || null,
          status: t.status || 'Pendente',
          meetingId: meeting.id,
          meetingDate: new Date(t.meetingDate || body.date),
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
}
