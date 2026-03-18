'use client';

import { useState, useEffect, useCallback } from 'react';
import { ExcelExport } from '@/components/ExcelExport';
import { ExcelImport } from '@/components/ExcelImport';
import { DashboardCounters } from '@/components/DashboardCounters';
import { DashboardFilters } from '@/components/DashboardFilters';
import { TodoTable } from '@/components/TodoTable';
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <ExcelExport
            todos={todos}
            filename={`todos-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}`}
          />
          <ExcelImport onImported={() => { setLoading(true); fetchData(filters); }} />
        </div>
      </div>

      <DashboardCounters counters={counters} />

      <DashboardFilters
        filters={filters}
        onChange={setFilters}
        onApply={handleApply}
        onClear={handleClear}
        costCenters={costCenters}
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Carregando to-dos...</p>
          </div>
        </div>
      ) : (
        <TodoTable
          todos={todos}
          onUpdateTodo={handleUpdateTodo}
          onAddTodo={() => {}}
          onRemoveTodo={() => {}}
          readOnly={false}
          meetingLinks={meetingLinks}
          costCenters={costCenters}
          painDetails={painDetails}
        />
      )}
    </div>
  );
}
