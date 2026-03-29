'use client';

import { useState, useEffect, useCallback } from 'react';
import { CalendarCheck } from 'lucide-react';
import { RoutineCounters } from '@/components/RoutineCounters';
import { RoutineDayCard } from '@/components/RoutineDayCard';
import { PendenciaCard } from '@/components/PendenciaCard';
import { ExecuteDialog } from '@/components/ExecuteDialog';
import type { RoutineWithStatus, PendenciaItem, PendenciaStatus, MeuDiaCounters } from '@/lib/types';

const emptyCounters: MeuDiaCounters = {
  totalRotinas: 0,
  concluidasHoje: 0,
  atrasadas: 0,
  desatualizadas: 0,
  pendenciasPendentes: 0,
  pendenciasAndamento: 0,
};

export default function MeuDiaPage() {
  const [routines, setRoutines] = useState<RoutineWithStatus[]>([]);
  const [pendencias, setPendencias] = useState<PendenciaItem[]>([]);
  const [counters, setCounters] = useState<MeuDiaCounters>(emptyCounters);
  const [loading, setLoading] = useState(true);
  const [executeRoutine, setExecuteRoutine] = useState<RoutineWithStatus | null>(null);
  const [executing, setExecuting] = useState(false);

  const fetchData = useCallback(() => {
    fetch('/api/meu-dia')
      .then((res) => res.json())
      .then((data) => {
        setRoutines(data.routines);
        setPendencias(data.pendencias);
        setCounters(data.counters);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleExecute(notes: string) {
    if (!executeRoutine) return;
    setExecuting(true);
    try {
      await fetch(`/api/routines/${executeRoutine.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      setExecuteRoutine(null);
      setLoading(true);
      fetchData();
    } finally {
      setExecuting(false);
    }
  }

  function handleUpdatePendencia(id: string, status: PendenciaStatus) {
    setPendencias((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p))
    );
    fetch(`/api/pendencias/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  }

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Meu Dia</h1>
        <p className="text-sm text-muted-foreground capitalize">{today}</p>
      </div>

      {/* Counters */}
      <RoutineCounters counters={counters} />

      {/* Routines */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground/70">
          Rotinas do Dia ({routines.length})
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-3">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Carregando...</p>
            </div>
          </div>
        ) : routines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
              <CalendarCheck className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="text-sm text-muted-foreground">Tudo em dia! Nenhuma rotina pendente.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {routines.map((r) => (
              <RoutineDayCard key={r.id} routine={r} onExecute={setExecuteRoutine} />
            ))}
          </div>
        )}
      </div>

      {/* Pendencias */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground/70">
          Pendencias ({pendencias.length})
        </h2>
        {!loading && pendencias.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <p className="text-sm text-muted-foreground">Nenhuma pendencia ativa.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {pendencias.map((p) => (
              <PendenciaCard key={p.id} pendencia={p} onStatusChange={handleUpdatePendencia} />
            ))}
          </div>
        )}
      </div>

      {/* Execute dialog */}
      <ExecuteDialog
        open={!!executeRoutine}
        onOpenChange={(open) => !open && setExecuteRoutine(null)}
        routineTitle={executeRoutine?.title ?? ''}
        onConfirm={handleExecute}
        loading={executing}
      />
    </div>
  );
}
