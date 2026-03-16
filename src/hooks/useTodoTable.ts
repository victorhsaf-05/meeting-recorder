'use client';

import { useState, useCallback } from 'react';
import type { EditableTodo, Participant } from '@/lib/types';

function generateTempId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

interface UseTodoTableProps {
  initialTodos?: EditableTodo[];
  participants?: Participant[];
  meetingDate?: string;
  mode?: 'wizard' | 'api';
  meetingId?: string;
}

export function useTodoTable({
  initialTodos = [],
  participants = [],
  meetingDate = new Date().toISOString().split('T')[0],
  mode = 'wizard',
  meetingId,
}: UseTodoTableProps = {}) {
  const [todos, setTodos] = useState<EditableTodo[]>(initialTodos);

  const addTodo = useCallback(() => {
    const newTodo: EditableTodo = {
      tempId: generateTempId(),
      action: '',
      responsible: '',
      actionOwner: '',
      costCenter: '',
      account: '',
      deadline: '',
      status: 'Pendente',
      painTempId: null,
    };

    if (mode === 'api' && meetingId) {
      fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: '',
          meetingDate,
          meetingId,
          status: 'Pendente',
        }),
      })
        .then((res) => res.json())
        .then((created) => {
          setTodos((prev) => [...prev, { ...newTodo, tempId: created.id }]);
        })
        .catch((err) => {
          console.error('Error adding todo:', err);
        });
      return;
    }

    setTodos((prev) => [...prev, newTodo]);
  }, [mode, meetingId, meetingDate]);

  const removeTodo = useCallback(
    (tempId: string) => {
      setTodos((prev) => prev.filter((t) => t.tempId !== tempId));
      if (mode === 'api') {
        fetch(`/api/todos/${tempId}`, { method: 'DELETE' }).catch((err) => {
          console.error('Error removing todo:', err);
        });
      }
    },
    [mode]
  );

  const updateTodo = useCallback(
    (tempId: string, field: keyof EditableTodo, value: string) => {
      setTodos((prev) =>
        prev.map((todo) => {
          if (todo.tempId !== tempId) return todo;
          const updated = { ...todo, [field]: value };

          if (field === 'responsible') {
            const participant = participants.find((p) => p.name === value);
            if (participant?.costCenter) {
              updated.costCenter = participant.costCenter;
            }
          }

          return updated;
        })
      );

      if (mode === 'api' && field !== 'painTempId' && field !== 'tempId') {
        const payload: Record<string, string> = { [field]: value };
        if (field === 'responsible') {
          const participant = participants.find((p) => p.name === value);
          if (participant?.costCenter) {
            payload.costCenter = participant.costCenter;
          }
        }
        fetch(`/api/todos/${tempId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch((err) => {
          console.error('Error updating todo:', err);
        });
      }
    },
    [mode, participants]
  );

  return { todos, setTodos, addTodo, removeTodo, updateTodo };
}
