'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { getParticipants, createParticipant } from '@/lib/api';
import type { Participant } from '@/lib/types';

interface ParticipantSelectorProps {
  selectedParticipants: Participant[];
  onSelectionChange: (participants: Participant[]) => void;
}

export function ParticipantSelector({
  selectedParticipants,
  onSelectionChange,
}: ParticipantSelectorProps) {
  const [allParticipants, setAllParticipants] = useState<Participant[]>([]);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newCostCenter, setNewCostCenter] = useState('');
  const [pendingName, setPendingName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getParticipants()
      .then(setAllParticipants)
      .catch(() => setError('Erro ao carregar participantes'));
  }, []);

  const selectedIds = new Set(selectedParticipants.map(p => p.id));

  const filtered = allParticipants.filter(
    p =>
      !selectedIds.has(p.id) &&
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  const exactMatch = allParticipants.some(
    p => p.name.toLowerCase() === search.trim().toLowerCase()
  );

  const showAddOption = search.trim().length > 0 && !exactMatch;

  const handleSelect = useCallback(
    (participant: Participant) => {
      onSelectionChange([...selectedParticipants, participant]);
      setSearch('');
      setIsOpen(false);
    },
    [selectedParticipants, onSelectionChange]
  );

  const handleRemove = useCallback(
    (id: string) => {
      onSelectionChange(selectedParticipants.filter(p => p.id !== id));
    },
    [selectedParticipants, onSelectionChange]
  );

  const handleStartAdd = useCallback(() => {
    setPendingName(search.trim());
    setNewCostCenter('');
    setIsAdding(true);
  }, [search]);

  const handleConfirmAdd = useCallback(async () => {
    try {
      setError(null);
      const participant = await createParticipant({
        name: pendingName,
        costCenter: newCostCenter.trim() || undefined,
      });
      setAllParticipants(prev => [...prev, participant].sort((a, b) => a.name.localeCompare(b.name)));
      onSelectionChange([...selectedParticipants, participant]);
      setIsAdding(false);
      setSearch('');
      setIsOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar participante';
      if (message.includes('já existe')) {
        const existing = allParticipants.find(
          p => p.name.toLowerCase() === pendingName.toLowerCase()
        );
        if (existing) {
          handleSelect(existing);
          setIsAdding(false);
        }
      } else {
        setError(message);
      }
    }
  }, [pendingName, newCostCenter, selectedParticipants, onSelectionChange, allParticipants, handleSelect]);

  const handleCancelAdd = useCallback(() => {
    setIsAdding(false);
    setPendingName('');
  }, []);

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {selectedParticipants.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedParticipants.map(p => (
              <Badge key={p.id} variant="secondary" className="gap-1 pr-1">
                {p.name}
                {p.costCenter && (
                  <span className="text-muted-foreground"> ({p.costCenter})</span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(p.id)}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                  aria-label={`Remover ${p.name}`}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}

        {isAdding ? (
          <div className="space-y-2">
            <p className="text-sm">
              Adicionar <strong>{pendingName}</strong>
            </p>
            <Input
              placeholder="Centro de custo (opcional)"
              value={newCostCenter}
              onChange={e => setNewCostCenter(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleConfirmAdd();
                if (e.key === 'Escape') handleCancelAdd();
              }}
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleConfirmAdd}>
                Confirmar
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelAdd}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <Input
              placeholder="Buscar ou adicionar participante..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onBlur={() => {
                // Delay to allow click on items
                setTimeout(() => setIsOpen(false), 200);
              }}
            />
            {isOpen && (filtered.length > 0 || showAddOption) && (
              <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                <ul className="max-h-48 overflow-y-auto p-1">
                  {filtered.map(p => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
                        onMouseDown={e => {
                          e.preventDefault();
                          handleSelect(p);
                        }}
                      >
                        <span>{p.name}</span>
                        {p.costCenter && (
                          <span className="text-xs text-muted-foreground">
                            {p.costCenter}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                  {showAddOption && (
                    <li>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm font-medium text-primary hover:bg-muted"
                        onMouseDown={e => {
                          e.preventDefault();
                          handleStartAdd();
                        }}
                      >
                        + Adicionar &quot;{search.trim()}&quot;
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
