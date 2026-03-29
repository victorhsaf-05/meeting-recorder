'use client';

import { Badge } from '@/components/ui/badge';
import type { RoutineStatus } from '@/lib/types';

const STATUS_CONFIG: Record<RoutineStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  'OK': { variant: 'default', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  'Pendente': { variant: 'secondary', className: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  'Atrasada': { variant: 'destructive', className: 'bg-red-500/15 text-red-400 border-red-500/20' },
  'Desatualizada': { variant: 'outline', className: 'bg-orange-500/15 text-orange-400 border-orange-500/20' },
};

interface StatusBadgeProps {
  status: RoutineStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  return (
    <Badge variant={cfg.variant} className={cfg.className}>
      {status}
    </Badge>
  );
}
