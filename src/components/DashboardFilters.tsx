'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import type { DashboardFiltersState } from '@/lib/types';

interface DashboardFiltersProps {
  filters: DashboardFiltersState;
  onChange: (filters: DashboardFiltersState) => void;
  onApply: () => void;
  onClear: () => void;
  costCenters?: string[];
}

export function DashboardFilters({ filters, onChange, onApply, onClear, costCenters = [] }: DashboardFiltersProps) {
  const update = (field: keyof DashboardFiltersState, value: string) => {
    onChange({ ...filters, [field]: value });
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Responsável</label>
          <Input
            placeholder="Filtrar responsável..."
            value={filters.responsible}
            onChange={(e) => update('responsible', e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Resp. pela ação</label>
          <Input
            placeholder="Filtrar resp. ação..."
            value={filters.actionOwner}
            onChange={(e) => update('actionOwner', e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Centro de custo</label>
          <Select
            value={filters.costCenter || undefined}
            onValueChange={(v) => v && update('costCenter', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              {costCenters.map((cc) => (
                <SelectItem key={cc} value={cc}>
                  {cc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Conta</label>
          <Input
            placeholder="Filtrar conta..."
            value={filters.account}
            onChange={(e) => update('account', e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <Select
            value={filters.status || undefined}
            onValueChange={(v) => v && update('status', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Em andamento">Em andamento</SelectItem>
              <SelectItem value="Concluido">Concluído</SelectItem>
              <SelectItem value="Cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">De</label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => update('dateFrom', e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Até</label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => update('dateTo', e.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={onApply}>Aplicar Filtros</Button>
        <Button size="sm" variant="outline" onClick={onClear}>Limpar</Button>
      </div>
    </div>
  );
}
