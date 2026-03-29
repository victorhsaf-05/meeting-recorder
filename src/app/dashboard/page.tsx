'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { ExcelExport } from '@/components/ExcelExport';
import { ExcelImport } from '@/components/ExcelImport';
import { DashboardCounters } from '@/components/DashboardCounters';
import { DashboardFilters } from '@/components/DashboardFilters';
import { TodoCardList } from '@/components/TodoCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { MeetingLink } from '@/components/TodoTable';
import type { PainDetail } from '@/components/TodoTable';
import type {
  DashboardFiltersState,
  DashboardCounters as Counters,
  EditableTodo,
  TodoStatus,
  Participant,
} from '@/lib/types';

interface DashboardTodo {
  id: string;
  action: string;
  responsible: string | null;
  actionOwner: string | null;
  costCenter: string | null;
  account: string | null;
  deadline: string | null;
  meetingDate: string;
  status: string;
  painId: string | null;
  meeting: { id: string; title: string | null };
  pain: { description: string; solutions: { description: string }[] } | null;
}

const emptyFilters: DashboardFiltersState = {
  costCenter: '',
  responsible: '',
  actionOwner: '',
  status: '',
  dateFrom: '',
  dateTo: '',
  account: '',
};

export default function DashboardPage() {
  const [filters, setFilters] = useState<DashboardFiltersState>(emptyFilters);
  const [counters, setCounters] = useState<Counters>({
    pendente: 0,
    emAndamento: 0,
    concluido: 0,
    cancelado: 0,
  });
  const [todos, setTodos] = useState<EditableTodo[]>([]);
  const [meetingLinks, setMeetingLinks] = useState<Record<string, MeetingLink>>({});
  const [painDetails, setPainDetails] = useState<Record<string, PainDetail>>({});
  const [costCenters, setCostCenters] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const fetchData = useCallback((f: DashboardFiltersState) => {
    const params = new URLSearchParams();
    if (f.responsible) params.set('responsible', f.responsible);
    if (f.actionOwner) params.set('actionOwner', f.actionOwner);
    if (f.costCenter) params.set('costCenter', f.costCenter);
    if (f.account) params.set('account', f.account);
    if (f.status) params.set('status', f.status);
    if (f.dateFrom) params.set('dateFrom', f.dateFrom);
    if (f.dateTo) params.set('dateTo', f.dateTo);

    const qs = params.toString();
    fetch(`/api/todos${qs ? `?${qs}` : ''}`)
      .then((res) => res.json())
      .then((data: { todos: DashboardTodo[]; counters: Counters }) => {
        setCounters(data.counters);

        const links: Record<string, MeetingLink> = {};
        const pains: Record<string, PainDetail> = {};
        const editableTodos: EditableTodo[] = data.todos.map((t) => {
          links[t.id] = t.meeting;
          if (t.painId && t.pain) {
            pains[t.painId] = {
              description: t.pain.description,
              solutions: t.pain.solutions || [],
            };
          }
          return {
            tempId: t.id,
            action: t.action,
            responsible: t.responsible || '',
            actionOwner: t.actionOwner || '',
            costCenter: t.costCenter || '',
            account: t.account || '',
            deadline: t.deadline ? t.deadline.split('T')[0] : '',
            status: t.status as TodoStatus,
            painTempId: t.painId,
            meetingDate: t.meetingDate ? t.meetingDate.split('T')[0] : '',
          };
        });
        setTodos(editableTodos);
        setMeetingLinks(links);
        setPainDetails(pains);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData(emptyFilters);
    fetch('/api/participants')
      .then((res) => res.json())
      .then((data: Participant[]) => {
        const uniqueCCs = [...new Set(
          data.map((p) => p.costCenter).filter((cc): cc is string => !!cc)
        )];
        setCostCenters(uniqueCCs);
      })
      .catch(() => {});
  }, [fetchData]);

  const handleApply = useCallback(() => {
    setLoading(true);
    fetchData(filters);
  }, [filters, fetchData]);

  const handleClear = useCallback(() => {
    setFilters(emptyFilters);
    setLoading(true);
    fetchData(emptyFilters);
  }, [fetchData]);

  const handleUpdateTodo = useCallback(
    (tempId: string, field: keyof EditableTodo, value: string) => {
      setTodos((prev) =>
        prev.map((t) => (t.tempId === tempId ? { ...t, [field]: value } : t))
      );
      fetch(`/api/todos/${tempId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
    },
    []
  );

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between animate-fade-in">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Visao geral de todos os to-dos das suas reunioes.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <ExcelExport
            todos={todos}
            filename={`todos-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}`}
          />
          <ExcelImport onImported={() => { setLoading(true); fetchData(filters); }} />
        </div>
      </div>

      {/* Counters */}
      <DashboardCounters
        counters={counters}
        activeStatus={filters.status}
        onStatusClick={(status) => {
          const newFilters = { ...filters, status };
          setFilters(newFilters);
          setLoading(true);
          fetchData(newFilters);
        }}
      />

      {/* Filters section — collapsible */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-muted-foreground/70 hover:text-foreground transition-colors"
        >
          Filtros
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
        </button>
        {filtersOpen && (
          <DashboardFilters
            filters={filters}
            onChange={setFilters}
            onApply={handleApply}
            onClear={handleClear}
            costCenters={costCenters}
          />
        )}
      </div>

      {/* Todos section */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground/70">
          To-Dos ({todos.length})
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-card rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            ))}
          </div>
        ) : (
          <TodoCardList
            todos={todos}
            onUpdateTodo={handleUpdateTodo}
            meetingLinks={meetingLinks}
            painDetails={painDetails}
          />
        )}
      </div>
    </div>
  );
}
