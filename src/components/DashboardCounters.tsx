'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { DashboardCounters as Counters } from '@/lib/types';

interface DashboardCountersProps {
  counters: Counters;
  activeStatus?: string;
  onStatusClick?: (status: string) => void;
}

const items = [
  {
    key: 'pendente' as const,
    label: 'Pendentes',
    status: 'Pendente',
    textColor: 'text-amber-400',
    glowClass: 'glow-yellow',
    ringClass: 'ring-amber-400/50',
  },
  {
    key: 'emAndamento' as const,
    label: 'Em andamento',
    status: 'Em andamento',
    textColor: 'text-blue-400',
    glowClass: 'glow-blue',
    ringClass: 'ring-blue-400/50',
  },
  {
    key: 'concluido' as const,
    label: 'Concluidos',
    status: 'Concluido',
    textColor: 'text-emerald-400',
    glowClass: 'glow-green',
    ringClass: 'ring-emerald-400/50',
  },
  {
    key: 'cancelado' as const,
    label: 'Cancelados',
    status: 'Cancelado',
    textColor: 'text-red-400',
    glowClass: 'glow-red',
    ringClass: 'ring-red-400/50',
  },
];

export function DashboardCounters({ counters, activeStatus, onStatusClick }: DashboardCountersProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {items.map((item) => {
        const isActive = activeStatus === item.status;
        return (
          <Card
            key={item.key}
            className={`glass-card ${item.glowClass} transition-all duration-300 hover:scale-[1.02] cursor-pointer ${isActive ? `ring-2 ${item.ringClass}` : ''}`}
            onClick={() => onStatusClick?.(isActive ? '' : item.status)}
          >
            <CardContent className="py-4">
              <p className={`text-2xl font-bold ${item.textColor}`}>{counters[item.key]}</p>
              <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
