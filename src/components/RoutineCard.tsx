'use client';

import Link from 'next/link';
import { StatusBadge } from '@/components/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Clock, ChevronRight } from 'lucide-react';
import type { RoutineWithStatus } from '@/lib/types';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Nunca';
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

const FREQ_LABELS: Record<string, string> = {
  daily: 'Diaria',
  weekly: 'Semanal',
  monthly: 'Mensal',
  custom: 'Personalizada',
};

interface RoutineCardProps {
  routine: RoutineWithStatus;
}

export function RoutineCard({ routine }: RoutineCardProps) {
  return (
    <Link href={`/rotinas/${routine.id}`} className="block group">
      <div className="glass-card flex items-center gap-4 rounded-xl px-4 py-3.5 transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <StatusBadge status={routine.status} />
            <Badge variant="outline" className="text-[10px]">
              {FREQ_LABELS[routine.frequency] ?? routine.frequency}
            </Badge>
          </div>
          <h3 className="text-sm font-semibold truncate">{routine.title}</h3>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            Ultima: {formatDate(routine.lastExecution)}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
      </div>
    </Link>
  );
}
