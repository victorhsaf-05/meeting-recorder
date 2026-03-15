'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { DashboardCounters as Counters } from '@/lib/types';

interface DashboardCountersProps {
  counters: Counters;
}

const items = [
  { key: 'pendente' as const, label: 'Pendentes', color: 'text-yellow-600 bg-yellow-50' },
  { key: 'emAndamento' as const, label: 'Em andamento', color: 'text-blue-600 bg-blue-50' },
  { key: 'concluido' as const, label: 'Concluídos', color: 'text-green-600 bg-green-50' },
  { key: 'cancelado' as const, label: 'Cancelados', color: 'text-red-600 bg-red-50' },
];

export function DashboardCounters({ counters }: DashboardCountersProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {items.map((item) => (
        <Card key={item.key} className={item.color}>
          <CardContent className="py-4">
            <p className="text-2xl font-bold">{counters[item.key]}</p>
            <p className="text-sm font-medium">{item.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
