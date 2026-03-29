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
import type { PendenciaItem, PendenciaPriority, CreatePendenciaRequest } from '@/lib/types';

interface PendenciaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreatePendenciaRequest) => void;
  pendencia?: PendenciaItem | null;
  loading?: boolean;
}

function PendenciaFormInner({ onSubmit, pendencia, loading, onOpenChange }: Omit<PendenciaFormProps, 'open'>) {
  const [title, setTitle] = useState(pendencia?.title ?? '');
  const [description, setDescription] = useState(pendencia?.description ?? '');
  const [priority, setPriority] = useState<PendenciaPriority>(pendencia?.priority ?? 'medium');
  const [deadline, setDeadline] = useState(pendencia?.deadline ? pendencia.deadline.split('T')[0] : '');
  const [observation, setObservation] = useState(pendencia?.observation ?? '');

  function handleSubmit() {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description || undefined,
      priority,
      deadline: deadline || undefined,
      observation: observation || undefined,
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{pendencia ? 'Editar Pendencia' : 'Nova Pendencia'}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Titulo *</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titulo da pendencia" />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Descricao</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descricao opcional" className="min-h-16" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Prioridade</label>
            <Select value={priority} onValueChange={(v) => v && setPriority(v as PendenciaPriority)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Prazo</label>
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Observacao</label>
          <Textarea value={observation} onChange={(e) => setObservation(e.target.value)} placeholder="Nota opcional" className="min-h-16" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={loading || !title.trim()}>
          {loading ? 'Salvando...' : pendencia ? 'Salvar' : 'Criar'}
        </Button>
      </DialogFooter>
    </>
  );
}

export function PendenciaForm({ open, onOpenChange, onSubmit, pendencia, loading }: PendenciaFormProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && (
          <PendenciaFormInner
            key={pendencia?.id ?? 'new'}
            onSubmit={onSubmit}
            pendencia={pendencia}
            loading={loading}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
