'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { MeuDiaCounters } from '@/lib/types';

interface RoutineCountersProps {
  counters: MeuDiaCounters;
}

const items = [
  { key: 'totalRotinas' as const, label: 'Total Rotinas', textColor: 'text-blue-400', glowClass: 'glow-blue' },
  { key: 'concluidasHoje' as const, label: 'Concluidas Hoje', textColor: 'text-emerald-400', glowClass: 'glow-green' },
  { key: 'atrasadas' as const, label: 'Atrasadas', textColor: 'text-red-400', glowClass: 'glow-red' },
  { key: 'desatualizadas' as const, label: 'Desatualizadas', textColor: 'text-amber-400', glowClass: 'glow-yellow' },
];

export function RoutineCounters({ counters }: RoutineCountersProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {items.map((item) => (
        <Card key={item.key} className={`glass-card ${item.glowClass} transition-all duration-300 hover:scale-[1.02]`}>
          <CardContent className="py-4">
            <p className={`text-2xl font-bold ${item.textColor}`}>{counters[item.key]}</p>
            <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
