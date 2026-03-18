'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Trash2, Plus, Eye } from 'lucide-react';
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
  if (!dateStr) return '—';
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
  const showMeetingCol = !!meetingLinks;

  const costCenters = costCentersProp ??
    [...new Set(
      participants
        .map((p) => p.costCenter)
        .filter((cc): cc is string => !!cc)
    )];

  const getPainDescription = (painTempId: string | null) => {
    if (!painTempId) return '—';
    if (painDetails?.[painTempId]) return painDetails[painTempId].description;
    const pain = pains.find((p) => p.tempId === painTempId);
    return pain?.description || '—';
  };

  return (
    <div className="space-y-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[140px]">Responsável</TableHead>
            <TableHead className="min-w-[140px]">Resp. pela ação</TableHead>
            <TableHead className="min-w-[120px]">Centro de custo</TableHead>
            <TableHead className="min-w-[110px]">Data reunião</TableHead>
            <TableHead className="min-w-[100px]">Conta</TableHead>
            <TableHead className="min-w-[200px]">TO-DO (Ação)</TableHead>
            <TableHead className="min-w-[130px]">Prazo</TableHead>
            <TableHead className="min-w-[150px]">Dor relacionada</TableHead>
            <TableHead className="min-w-[140px]">Status</TableHead>
            {showMeetingCol && <TableHead className="min-w-[130px]">Reunião</TableHead>}
            {!readOnly && <TableHead className="w-[50px]" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {todos.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={9 + (showMeetingCol ? 1 : 0) + (readOnly ? 0 : 1)}
                className="text-center text-muted-foreground py-8"
              >
                Nenhum to-do adicionado
              </TableCell>
            </TableRow>
          ) : (
            todos.map((todo) => (
              <TableRow key={todo.tempId}>
                <TableCell>
                  {readOnly ? (
                    <span className="text-sm">{todo.responsible || '—'}</span>
                  ) : (
                    <>
                      <Input
                        list={`resp-${todo.tempId}`}
                        value={todo.responsible}
                        onChange={(e) =>
                          onUpdateTodo(
                            todo.tempId,
                            'responsible',
                            e.target.value
                          )
                        }
                        placeholder="Responsável"
                        className="h-7 text-xs"
                      />
                      <datalist id={`resp-${todo.tempId}`}>
                        {participants.map((p) => (
                          <option key={p.id} value={p.name} />
                        ))}
                      </datalist>
                    </>
                  )}
                </TableCell>

                <TableCell>
                  {readOnly ? (
                    <span className="text-sm">{todo.actionOwner || '—'}</span>
                  ) : (
                    <>
                      <Input
                        list={`ao-${todo.tempId}`}
                        value={todo.actionOwner}
                        onChange={(e) =>
                          onUpdateTodo(
                            todo.tempId,
                            'actionOwner',
                            e.target.value
                          )
                        }
                        placeholder="Resp. ação"
                        className="h-7 text-xs"
                      />
                      <datalist id={`ao-${todo.tempId}`}>
                        {participants.map((p) => (
                          <option key={p.id} value={p.name} />
                        ))}
                      </datalist>
                    </>
                  )}
                </TableCell>

                <TableCell>
                  {readOnly ? (
                    <span className="text-sm">{todo.costCenter || '—'}</span>
                  ) : (
                    <>
                      <Input
                        list={`cc-${todo.tempId}`}
                        value={todo.costCenter}
                        onChange={(e) =>
                          onUpdateTodo(
                            todo.tempId,
                            'costCenter',
                            e.target.value
                          )
                        }
                        placeholder="CC"
                        className="h-7 text-xs"
                      />
                      <datalist id={`cc-${todo.tempId}`}>
                        {costCenters.map((cc) => (
                          <option key={cc} value={cc} />
                        ))}
                      </datalist>
                    </>
                  )}
                </TableCell>

                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(todo.meetingDate || meetingDate || '')}
                </TableCell>

                <TableCell>
                  {readOnly ? (
                    <span className="text-sm">{todo.account || '—'}</span>
                  ) : (
                    <Input
                      value={todo.account}
                      onChange={(e) =>
                        onUpdateTodo(todo.tempId, 'account', e.target.value)
                      }
                      placeholder="Conta"
                      className="h-7 text-xs"
                    />
                  )}
                </TableCell>

                <TableCell>
                  {readOnly ? (
                    <span className="text-sm">{todo.action || '—'}</span>
                  ) : (
                    <Input
                      value={todo.action}
                      onChange={(e) =>
                        onUpdateTodo(todo.tempId, 'action', e.target.value)
                      }
                      placeholder="Ação"
                      className="h-7 text-xs"
                    />
                  )}
                </TableCell>

                <TableCell>
                  {readOnly ? (
                    <span className="text-sm">{formatDate(todo.deadline)}</span>
                  ) : (
                    <Input
                      type="date"
                      value={todo.deadline}
                      onChange={(e) =>
                        onUpdateTodo(todo.tempId, 'deadline', e.target.value)
                      }
                      className="h-7 text-xs"
                    />
                  )}
                </TableCell>

                <TableCell className="text-sm text-muted-foreground max-w-[150px]">
                  <div className="flex items-center gap-1">
                    <span className="truncate" title={getPainDescription(todo.painTempId)}>
                      {getPainDescription(todo.painTempId)}
                    </span>
                    {painDetails && todo.painTempId && painDetails[todo.painTempId] && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 h-5 w-5"
                        onClick={() => setDetailTodo(todo)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  {readOnly ? (
                    <Badge variant={STATUS_VARIANT[todo.status]}>
                      {todo.status}
                    </Badge>
                  ) : (
                    <Select
                      value={todo.status}
                      onValueChange={(v) =>
                        v && onUpdateTodo(todo.tempId, 'status', v as string)
                      }
                    >
                      <SelectTrigger size="sm" className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>

                {showMeetingCol && (
                  <TableCell className="text-sm">
                    {meetingLinks[todo.tempId] ? (
                      <Link
                        href={`/meeting/${meetingLinks[todo.tempId].id}`}
                        className="text-primary hover:underline truncate block max-w-[130px]"
                        title={meetingLinks[todo.tempId].title || 'Sem título'}
                      >
                        {meetingLinks[todo.tempId].title || 'Sem título'}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                )}

                {!readOnly && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onRemoveTodo(todo.tempId)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {!readOnly && (
        <Button variant="outline" size="sm" onClick={onAddTodo} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar To-Do
        </Button>
      )}

      <Dialog open={!!detailTodo} onOpenChange={(open) => !open && setDetailTodo(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do To-Do</DialogTitle>
          </DialogHeader>
          {detailTodo && (
            <div className="space-y-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Acao:</span>
                <p>{detailTodo.action || '—'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-medium text-muted-foreground">Responsavel:</span>
                  <p>{detailTodo.responsible || '—'}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Status:</span>
                  <p><Badge variant={STATUS_VARIANT[detailTodo.status]}>{detailTodo.status}</Badge></p>
                </div>
              </div>
              {detailTodo.painTempId && painDetails?.[detailTodo.painTempId] && (
                <div className="border-t pt-3 space-y-2">
                  <span className="font-medium text-muted-foreground">Dor relacionada:</span>
                  <p>{painDetails[detailTodo.painTempId].description}</p>
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
    </div>
  );
}
