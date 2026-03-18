'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Trash2,
  Plus,
  Eye,
  User,
  Building2,
  Calendar,
  Clock,
  FileText,
  AlertTriangle,
  Lightbulb,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import type {
  EditableTodo,
  TodoStatus,
  Participant,
  EditablePain,
} from '@/lib/types';

const STATUS_OPTIONS: TodoStatus[] = [
  'Pendente',
  'Em andamento',
  'Concluido',
  'Cancelado',
];

const STATUS_VARIANT: Record<
  TodoStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  Pendente: 'secondary',
  'Em andamento': 'default',
  Concluido: 'outline',
  Cancelado: 'destructive',
};

const STATUS_DOT: Record<TodoStatus, string> = {
  Pendente: 'bg-amber-400',
  'Em andamento': 'bg-blue-400',
  Concluido: 'bg-emerald-400',
  Cancelado: 'bg-red-400',
};

export interface MeetingLink {
  id: string;
  title: string | null;
}

export interface PainDetail {
  description: string;
  solutions: { description: string }[];
}

interface TodoTableProps {
  todos: EditableTodo[];
  onUpdateTodo: (
    tempId: string,
    field: keyof EditableTodo,
    value: string
  ) => void;
  onAddTodo: () => void;
  onRemoveTodo: (tempId: string) => void;
  participants?: Participant[];
  pains?: EditablePain[];
  meetingDate?: string;
  readOnly?: boolean;
  meetingLinks?: Record<string, MeetingLink>;
  costCenters?: string[];
  painDetails?: Record<string, PainDetail>;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
    return date.toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

export function TodoTable({
  todos,
  onUpdateTodo,
  onAddTodo,
  onRemoveTodo,
  participants = [],
  pains = [],
  meetingDate,
  readOnly = false,
  meetingLinks,
  costCenters: costCentersProp,
  painDetails,
}: TodoTableProps) {
  const [detailTodo, setDetailTodo] = useState<EditableTodo | null>(null);
  const [expandedTodo, setExpandedTodo] = useState<string | null>(null);

  const costCenters = costCentersProp ??
    [...new Set(
      participants
        .map((p) => p.costCenter)
        .filter((cc): cc is string => !!cc)
    )];

  const getPainDescription = (painTempId: string | null) => {
    if (!painTempId) return null;
    if (painDetails?.[painTempId]) return painDetails[painTempId].description;
    const pain = pains.find((p) => p.tempId === painTempId);
    return pain?.description || null;
  };

  if (todos.length === 0 && readOnly) {
    return (
      <div className="glass-card rounded-xl p-12 flex flex-col items-center justify-center space-y-3">
        <FileText className="h-5 w-5 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Nenhum to-do adicionado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {todos.map((todo) => {
        const painDesc = getPainDescription(todo.painTempId);
        const isExpanded = expandedTodo === todo.tempId;

        return (
          <div
            key={todo.tempId}
            className="glass-card rounded-xl overflow-hidden transition-all duration-200 hover:border-primary/20"
          >
            {/* Card header — always visible */}
            <div className="px-4 py-3 flex items-center gap-3">
              <span className={`h-2 w-2 rounded-full shrink-0 ${STATUS_DOT[todo.status]}`} />

              {/* Action text */}
              <div className="flex-1 min-w-0">
                {readOnly ? (
                  <p className="text-sm font-medium truncate" title={todo.action}>
                    {todo.action || 'Sem acao definida'}
                  </p>
                ) : (
                  <Input
                    value={todo.action}
                    onChange={(e) => onUpdateTodo(todo.tempId, 'action', e.target.value)}
                    placeholder="Acao..."
                    className="h-7 text-sm font-medium bg-transparent border-0 px-0 focus-visible:ring-0"
                  />
                )}
              </div>

              {/* Meta badges */}
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                {todo.responsible && (
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <User className="h-3 w-3" />
                    {todo.responsible}
                  </span>
                )}
                <Select
                  value={todo.status}
                  onValueChange={(v) => v && onUpdateTodo(todo.tempId, 'status', v)}
                >
                  <SelectTrigger size="sm" className="h-6 text-[11px] border-0 bg-transparent px-1 gap-1 w-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Expand toggle */}
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setExpandedTodo(isExpanded ? null : todo.tempId)}
                  className="shrink-0 text-muted-foreground"
                >
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </Button>
              )}

              {/* Detail button */}
              {painDesc && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setDetailTodo(todo)}
                  className="shrink-0 text-muted-foreground hover:text-primary"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              )}

              {/* Delete */}
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onRemoveTodo(todo.tempId)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* Expanded edit fields */}
            {!readOnly && isExpanded && (
              <div className="px-4 pb-4 pt-1 border-t border-border/50 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" /> Responsavel
                    </label>
                    <Input
                      list={`resp-${todo.tempId}`}
                      value={todo.responsible}
                      onChange={(e) => onUpdateTodo(todo.tempId, 'responsible', e.target.value)}
                      placeholder="Responsavel"
                      className="h-8 text-sm bg-transparent border-border/50"
                    />
                    <datalist id={`resp-${todo.tempId}`}>
                      {participants.map((p) => (
                        <option key={p.id} value={p.name} />
                      ))}
                    </datalist>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" /> Resp. acao
                    </label>
                    <Input
                      list={`ao-${todo.tempId}`}
                      value={todo.actionOwner}
                      onChange={(e) => onUpdateTodo(todo.tempId, 'actionOwner', e.target.value)}
                      placeholder="Resp. acao"
                      className="h-8 text-sm bg-transparent border-border/50"
                    />
                    <datalist id={`ao-${todo.tempId}`}>
                      {participants.map((p) => (
                        <option key={p.id} value={p.name} />
                      ))}
                    </datalist>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" /> Centro de custo
                    </label>
                    <Input
                      list={`cc-${todo.tempId}`}
                      value={todo.costCenter}
                      onChange={(e) => onUpdateTodo(todo.tempId, 'costCenter', e.target.value)}
                      placeholder="CC"
                      className="h-8 text-sm bg-transparent border-border/50"
                    />
                    <datalist id={`cc-${todo.tempId}`}>
                      {costCenters.map((cc) => (
                        <option key={cc} value={cc} />
                      ))}
                    </datalist>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                      <FileText className="h-3 w-3" /> Conta
                    </label>
                    <Input
                      value={todo.account}
                      onChange={(e) => onUpdateTodo(todo.tempId, 'account', e.target.value)}
                      placeholder="Conta"
                      className="h-8 text-sm bg-transparent border-border/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Prazo
                    </label>
                    <Input
                      type="date"
                      value={todo.deadline}
                      onChange={(e) => onUpdateTodo(todo.tempId, 'deadline', e.target.value)}
                      className="h-8 text-sm bg-transparent border-border/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Data reuniao
                    </label>
                    <p className="text-sm text-muted-foreground pt-1.5">
                      {formatDate(todo.meetingDate || meetingDate || '')}
                    </p>
                  </div>
                </div>

                {/* Pain link */}
                {painDesc && (
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/5 border border-red-500/10">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">{painDesc}</p>
                  </div>
                )}
              </div>
            )}

            {/* Read-only meta row */}
            {readOnly && (
              <div className="px-4 pb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                {todo.costCenter && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {todo.costCenter}
                  </span>
                )}
                {todo.deadline && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(todo.deadline)}
                  </span>
                )}
                {(todo.meetingDate || meetingDate) && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(todo.meetingDate || meetingDate || '')}
                  </span>
                )}
                {meetingLinks && meetingLinks[todo.tempId] && (
                  <Link
                    href={`/meeting/${meetingLinks[todo.tempId].id}`}
                    className="text-primary hover:underline"
                  >
                    {meetingLinks[todo.tempId].title || 'Sem titulo'}
                  </Link>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add button */}
      {!readOnly && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAddTodo}
          className="w-full gap-1.5 border-dashed"
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar To-Do
        </Button>
      )}

      {/* Detail dialog */}
      <Dialog open={!!detailTodo} onOpenChange={(open) => !open && setDetailTodo(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do To-Do</DialogTitle>
          </DialogHeader>
          {detailTodo && (
            <div className="space-y-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Acao:</span>
                <p className="break-words whitespace-pre-wrap mt-1">{detailTodo.action || '—'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="font-medium text-muted-foreground">Responsavel:</span>
                  <p>{detailTodo.responsible || '—'}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Status:</span>
                  <p><Badge variant={STATUS_VARIANT[detailTodo.status]}>{detailTodo.status}</Badge></p>
                </div>
                {detailTodo.actionOwner && (
                  <div>
                    <span className="font-medium text-muted-foreground">Resp. acao:</span>
                    <p>{detailTodo.actionOwner}</p>
                  </div>
                )}
                {detailTodo.costCenter && (
                  <div>
                    <span className="font-medium text-muted-foreground">Centro de custo:</span>
                    <p>{detailTodo.costCenter}</p>
                  </div>
                )}
              </div>
              {detailTodo.painTempId && painDetails?.[detailTodo.painTempId] && (
                <div className="border-t border-border/50 pt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                    <span className="font-medium text-muted-foreground">Dor relacionada:</span>
                  </div>
                  <p className="break-words whitespace-pre-wrap">{painDetails[detailTodo.painTempId].description}</p>
                  {painDetails[detailTodo.painTempId].solutions.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Lightbulb className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="font-medium text-muted-foreground">Solucoes:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {painDetails[detailTodo.painTempId].solutions.map((s, i) => (
                          <li key={i}>{s.description}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </div>
  );
}
