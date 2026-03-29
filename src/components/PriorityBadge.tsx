'use client';

import { Badge } from '@/components/ui/badge';
import type { PendenciaPriority } from '@/lib/types';

const PRIORITY_CONFIG: Record<PendenciaPriority, { label: string; className: string }> = {
  low: { label: 'Baixa', className: 'bg-slate-500/15 text-slate-400 border-slate-500/20' },
  medium: { label: 'Media', className: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  high: { label: 'Alta', className: 'bg-orange-500/15 text-orange-400 border-orange-500/20' },
  urgent: { label: 'Urgente', className: 'bg-red-500/15 text-red-400 border-red-500/20' },
};

interface PriorityBadgeProps {
  priority: PendenciaPriority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  );
}
