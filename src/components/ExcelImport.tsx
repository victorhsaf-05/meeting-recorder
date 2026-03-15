'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { readExcelFile } from '@/lib/excel';
import type { ImportExcelRequest, TodoStatus } from '@/lib/types';

const APP_COLUMNS = [
  { key: 'action', label: 'TO-DO' },
  { key: 'responsible', label: 'Responsável' },
  { key: 'actionOwner', label: 'Resp. pela ação' },
  { key: 'costCenter', label: 'Centro de custo' },
  { key: 'meetingDate', label: 'Data reunião' },
  { key: 'account', label: 'Conta' },
  { key: 'deadline', label: 'Prazo' },
  { key: 'status', label: 'Status' },
] as const;

type AppColumnKey = (typeof APP_COLUMNS)[number]['key'];

interface ExcelImportProps {
  onImported: () => void;
}

type Step = 'upload' | 'mapping' | 'preview';

export function ExcelImport({ onImported }: ExcelImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, AppColumnKey | ''>>({});
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setError(null);

      try {
        const { headers: h, rows: r } = await readExcelFile(file);
        if (h.length === 0) {
          setError('Arquivo vazio ou formato inválido.');
          return;
        }
        setHeaders(h);
        setRows(r);
        setMapping({});
        setTitle(file.name.replace(/\.xlsx?$/i, ''));
        setStep('mapping');
      } catch {
        setError('Erro ao ler arquivo. Verifique se é um .xlsx válido.');
      }

      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    []
  );

  const handleMappingChange = useCallback(
    (excelHeader: string, appCol: string) => {
      setMapping((prev) => ({
        ...prev,
        [excelHeader]: appCol as AppColumnKey | '',
      }));
    },
    []
  );

  const mappedRows = rows.map((row) => {
    const mapped: Record<string, string> = {};
    for (const [excelHeader, appCol] of Object.entries(mapping)) {
      if (appCol) {
        mapped[appCol] = row[excelHeader] || '';
      }
    }
    return mapped;
  });

  const hasActionMapped = Object.values(mapping).includes('action');

  const handleImport = useCallback(async () => {
    if (!title.trim() || !date || !hasActionMapped) return;

    setImporting(true);
    setError(null);

    const VALID_STATUSES: TodoStatus[] = [
      'Pendente',
      'Em andamento',
      'Concluido',
      'Cancelado',
    ];

    const request: ImportExcelRequest = {
      title: title.trim(),
      date,
      todos: mappedRows
        .filter((r) => r.action?.trim())
        .map((r) => ({
          action: r.action,
          responsible: r.responsible || undefined,
          actionOwner: r.actionOwner || undefined,
          costCenter: r.costCenter || undefined,
          account: r.account || undefined,
          deadline: r.deadline || undefined,
          meetingDate: r.meetingDate || undefined,
          status: VALID_STATUSES.includes(r.status as TodoStatus)
            ? (r.status as TodoStatus)
            : undefined,
        })),
    };

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao importar');
      }

      setStep('upload');
      setHeaders([]);
      setRows([]);
      setMapping({});
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar');
    } finally {
      setImporting(false);
    }
  }, [title, date, hasActionMapped, mappedRows, onImported]);

  const handleCancel = useCallback(() => {
    setStep('upload');
    setHeaders([]);
    setRows([]);
    setMapping({});
    setError(null);
  }, []);

  if (step === 'upload') {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          Importar Excel
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
        />
        {error && <p className="text-sm text-destructive mt-1">{error}</p>}
      </>
    );
  }

  if (step === 'mapping') {
    return (
      <Card>
        <CardContent className="space-y-4 pt-6">
          <h3 className="text-lg font-semibold">Mapear Colunas</h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Título da reunião
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título..."
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Data
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            {headers.map((header) => (
              <div
                key={header}
                className="flex items-center gap-3"
              >
                <span className="text-sm min-w-[150px] truncate" title={header}>
                  {header}
                </span>
                <Select
                  value={mapping[header] || undefined}
                  onValueChange={(v) =>
                    v && handleMappingChange(header, v === ('__none__' as string) ? '' : v)
                  }
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="(não mapear)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">(não mapear)</SelectItem>
                    {APP_COLUMNS.map((col) => (
                      <SelectItem key={col.key} value={col.key}>
                        {col.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          {!hasActionMapped && (
            <p className="text-sm text-destructive">
              Mapeie pelo menos a coluna &quot;TO-DO&quot; para continuar.
            </p>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={!hasActionMapped || !title.trim() || !date}
              onClick={() => setStep('preview')}
            >
              Preview
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // step === 'preview'
  const previewRows = mappedRows.filter((r) => r.action?.trim()).slice(0, 10);

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <h3 className="text-lg font-semibold">Preview da Importação</h3>
        <p className="text-sm text-muted-foreground">
          {mappedRows.filter((r) => r.action?.trim()).length} to-do(s) serão
          importados. Mostrando até 10.
        </p>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {APP_COLUMNS.filter((c) =>
                  Object.values(mapping).includes(c.key)
                ).map((col) => (
                  <TableHead key={col.key}>{col.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.map((row, i) => (
                <TableRow key={i}>
                  {APP_COLUMNS.filter((c) =>
                    Object.values(mapping).includes(c.key)
                  ).map((col) => (
                    <TableCell key={col.key} className="text-sm">
                      {row[col.key] || '—'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2">
          <Button size="sm" onClick={handleImport} disabled={importing}>
            {importing ? 'Importando...' : 'Confirmar Importação'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setStep('mapping')}
            disabled={importing}
          >
            Voltar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={importing}
          >
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
