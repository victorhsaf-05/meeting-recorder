'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { ExecuteDialog } from '@/components/ExecuteDialog';
import { RoutineForm } from '@/components/RoutineForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Play,
  Pencil,
  Trash2,
  FolderOpen,
  Copy,
  Clock,
  Link2,
  ChevronRight,
} from 'lucide-react';
import { addDays, isAfter, startOfDay } from 'date-fns';
import type { RoutineWithStatus, RoutineStatus, RoutineFrequency, CreateRoutineRequest, RoutineExecutionItem } from '@/lib/types';

function getIntervalDays(frequency: string, customDays: number | null): number {
  switch (frequency) {
    case 'daily': return 1;
    case 'weekly': return 7;
    case 'monthly': return 30;
    case 'custom': return customDays ?? 1;
    default: return 1;
  }
}

const FREQ_LABELS: Record<string, string> = {
  daily: 'Diaria',
  weekly: 'Semanal',
  monthly: 'Mensal',
  custom: 'Personalizada',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface FullRoutine {
  id: string;
  title: string;
  description: string | null;
  filePath: string | null;
  frequency: string;
  customDays: number | null;
  observation: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  steps: { id: string; order: number; content: string }[];
  executions: { id: string; executedAt: string; notes: string | null }[];
  dependsOn: { id: string; dependencyId: string; dependency: { id: string; title: string; executions: { executedAt: string }[] } }[];
  dependedBy: { id: string; dependent: { id: string; title: string } }[];
}

export default function RotinaDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [routine, setRoutine] = useState<FullRoutine | null>(null);
  const [allRoutines, setAllRoutines] = useState<RoutineWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [executeOpen, setExecuteOpen] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchRoutine = useCallback(() => {
    fetch(`/api/routines/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setRoutine(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    fetchRoutine();
    fetch('/api/routines')
      .then((res) => res.json())
      .then(setAllRoutines)
      .catch(() => {});
  }, [fetchRoutine]);

  function computeStatus(): RoutineStatus {
    if (!routine) return 'Pendente';
    const lastExec = routine.executions[0]?.executedAt ? new Date(routine.executions[0].executedAt) : null;
    if (!lastExec) return 'Pendente';

    const today = startOfDay(new Date());
    const intervalDays = getIntervalDays(routine.frequency, routine.customDays);
    const nextDue = addDays(startOfDay(lastExec), intervalDays);

    let depLastExec: Date | null = null;
    for (const dep of routine.dependsOn) {
      const depExec = dep.dependency.executions[0]?.executedAt;
      if (depExec) {
        const d = new Date(depExec);
        if (!depLastExec || isAfter(d, depLastExec)) depLastExec = d;
      }
    }

    if (depLastExec && isAfter(depLastExec, lastExec)) return 'Desatualizada';
    if (isAfter(startOfDay(today), nextDue)) return 'Atrasada';
    return 'OK';
  }

  async function handleExecute(notes: string) {
    setExecuting(true);
    try {
      await fetch(`/api/routines/${params.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      setExecuteOpen(false);
      fetchRoutine();
    } finally {
      setExecuting(false);
    }
  }

  async function handleEdit(data: CreateRoutineRequest) {
    setSaving(true);
    try {
      await fetch(`/api/routines/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setEditOpen(false);
      fetchRoutine();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    await fetch(`/api/routines/${params.id}`, { method: 'DELETE' });
    router.push('/rotinas');
  }

  function copyPath() {
    if (routine?.filePath) {
      navigator.clipboard.writeText(routine.filePath);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-3">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando rotina...</p>
        </div>
      </div>
    );
  }

  if (!routine) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <p className="text-sm text-muted-foreground">Rotina nao encontrada.</p>
        <Button variant="outline" onClick={() => router.push('/rotinas')}>Voltar</Button>
      </div>
    );
  }

  const status = computeStatus();
  const editRoutine: RoutineWithStatus = {
    ...routine,
    frequency: routine.frequency as RoutineFrequency,
    status,
    lastExecution: routine.executions[0]?.executedAt ?? null,
    nextDue: null,
    dependsOn: routine.dependsOn.map((d) => ({
      id: d.id,
      dependencyId: d.dependencyId,
      dependency: { id: d.dependency.id, title: d.dependency.title },
    })),
    executions: routine.executions as RoutineExecutionItem[],
    steps: routine.steps,
  };

  return (
    <div className="space-y-8">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/rotinas')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5 mr-1" />
            Editar
          </Button>
          <Button size="sm" onClick={() => setExecuteOpen(true)}>
            <Play className="h-3.5 w-3.5 mr-1" />
            Executar
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Header card */}
      <div className="glass-card rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          <Badge variant="outline" className="text-[10px]">
            {FREQ_LABELS[routine.frequency] ?? routine.frequency}
          </Badge>
        </div>
        <h1 className="text-xl font-bold">{routine.title}</h1>
        {routine.description && (
          <p className="text-sm text-muted-foreground">{routine.description}</p>
        )}
        {routine.filePath && (
          <div className="flex items-center gap-2 text-sm">
            <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground truncate" title={routine.filePath}>{routine.filePath}</span>
            <button onClick={copyPath} className="text-primary hover:text-primary/80 shrink-0">
              <Copy className="h-3.5 w-3.5" />
            </button>
            {copied && <span className="text-[10px] text-emerald-400">Copiado!</span>}
          </div>
        )}
      </div>

      {/* Steps */}
      {routine.steps.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground/70">
            Passos ({routine.steps.length})
          </h2>
          <div className="glass-card rounded-xl p-4">
            <ol className="space-y-2 list-decimal list-inside">
              {routine.steps.map((step) => (
                <li key={step.id} className="text-sm">{step.content}</li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* Dependencies */}
      {(routine.dependsOn.length > 0 || routine.dependedBy.length > 0) && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground/70">
            Dependencias
          </h2>
          <div className="glass-card rounded-xl p-4 space-y-3">
            {routine.dependsOn.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Depende de:</p>
                <div className="space-y-1.5">
                  {routine.dependsOn.map((dep) => (
                    <button
                      key={dep.id}
                      onClick={() => router.push(`/rotinas/${dep.dependency.id}`)}
                      className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      {dep.dependency.title}
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {routine.dependedBy.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Dependentes:</p>
                <div className="space-y-1.5">
                  {routine.dependedBy.map((dep) => (
                    <button
                      key={dep.id}
                      onClick={() => router.push(`/rotinas/${dep.dependent.id}`)}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      {dep.dependent.title}
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Observation */}
      {routine.observation && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground/70">
            Observacao
          </h2>
          <div className="glass-card rounded-xl p-4">
            <p className="text-sm whitespace-pre-wrap">{routine.observation}</p>
          </div>
        </div>
      )}

      {/* Execution history */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground/70">
          Historico de Execucoes ({routine.executions.length})
        </h2>
        {routine.executions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma execucao registrada.</p>
        ) : (
          <div className="space-y-2">
            {routine.executions.map((exec) => (
              <div key={exec.id} className="glass-card rounded-xl px-4 py-3 flex items-start gap-3">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{formatDate(exec.executedAt)}</p>
                  {exec.notes && <p className="text-xs text-muted-foreground mt-1">{exec.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ExecuteDialog
        open={executeOpen}
        onOpenChange={setExecuteOpen}
        routineTitle={routine.title}
        onConfirm={handleExecute}
        loading={executing}
      />
      <RoutineForm
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleEdit}
        routine={editRoutine}
        allRoutines={allRoutines}
        loading={saving}
      />
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir Rotina</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir <span className="font-medium text-foreground">{routine.title}</span>? Essa acao nao pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
