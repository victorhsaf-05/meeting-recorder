'use client';

import { useState } from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, ChevronDown, ChevronUp, FolderOpen, Clock } from 'lucide-react';
import type { RoutineWithStatus } from '@/lib/types';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Nunca';
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const FREQ_LABELS: Record<string, string> = {
  daily: 'Diaria',
  weekly: 'Semanal',
  monthly: 'Mensal',
  custom: 'Personalizada',
};

interface RoutineDayCardProps {
  routine: RoutineWithStatus;
  onExecute: (routine: RoutineWithStatus) => void;
}

export function RoutineDayCard({ routine, onExecute }: RoutineDayCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass-card rounded-xl p-4 space-y-3 transition-all duration-200 hover:border-primary/20">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={routine.status} />
            <Badge variant="outline" className="text-[10px]">
              {FREQ_LABELS[routine.frequency] ?? routine.frequency}
            </Badge>
          </div>
          <h3 className="text-sm font-semibold truncate">{routine.title}</h3>
        </div>
        <Button size="sm" onClick={() => onExecute(routine)} className="shrink-0">
          <Play className="h-3.5 w-3.5 mr-1" />
          Executar
        </Button>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        {routine.filePath && (
          <span className="flex items-center gap-1 truncate max-w-[200px]" title={routine.filePath}>
            <FolderOpen className="h-3 w-3 shrink-0" />
            {routine.filePath}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span className="font-mono tabular-nums">{formatDate(routine.lastExecution)}</span>
        </span>
      </div>

      {/* Dependencies info */}
      {routine.dependsOn.length > 0 && (
        <div className="text-[11px] text-muted-foreground">
          Depende de: {routine.dependsOn.map((d) => d.dependency.title).join(', ')}
        </div>
      )}

      {/* Steps toggle */}
      {routine.steps.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 transition-colors"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {routine.steps.length} passo{routine.steps.length > 1 ? 's' : ''}
          </button>
          {expanded && (
            <ol className="space-y-1 pl-4 text-xs text-muted-foreground list-decimal">
              {routine.steps.map((step) => (
                <li key={step.id}>{step.content}</li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}
