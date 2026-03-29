-- CreateTable
CREATE TABLE "Routine" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "filePath" TEXT,
    "frequency" TEXT NOT NULL DEFAULT 'daily',
    "customDays" INTEGER,
    "observation" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Routine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineStep" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "RoutineStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineExecution" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "RoutineExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineDependency" (
    "id" TEXT NOT NULL,
    "dependentId" TEXT NOT NULL,
    "dependencyId" TEXT NOT NULL,

    CONSTRAINT "RoutineDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pendencia" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'Pendente',
    "deadline" TIMESTAMP(3),
    "observation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pendencia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Routine_active_idx" ON "Routine"("active");

-- CreateIndex
CREATE INDEX "RoutineStep_routineId_idx" ON "RoutineStep"("routineId");

-- CreateIndex
CREATE INDEX "RoutineExecution_routineId_idx" ON "RoutineExecution"("routineId");

-- CreateIndex
CREATE INDEX "RoutineExecution_executedAt_idx" ON "RoutineExecution"("executedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RoutineDependency_dependentId_dependencyId_key" ON "RoutineDependency"("dependentId", "dependencyId");

-- CreateIndex
CREATE INDEX "Pendencia_status_idx" ON "Pendencia"("status");

-- CreateIndex
CREATE INDEX "Pendencia_priority_idx" ON "Pendencia"("priority");

-- AddForeignKey
ALTER TABLE "RoutineStep" ADD CONSTRAINT "RoutineStep_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineExecution" ADD CONSTRAINT "RoutineExecution_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineDependency" ADD CONSTRAINT "RoutineDependency_dependentId_fkey" FOREIGN KEY ("dependentId") REFERENCES "Routine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineDependency" ADD CONSTRAINT "RoutineDependency_dependencyId_fkey" FOREIGN KEY ("dependencyId") REFERENCES "Routine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
