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
import { Textarea } from '@/components/ui/textarea';

interface ExecuteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routineTitle: string;
  onConfirm: (notes: string) => void;
  loading?: boolean;
}

export function ExecuteDialog({ open, onOpenChange, routineTitle, onConfirm, loading }: ExecuteDialogProps) {
  const [notes, setNotes] = useState('');

  function handleConfirm() {
    onConfirm(notes);
    setNotes('');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Executar Rotina</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Confirmar execucao de <span className="font-medium text-foreground">{routineTitle}</span>?
          </p>
          <Textarea
            placeholder="Notas opcionais..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-20"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? 'Executando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
