'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RoutineCard } from '@/components/RoutineCard';
import { RoutineForm } from '@/components/RoutineForm';
import { Skeleton } from '@/components/ui/skeleton';
import type { RoutineWithStatus, CreateRoutineRequest } from '@/lib/types';

export default function RotinasPage() {
  const [routines, setRoutines] = useState<RoutineWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(() => {
    fetch('/api/routines')
      .then((res) => res.json())
      .then((data) => {
        setRoutines(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleCreate(data: CreateRoutineRequest) {
    setSaving(true);
    try {
      await fetch('/api/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setFormOpen(false);
      setLoading(true);
      fetchData();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between animate-fade-in">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Rotinas</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie suas rotinas de trabalho.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Nova Rotina
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-14" />
              </div>
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : routines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3 animate-fade-in">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <ListChecks className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Nenhuma rotina cadastrada.</p>
          <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
            Criar primeira rotina
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 stagger-children">
          {routines.map((r) => (
            <RoutineCard key={r.id} routine={r} />
          ))}
        </div>
      )}

      {/* Form dialog */}
      <RoutineForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        allRoutines={routines}
        loading={saving}
      />
    </div>
  );
}
