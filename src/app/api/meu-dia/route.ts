import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiError } from '@/lib/utils';
import { addDays, isAfter, startOfDay, isSameDay } from 'date-fns';
import type { RoutineWithStatus, RoutineStatus, RoutineFrequency, MeuDiaCounters } from '@/lib/types';

function getIntervalDays(frequency: string, customDays: number | null): number {
  switch (frequency) {
    case 'daily': return 1;
    case 'weekly': return 7;
    case 'monthly': return 30;
    case 'custom': return customDays ?? 1;
    default: return 1;
  }
}

function computeStatus(
  frequency: string,
  customDays: number | null,
  lastExec: Date | null,
  depLastExec: Date | null,
  today: Date
): { status: RoutineStatus; nextDue: Date | null } {
  if (!lastExec) return { status: 'Pendente', nextDue: null };

  const intervalDays = getIntervalDays(frequency, customDays);
  const nextDue = addDays(startOfDay(lastExec), intervalDays);

  if (depLastExec && isAfter(depLastExec, lastExec)) {
    return { status: 'Desatualizada', nextDue };
  }

  if (isAfter(startOfDay(today), nextDue)) {
    return { status: 'Atrasada', nextDue };
  }

  return { status: 'OK', nextDue };
}

export async function GET() {
  try {
    const today = startOfDay(new Date());

    const [routines, pendencias, pendenciaCounts] = await Promise.all([
      prisma.routine.findMany({
        where: { active: true },
        include: {
          steps: { orderBy: { order: 'asc' } },
          executions: { orderBy: { executedAt: 'desc' }, take: 5 },
          dependsOn: {
            include: {
              dependency: {
                select: {
                  id: true,
                  title: true,
                  executions: { orderBy: { executedAt: 'desc' }, take: 1 },
                },
              },
            },
          },
        },
        orderBy: { title: 'asc' },
      }),
      prisma.pendencia.findMany({
        where: { status: { in: ['Pendente', 'Em andamento'] } },
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.pendencia.groupBy({
        by: ['status'],
        where: { status: { in: ['Pendente', 'Em andamento'] } },
        _count: true,
      }),
    ]);

    let concluidasHoje = 0;
    let atrasadas = 0;
    let desatualizadas = 0;

    const routinesWithStatus: RoutineWithStatus[] = routines.map((r) => {
      const lastExec = r.executions[0]?.executedAt ?? null;

      let depLastExec: Date | null = null;
      for (const dep of r.dependsOn) {
        const depExec = dep.dependency.executions[0]?.executedAt;
        if (depExec && (!depLastExec || isAfter(depExec, depLastExec))) {
          depLastExec = depExec;
        }
      }

      const { status, nextDue } = computeStatus(
        r.frequency, r.customDays, lastExec, depLastExec, today
      );

      if (lastExec && isSameDay(lastExec, today)) concluidasHoje++;
      if (status === 'Atrasada') atrasadas++;
      if (status === 'Desatualizada') desatualizadas++;

      return {
        id: r.id,
        title: r.title,
        description: r.description,
        filePath: r.filePath,
        frequency: r.frequency as RoutineFrequency,
        customDays: r.customDays,
        observation: r.observation,
        active: r.active,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        steps: r.steps.map((s) => ({ id: s.id, order: s.order, content: s.content })),
        executions: r.executions.map((e) => ({
          id: e.id,
          executedAt: e.executedAt.toISOString(),
          notes: e.notes,
        })),
        dependsOn: r.dependsOn.map((d) => ({
          id: d.id,
          dependencyId: d.dependencyId,
          dependency: { id: d.dependency.id, title: d.dependency.title },
        })),
        status,
        lastExecution: lastExec?.toISOString() ?? null,
        nextDue: nextDue?.toISOString() ?? null,
      };
    });

    // Filter only routines that need action
    const actionNeeded = routinesWithStatus.filter((r) => r.status !== 'OK');

    let pendenciasPendentes = 0;
    let pendenciasAndamento = 0;
    for (const row of pendenciaCounts) {
      if (row.status === 'Pendente') pendenciasPendentes = row._count;
      else if (row.status === 'Em andamento') pendenciasAndamento = row._count;
    }

    const counters: MeuDiaCounters = {
      totalRotinas: routines.length,
      concluidasHoje,
      atrasadas,
      desatualizadas,
      pendenciasPendentes,
      pendenciasAndamento,
    };

    return NextResponse.json({ routines: actionNeeded, pendencias, counters });
  } catch (error) {
    console.error('Error fetching meu dia:', error);
    return apiError('Erro ao buscar dados do dia', 500);
  }
}
