'use client';

import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              Analisando transcrição com IA...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {context && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="mb-2 text-sm font-medium">Contexto da Reunião</h3>
            <p className="text-sm text-muted-foreground">{context}</p>
          </CardContent>
        </Card>
      )}

      {pains.map((pain, painIndex) => (
        <Card key={pain.tempId}>
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Dor {painIndex + 1}</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removePain(painIndex)}
              >
                Remover
              </Button>
            </div>
            <Input
              value={pain.description}
              onChange={e =>
                updatePain(painIndex, { description: e.target.value })
              }
              placeholder="Descrição do problema..."
            />

            <div className="ml-4 space-y-2">
              <span className="text-xs font-medium text-muted-foreground">
                Soluções
              </span>
              {pain.solutions.map((sol, solIndex) => (
                <div key={sol.tempId} className="flex items-center gap-2">
                  <Input
                    value={sol.description}
                    onChange={e =>
                      updateSolution(painIndex, solIndex, e.target.value)
                    }
                    placeholder="Solução proposta..."
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeSolution(painIndex, solIndex)}
                  >
                    ×
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => addSolution(painIndex)}
              >
                + Solução
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={addPain}>
        + Adicionar Dor
      </Button>
    </div>
  );
}

export { generateTempId };
