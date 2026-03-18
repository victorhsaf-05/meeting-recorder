'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TranscriptionView } from '@/components/TranscriptionView';
import { AnalysisView } from '@/components/AnalysisView';
import { TodoTable } from '@/components/TodoTable';
import { ExcelExport } from '@/components/ExcelExport';
import { sanitizeFilename } from '@/lib/excel';
import { useTodoTable } from '@/hooks/useTodoTable';
import {
  ArrowLeft,
  Calendar,
  Trash2,
  Download,
  AlertTriangle,
  ListTodo,
} from 'lucide-react';
import type {
  EditablePain,
  EditableTodo,
  TodoStatus,
  Participant,
} from '@/lib/types';

interface MeetingData {
  id: string;
  title: string | null;
  date: string;
  transcription: string | null;
  context: string | null;
  pains: {
    id: string;
    description: string;
    solutions: { id: string; description: string }[];
  }[];
  todos: {
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
  }[];
  participants: {
    participant: Participant;
  }[];
}

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [meeting, setMeeting] = useState<MeetingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [title, setTitle] = useState('');
  const [pains, setPains] = useState<EditablePain[]>([]);
  const prevPainsRef = useRef<EditablePain[]>([]);
  const [deleting, setDeleting] = useState(false);

  const participants =
    meeting?.participants?.map((mp) => mp.participant) || [];

  const { todos, setTodos, addTodo, removeTodo, updateTodo, addTodoForPain } = useTodoTable({
    mode: 'api',
    meetingId: id,
    participants,
    meetingDate: meeting?.date,
  });

  // Fetch meeting data
  useEffect(() => {
    fetch(`/api/meetings/${id}`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          setLoading(false);
          return null;
        }
        if (!res.ok) throw new Error('Erro ao carregar reunião');
        return res.json();
      })
      .then((data: MeetingData | null) => {
        if (!data) return;
        setMeeting(data);
        setTitle(data.title || '');

        const editablePains: EditablePain[] = data.pains.map((p) => ({
          tempId: p.id,
          description: p.description,
          solutions: p.solutions.map((s) => ({
            tempId: s.id,
            description: s.description,
          })),
        }));
        setPains(editablePains);
        prevPainsRef.current = editablePains;

        const editableTodos: EditableTodo[] = data.todos.map((t) => ({
          tempId: t.id,
          action: t.action,
          responsible: t.responsible || '',
          actionOwner: t.actionOwner || '',
          costCenter: t.costCenter || '',
          account: t.account || '',
          deadline: t.deadline ? t.deadline.split('T')[0] : '',
          status: t.status as TodoStatus,
          painTempId: t.painId || null,
        }));
        setTodos(editableTodos);

        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [id, setTodos]);

  // Title save on blur
  const handleTitleBlur = useCallback(() => {
    if (!meeting) return;
    if (title === (meeting.title || '')) return;
    fetch(`/api/meetings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
  }, [id, title, meeting]);

  // Pains change handler with API persistence
  const handlePainsChange = useCallback(
    (newPains: EditablePain[]) => {
      const prev = prevPainsRef.current;

      // Detect additions
      for (const np of newPains) {
        if (!prev.some((p) => p.tempId === np.tempId)) {
          fetch('/api/pains', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              description: np.description || 'Nova dor',
              meetingId: id,
            }),
          })
            .then((r) => r.json())
            .then((created) => {
              setPains((curr) => {
                const updated = curr.map((p) =>
                  p.tempId === np.tempId ? { ...p, tempId: created.id } : p
                );
                prevPainsRef.current = updated;
                return updated;
              });
            });
        }
      }

      // Detect removals
      for (const old of prev) {
        if (!newPains.some((p) => p.tempId === old.tempId)) {
          fetch(`/api/pains/${old.tempId}`, { method: 'DELETE' });
        }
      }

      // Detect edits (description changes + solution changes)
      for (const np of newPains) {
        const old = prev.find((p) => p.tempId === np.tempId);
        if (!old) continue;

        // Pain description change
        if (old.description !== np.description) {
          fetch(`/api/pains/${np.tempId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: np.description }),
          });
        }

        // Solution additions
        for (const ns of np.solutions) {
          if (!old.solutions.some((s) => s.tempId === ns.tempId)) {
            fetch('/api/solutions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                description: ns.description || 'Nova solução',
                painId: np.tempId,
              }),
            })
              .then((r) => r.json())
              .then((created) => {
                setPains((curr) => {
                  const updated = curr.map((p) =>
                    p.tempId === np.tempId
                      ? {
                          ...p,
                          solutions: p.solutions.map((s) =>
                            s.tempId === ns.tempId
                              ? { ...s, tempId: created.id }
                              : s
                          ),
                        }
                      : p
                  );
                  prevPainsRef.current = updated;
                  return updated;
                });
              });
          }
        }

        // Solution removals
        for (const os of old.solutions) {
          if (!np.solutions.some((s) => s.tempId === os.tempId)) {
            fetch(`/api/solutions/${os.tempId}`, { method: 'DELETE' });
          }
        }

        // Solution edits
        for (const ns of np.solutions) {
          const os = old.solutions.find((s) => s.tempId === ns.tempId);
          if (os && os.description !== ns.description) {
            fetch(`/api/solutions/${ns.tempId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ description: ns.description }),
            });
          }
        }
      }

      // Auto-create todo for pain without solutions
      for (const np of newPains) {
        const old = prev.find((p) => p.tempId === np.tempId);
        if (!old) continue;
        if (
          old.description !== np.description &&
          np.description.trim() &&
          np.solutions.length === 0
        ) {
          const alreadyHasTodo = todos.some((t) => t.painTempId === np.tempId);
          if (!alreadyHasTodo) {
            addTodoForPain(np.tempId, np.description);
          }
        }
      }

      setPains(newPains);
      prevPainsRef.current = newPains;
    },
    [id, todos, addTodoForPain]
  );

  // Delete meeting
  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await fetch(`/api/meetings/${id}`, { method: 'DELETE' });
      router.push('/');
    } catch {
      setDeleting(false);
    }
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando reuniao...</p>
        </div>
      </div>
    );
  }

  if (notFound || !meeting) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <AlertTriangle className="h-6 w-6 text-primary" />
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold">Reuniao nao encontrada</h1>
          <p className="text-sm text-muted-foreground">
            A reuniao solicitada nao existe ou foi removida.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao inicio
        </Button>
      </div>
    );
  }

  const meetingDate = new Date(meeting.date).toLocaleDateString('pt-BR');

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              placeholder="Titulo da reuniao..."
              className="text-xl font-bold border-0 px-0 bg-transparent focus-visible:ring-0 focus-visible:border-0 h-auto"
            />
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {meetingDate}
              </span>
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                {pains.length} dor{pains.length !== 1 ? 'es' : ''}
              </span>
              <span className="flex items-center gap-1.5">
                <ListTodo className="h-3.5 w-3.5" />
                {todos.length} to-do{todos.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <ExcelExport
              todos={todos}
              filename={`reuniao-${sanitizeFilename(title || 'sem-titulo')}-${meetingDate.replace(/\//g, '-')}`}
              meetingDate={meeting.date}
            />
            <Dialog>
              <DialogTrigger
                render={
                  <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" />
                }
              >
                <Trash2 className="h-4 w-4" />
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Deletar reuniao?</DialogTitle>
                  <DialogDescription>
                    Esta acao e irreversivel. Todos os dados desta reuniao
                    (transcricao, dores, solucoes e to-dos) serao removidos.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline" />}>
                    Cancelar
                  </DialogClose>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? 'Deletando...' : 'Confirmar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Transcription */}
      {meeting.transcription && (
        <TranscriptionView text={meeting.transcription} />
      )}

      {/* Pains & Solutions */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground/70 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5" />
          Dores e Solucoes ({pains.length})
        </h2>
        <AnalysisView
          mode="detail"
          context={meeting.context}
          pains={pains}
          onPainsChange={handlePainsChange}
        />
      </div>

      {/* Todos */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground/70 flex items-center gap-2">
          <ListTodo className="h-3.5 w-3.5" />
          To-Dos ({todos.length})
        </h2>
        <TodoTable
          todos={todos}
          onUpdateTodo={updateTodo}
          onAddTodo={addTodo}
          onRemoveTodo={removeTodo}
          participants={participants}
          pains={pains}
          meetingDate={meeting.date.split('T')[0]}
        />
      </div>
    </div>
  );
}
