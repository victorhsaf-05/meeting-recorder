'use client';

import { useState } from 'react';
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
import { Calendar, User, Building2, Eye, Clock } from 'lucide-react';
import Link from 'next/link';
import type { EditableTodo, TodoStatus } from '@/lib/types';
import type { MeetingLink } from '@/components/TodoTable';
import type { PainDetail } from '@/components/TodoTable';

const STATUS_OPTIONS: TodoStatus[] = [
  'Pendente',
  'Em andamento',
  'Concluido',
  'Cancelado',
];

const STATUS_CONFIG: Record<TodoStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; dot: string }> = {
  'Pendente': { variant: 'secondary', dot: 'bg-amber-400' },
  'Em andamento': { variant: 'default', dot: 'bg-blue-400' },
  'Concluido': { variant: 'outline', dot: 'bg-emerald-400' },
  'Cancelado': { variant: 'destructive', dot: 'bg-red-400' },
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  } catch {
    return dateStr;
  }
}

interface TodoCardListProps {
  todos: EditableTodo[];
  onUpdateTodo: (tempId: string, field: keyof EditableTodo, value: string) => void;
  meetingLinks?: Record<string, MeetingLink>;
  painDetails?: Record<string, PainDetail>;
}

export function TodoCardList({ todos, onUpdateTodo, meetingLinks, painDetails }: TodoCardListProps) {
  const [detailTodo, setDetailTodo] = useState<EditableTodo | null>(null);

  if (todos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Clock className="h-5 w-5 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Nenhum to-do encontrado</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {todos.map((todo) => {
          const cfg = STATUS_CONFIG[todo.status];
          const meeting = meetingLinks?.[todo.tempId];
          const pain = todo.painTempId ? painDetails?.[todo.painTempId] : null;

          return (
            <div
              key={todo.tempId}
              className="glass-card rounded-xl p-4 space-y-3 transition-all duration-200 hover:border-primary/20"
            >
              {/* Top: status + date */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                  <Select
                    value={todo.status}
                    onValueChange={(v) => v && onUpdateTodo(todo.tempId, 'status', v)}
                  >
                    <SelectTrigger size="sm" className="h-6 text-[11px] border-0 bg-transparent px-0 gap-1 w-auto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {todo.meetingDate && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(todo.meetingDate)}
                  </span>
                )}
              </div>

              {/* Action text */}
              <p className="text-sm font-medium leading-snug line-clamp-2" title={todo.action}>
                {todo.action || 'Sem acao definida'}
              </p>

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                {todo.responsible && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {todo.responsible}
                  </span>
                )}
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
              </div>

              {/* Bottom: meeting link + detail button */}
              <div className="flex items-center justify-between pt-1 border-t border-border/50">
                {meeting ? (
                  <Link
                    href={`/meeting/${meeting.id}`}
                    className="text-[11px] text-primary hover:underline truncate max-w-[60%]"
                    title={meeting.title || 'Sem titulo'}
                  >
                    {meeting.title || 'Sem titulo'}
                  </Link>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-1">
                  {pain && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground hover:text-primary"
                      onClick={() => setDetailTodo(todo)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
                  <p><Badge variant={STATUS_CONFIG[detailTodo.status].variant}>{detailTodo.status}</Badge></p>
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
                  <span className="font-medium text-muted-foreground">Dor relacionada:</span>
                  <p className="break-words whitespace-pre-wrap mt-1">{painDetails[detailTodo.painTempId].description}</p>
                  {painDetails[detailTodo.painTempId].solutions.length > 0 && (
                    <div>
                      <span className="font-medium text-muted-foreground">Solucoes:</span>
                      <ul className="list-disc list-inside mt-1 space-y-1">
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
    </>
  );
}
