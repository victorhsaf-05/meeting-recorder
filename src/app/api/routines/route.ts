import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiError } from '@/lib/utils';
import { addDays, isAfter, startOfDay } from 'date-fns';
import type { RoutineWithStatus, RoutineStatus, RoutineFrequency } from '@/lib/types';

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
    const routines = await prisma.routine.findMany({
      where: { active: true },
      include: {
        steps: { orderBy: { order: 'asc' } },
        executions: { orderBy: { executedAt: 'desc' }, take: 1 },
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
    });

    const today = startOfDay(new Date());

    const result: RoutineWithStatus[] = routines.map((r) => {
      const lastExec = r.executions[0]?.executedAt ?? null;

      // Get latest dependency execution date
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

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching routines:', error);
    return apiError('Erro ao buscar rotinas', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.title?.trim()) {
      return apiError('Campo title é obrigatório', 400);
    }

    const routine = await prisma.$transaction(async (tx) => {
      const created = await tx.routine.create({
        data: {
          title: body.title.trim(),
          description: body.description || null,
          filePath: body.filePath || null,
          frequency: body.frequency || 'daily',
          customDays: body.customDays ?? null,
          observation: body.observation || null,
        },
      });

      if (body.steps?.length) {
        await tx.routineStep.createMany({
          data: body.steps.map((s: { order: number; content: string }) => ({
            routineId: created.id,
            order: s.order,
            content: s.content,
          })),
        });
      }

      if (body.dependencyIds?.length) {
        await tx.routineDependency.createMany({
          data: body.dependencyIds.map((depId: string) => ({
            dependentId: created.id,
            dependencyId: depId,
          })),
        });
      }

      return tx.routine.findUnique({
        where: { id: created.id },
        include: {
          steps: { orderBy: { order: 'asc' } },
          dependsOn: { include: { dependency: { select: { id: true, title: true } } } },
        },
      });
    });

    return NextResponse.json(routine, { status: 201 });
  } catch (error) {
    console.error('Error creating routine:', error);
    return apiError('Erro ao criar rotina', 500);
  }
}
