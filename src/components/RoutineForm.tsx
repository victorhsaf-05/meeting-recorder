'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { RoutineFrequency, RoutineWithStatus, CreateRoutineRequest } from '@/lib/types';

interface RoutineFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateRoutineRequest) => void;
  routine?: RoutineWithStatus | null;
  allRoutines?: RoutineWithStatus[];
  loading?: boolean;
}

function RoutineFormInner({ onSubmit, routine, allRoutines = [], loading, onOpenChange }: Omit<RoutineFormProps, 'open'>) {
  const [title, setTitle] = useState(routine?.title ?? '');
  const [description, setDescription] = useState(routine?.description ?? '');
  const [filePath, setFilePath] = useState(routine?.filePath ?? '');
  const [frequency, setFrequency] = useState<RoutineFrequency>(routine?.frequency ?? 'daily');
  const [customDays, setCustomDays] = useState(routine?.customDays?.toString() ?? '');
  const [observation, setObservation] = useState(routine?.observation ?? '');
  const [steps, setSteps] = useState<{ content: string }[]>(routine?.steps.map((s) => ({ content: s.content })) ?? []);
  const [dependencyIds, setDependencyIds] = useState<string[]>(routine?.dependsOn.map((d) => d.dependencyId) ?? []);

  function handleSubmit() {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description || undefined,
      filePath: filePath || undefined,
      frequency,
      customDays: frequency === 'custom' ? parseInt(customDays) || undefined : undefined,
      observation: observation || undefined,
      steps: steps.filter((s) => s.content.trim()).map((s, i) => ({ order: i + 1, content: s.content.trim() })),
      dependencyIds: dependencyIds.length > 0 ? dependencyIds : undefined,
    });
  }

  function addStep() {
    setSteps([...steps, { content: '' }]);
  }

  function removeStep(index: number) {
    setSteps(steps.filter((_, i) => i !== index));
  }

  function updateStep(index: number, content: string) {
    const updated = [...steps];
    updated[index] = { content };
    setSteps(updated);
  }

  function toggleDependency(id: string) {
    setDependencyIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  }

  const availableDeps = allRoutines.filter((r) => r.id !== routine?.id);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{routine ? 'Editar Rotina' : 'Nova Rotina'}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Titulo *</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome da rotina" />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Descricao</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descricao opcional" className="min-h-16" />
        </div>

        {/* File path */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Caminho do Arquivo</label>
          <Input value={filePath} onChange={(e) => setFilePath(e.target.value)} placeholder="Ex: R:\pasta\arquivo.xlsx" />
        </div>

        {/* Frequency */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Frequencia</label>
            <Select value={frequency} onValueChange={(v) => v && setFrequency(v as RoutineFrequency)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diaria</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="custom">Personalizada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {frequency === 'custom' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Dias</label>
              <Input type="number" value={customDays} onChange={(e) => setCustomDays(e.target.value)} placeholder="Ex: 3" min="1" />
            </div>
          )}
        </div>

        {/* Observation */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Observacao</label>
          <Textarea value={observation} onChange={(e) => setObservation(e.target.value)} placeholder="Nota permanente" className="min-h-16" />
        </div>

        {/* Steps */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">Passos</label>
            <Button variant="ghost" size="xs" onClick={addStep}>
              <Plus className="h-3 w-3 mr-1" />
              Adicionar
            </Button>
          </div>
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}.</span>
              <Input
                value={step.content}
                onChange={(e) => updateStep(i, e.target.value)}
                placeholder={`Passo ${i + 1}`}
                className="flex-1"
              />
              <Button variant="ghost" size="icon-xs" onClick={() => removeStep(i)}>
                <Trash2 className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>

        {/* Dependencies */}
        {availableDeps.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Dependencias</label>
            <div className="flex flex-wrap gap-2">
              {availableDeps.map((r) => (
                <button
                  key={r.id}
                  onClick={() => toggleDependency(r.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                    dependencyIds.includes(r.id)
                      ? 'bg-primary/15 text-primary border-primary/30'
                      : 'bg-muted/50 text-muted-foreground border-border/50 hover:border-primary/20'
                  }`}
                >
                  {r.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={loading || !title.trim()}>
          {loading ? 'Salvando...' : routine ? 'Salvar' : 'Criar'}
        </Button>
      </DialogFooter>
    </>
  );
}

export function RoutineForm({ open, onOpenChange, onSubmit, routine, allRoutines = [], loading }: RoutineFormProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        {open && (
          <RoutineFormInner
            key={routine?.id ?? 'new'}
            onSubmit={onSubmit}
            routine={routine}
            allRoutines={allRoutines}
            loading={loading}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
