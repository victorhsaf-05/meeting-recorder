import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiError, handlePrismaError } from '@/lib/utils';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const routine = await prisma.routine.findUnique({
      where: { id },
      include: {
        steps: { orderBy: { order: 'asc' } },
        executions: { orderBy: { executedAt: 'desc' } },
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
        dependedBy: {
          include: {
            dependent: { select: { id: true, title: true } },
          },
        },
      },
    });

    if (!routine) return apiError('Rotina não encontrada', 404);

    return NextResponse.json(routine);
  } catch (error) {
    console.error('Error fetching routine:', error);
    return apiError('Erro ao buscar rotina', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.routine.update({
        where: { id },
        data: {
          ...(body.title !== undefined && { title: body.title }),
          ...(body.description !== undefined && { description: body.description || null }),
          ...(body.filePath !== undefined && { filePath: body.filePath || null }),
          ...(body.frequency !== undefined && { frequency: body.frequency }),
          ...(body.customDays !== undefined && { customDays: body.customDays }),
          ...(body.observation !== undefined && { observation: body.observation || null }),
          ...(body.active !== undefined && { active: body.active }),
        },
      });

      // Replace steps if provided
      if (body.steps !== undefined) {
        await tx.routineStep.deleteMany({ where: { routineId: id } });
        if (body.steps.length) {
          await tx.routineStep.createMany({
            data: body.steps.map((s: { order: number; content: string }) => ({
              routineId: id,
              order: s.order,
              content: s.content,
            })),
          });
        }
      }

      // Replace dependencies if provided
      if (body.dependencyIds !== undefined) {
        await tx.routineDependency.deleteMany({ where: { dependentId: id } });
        if (body.dependencyIds.length) {
          await tx.routineDependency.createMany({
            data: body.dependencyIds.map((depId: string) => ({
              dependentId: id,
              dependencyId: depId,
            })),
          });
        }
      }

      return tx.routine.findUnique({
        where: { id },
        include: {
          steps: { orderBy: { order: 'asc' } },
          executions: { orderBy: { executedAt: 'desc' }, take: 1 },
          dependsOn: { include: { dependency: { select: { id: true, title: true } } } },
        },
      });
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    return handlePrismaError(error, 'Rotina não encontrada');
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.routine.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handlePrismaError(error, 'Rotina não encontrada');
  }
}
