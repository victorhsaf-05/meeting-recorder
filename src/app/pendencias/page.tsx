'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PendenciaCard } from '@/components/PendenciaCard';
import { PendenciaForm } from '@/components/PendenciaForm';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { PendenciaItem, PendenciaStatus, CreatePendenciaRequest } from '@/lib/types';

interface PendenciaCounters {
  pendente: number;
  emAndamento: number;
  concluida: number;
  arquivada: number;
}

const counterItems = [
  { key: 'pendente' as const, label: 'Pendentes', status: 'Pendente', textColor: 'text-amber-400', glowClass: 'glow-yellow', ringClass: 'ring-amber-400/50' },
  { key: 'emAndamento' as const, label: 'Em andamento', status: 'Em andamento', textColor: 'text-blue-400', glowClass: 'glow-blue', ringClass: 'ring-blue-400/50' },
  { key: 'concluida' as const, label: 'Concluidas', status: 'Concluida', textColor: 'text-emerald-400', glowClass: 'glow-green', ringClass: 'ring-emerald-400/50' },
  { key: 'arquivada' as const, label: 'Arquivadas', status: 'Arquivada', textColor: 'text-slate-400', glowClass: '', ringClass: 'ring-slate-400/50' },
];

export default function PendenciasPage() {
  const [pendencias, setPendencias] = useState<PendenciaItem[]>([]);
  const [counters, setCounters] = useState<PendenciaCounters>({ pendente: 0, emAndamento: 0, concluida: 0, arquivada: 0 });
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editPendencia, setEditPendencia] = useState<PendenciaItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PendenciaItem | null>(null);
  const [activeFilter, setActiveFilter] = useState('');

  const fetchData = useCallback((statusFilter?: string) => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    fetch(`/api/pendencias${params.toString() ? `?${params}` : ''}`)
      .then((res) => res.json())
      .then((data) => {
        setPendencias(data.pendencias);
        setCounters(data.counters);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleCreate(data: CreatePendenciaRequest) {
    setSaving(true);
    try {
      await fetch('/api/pendencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setFormOpen(false);
      setLoading(true);
      fetchData(activeFilter);
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(data: CreatePendenciaRequest) {
    if (!editPendencia) return;
    setSaving(true);
    try {
      await fetch(`/api/pendencias/${editPendencia.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setEditPendencia(null);
      setLoading(true);
      fetchData(activeFilter);
    } finally {
      setSaving(false);
    }
  }

  function handleStatusChange(id: string, status: PendenciaStatus) {
    setPendencias((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p))
    );
    fetch(`/api/pendencias/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).then(() => {
      // Refresh counters
      fetchData(activeFilter);
    });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await fetch(`/api/pendencias/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    setLoading(true);
    fetchData(activeFilter);
  }

  function handleFilterClick(status: string) {
    const newFilter = activeFilter === status ? '' : status;
    setActiveFilter(newFilter);
    setLoading(true);
    fetchData(newFilter);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between animate-fade-in">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Pendencias</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie suas pendencias e tarefas avulsas.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Nova Pendencia
        </Button>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 stagger-children">
        {counterItems.map((item) => {
          const isActive = activeFilter === item.status;
          return (
            <Card
              key={item.key}
              className={`glass-card ${item.glowClass} transition-all duration-300 hover:scale-[1.02] cursor-pointer ${isActive ? `ring-2 ${item.ringClass}` : ''}`}
              onClick={() => handleFilterClick(item.status)}
            >
              <CardContent className="py-4">
                <p className={`text-2xl font-bold font-mono tabular-nums ${item.textColor}`}>{counters[item.key]}</p>
                <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* List */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground/70">
          {activeFilter || 'Todas'} ({pendencias.length})
        </h2>
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-card rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-14" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : pendencias.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3 animate-fade-in">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Nenhuma pendencia encontrada.</p>
            <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
              Criar primeira pendencia
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 stagger-children">
            {pendencias.map((p) => (
              <PendenciaCard key={p.id} pendencia={p} onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}
      </div>

      {/* Create form */}
      <PendenciaForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        loading={saving}
      />

      {/* Edit form */}
      <PendenciaForm
        open={!!editPendencia}
        onOpenChange={(open) => !open && setEditPendencia(null)}
        onSubmit={handleEdit}
        pendencia={editPendencia}
        loading={saving}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir Pendencia</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir <span className="font-medium text-foreground">{deleteTarget?.title}</span>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
