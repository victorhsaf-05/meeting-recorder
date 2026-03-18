'use client';

import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Lightbulb, Plus, X, Trash2, MessageSquareText } from 'lucide-react';
import type { EditablePain, EditableSolution } from '@/lib/types';

interface AnalysisViewProps {
  mode: 'wizard' | 'detail';
  context?: string | null;
  pains: EditablePain[];
  onPainsChange?: (pains: EditablePain[]) => void;
  isLoading?: boolean;
  error?: string | null;
}

function generateTempId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

export function AnalysisView({
  context,
  pains,
  onPainsChange,
  isLoading,
  error,
}: AnalysisViewProps) {
  const updatePain = useCallback(
    (index: number, updates: Partial<EditablePain>) => {
      const updated = pains.map((p, i) =>
        i === index ? { ...p, ...updates } : p
      );
      onPainsChange?.(updated);
    },
    [pains, onPainsChange]
  );

  const addPain = useCallback(() => {
    const newPain: EditablePain = {
      tempId: generateTempId(),
      description: '',
      solutions: [],
    };
    onPainsChange?.([...pains, newPain]);
  }, [pains, onPainsChange]);

  const removePain = useCallback(
    (index: number) => {
      onPainsChange?.(pains.filter((_, i) => i !== index));
    },
    [pains, onPainsChange]
  );

  const addSolution = useCallback(
    (painIndex: number) => {
      const newSolution: EditableSolution = {
        tempId: generateTempId(),
        description: '',
      };
      const updated = pains.map((p, i) =>
        i === painIndex
          ? { ...p, solutions: [...p.solutions, newSolution] }
          : p
      );
      onPainsChange?.(updated);
    },
    [pains, onPainsChange]
  );

  const updateSolution = useCallback(
    (painIndex: number, solIndex: number, description: string) => {
      const updated = pains.map((p, pi) =>
        pi === painIndex
          ? {
              ...p,
              solutions: p.solutions.map((s, si) =>
                si === solIndex ? { ...s, description } : s
              ),
            }
          : p
      );
      onPainsChange?.(updated);
    },
    [pains, onPainsChange]
  );

  const removeSolution = useCallback(
    (painIndex: number, solIndex: number) => {
      const updated = pains.map((p, pi) =>
        pi === painIndex
          ? { ...p, solutions: p.solutions.filter((_, si) => si !== solIndex) }
          : p
      );
      onPainsChange?.(updated);
    },
    [pains, onPainsChange]
  );

  if (isLoading) {
    return (
      <div className="glass-card rounded-xl p-12 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Analisando transcricao com IA...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-xl p-5">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Context */}
      {context && (
        <div className="glass-card rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <MessageSquareText className="h-4 w-4" />
            Contexto da Reuniao
          </div>
          <p className="text-sm leading-relaxed">{context}</p>
        </div>
      )}

      {/* Pains */}
      <div className="space-y-3">
        {pains.map((pain, painIndex) => (
          <div key={pain.tempId} className="glass-card rounded-xl overflow-hidden">
            {/* Pain header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Dor {painIndex + 1}
              </span>
              <div className="ml-auto">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => removePain(painIndex)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Pain body */}
            <div className="p-4 space-y-3">
              <Input
                value={pain.description}
                onChange={e => updatePain(painIndex, { description: e.target.value })}
                placeholder="Descricao do problema..."
                className="bg-transparent border-border/50 focus:border-primary/30"
              />

              {/* Solutions */}
              <div className="space-y-2 pl-4 border-l-2 border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-xs font-medium text-muted-foreground">Solucoes</span>
                </div>
                {pain.solutions.map((sol, solIndex) => (
                  <div key={sol.tempId} className="flex items-center gap-2">
                    <Input
                      value={sol.description}
                      onChange={e => updateSolution(painIndex, solIndex, e.target.value)}
                      placeholder="Solucao proposta..."
                      className="flex-1 bg-transparent border-border/50 focus:border-primary/30 h-8 text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeSolution(painIndex, solIndex)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addSolution(painIndex)}
                  className="h-7 text-xs text-muted-foreground hover:text-primary gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Solucao
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={addPain}
        className="gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" />
        Adicionar Dor
      </Button>
    </div>
  );
}

export { generateTempId };
