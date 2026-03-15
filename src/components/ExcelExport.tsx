'use client';

import { Button } from '@/components/ui/button';
import { exportTodosToExcel } from '@/lib/excel';
import type { EditableTodo } from '@/lib/types';

interface ExcelExportProps {
  todos: EditableTodo[];
  filename: string;
  meetingDate?: string;
}

export function ExcelExport({ todos, filename, meetingDate }: ExcelExportProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={todos.length === 0}
      onClick={() => exportTodosToExcel(todos, filename, meetingDate)}
    >
      Exportar Excel
    </Button>
  );
}
