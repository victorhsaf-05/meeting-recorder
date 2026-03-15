import * as XLSX from 'xlsx';
import { formatDate } from './utils';
import type { EditableTodo } from './types';

export function exportTodosToExcel(
  todos: EditableTodo[],
  filename: string,
  meetingDate?: string
) {
  const data = todos.map((t) => ({
    Responsável: t.responsible || '',
    'Responsável pela ação': t.actionOwner || '',
    'Centro de custo': t.costCenter || '',
    'Data reunião': meetingDate ? formatDate(meetingDate) : '',
    Conta: t.account || '',
    'TO-DO': t.action,
    Prazo: t.deadline ? formatDate(t.deadline) : '',
    Status: t.status,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'To-Dos');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function readExcelFile(
  file: File
): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, {
          header: 1,
        });

        if (jsonData.length < 2) {
          resolve({ headers: [], rows: [] });
          return;
        }

        const headers = (jsonData[0] as string[]).map((h) =>
          String(h || '').trim()
        );
        const rows = jsonData.slice(1).map((row) => {
          const obj: Record<string, string> = {};
          headers.forEach((h, i) => {
            obj[h] = String((row as string[])[i] ?? '').trim();
          });
          return obj;
        });

        resolve({ headers, rows });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\u00C0-\u024F\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 50);
}
