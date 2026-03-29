'use client';

import { PriorityBadge } from '@/components/PriorityBadge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, Calendar } from 'lucide-react';
import type { PendenciaItem, PendenciaStatus } from '@/lib/types';

const STATUS_OPTIONS: PendenciaStatus[] = ['Pendente', 'Em andamento', 'Concluida', 'Arquivada'];

const STATUS_DOT: Record<PendenciaStatus, string> = {
  'Pendente': 'bg-amber-400',
  'Em andamento': 'bg-blue-400',
  'Concluida': 'bg-emerald-400',
  'Arquivada': 'bg-slate-400',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

interface PendenciaCardProps {
  pendencia: PendenciaItem;
  onStatusChange: (id: string, status: PendenciaStatus) => void;
}

export function PendenciaCard({ pendencia, onStatusChange }: PendenciaCardProps) {
  return (
    <div className="glass-card rounded-xl p-4 space-y-3 transition-all duration-200 hover:border-primary/20">
      {/* Top: priority + status */}
      <div className="flex items-center justify-between">
        <PriorityBadge priority={pendencia.priority} />
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${STATUS_DOT[pendencia.status]}`} />
          <Select
            value={pendencia.status}
            onValueChange={(v) => v && onStatusChange(pendencia.id, v as PendenciaStatus)}
          >
            <SelectTrigger size="sm" className="h-6 text-[11px] border-0 bg-transparent px-0 gap-1 w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Title + description */}
      <div>
        <h3 className="text-sm font-semibold">{pendencia.title}</h3>
        {pendencia.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{pendencia.description}</p>
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {pendencia.deadline && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Prazo: {formatDate(pendencia.deadline)}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {formatDate(pendencia.createdAt)}
        </span>
      </div>
    </div>
  );
}
