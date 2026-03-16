import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { NextResponse } from "next/server"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR');
}

export function apiError(message: string, status: number, code?: string) {
  return NextResponse.json(
    { error: message, ...(code && { code }) },
    { status }
  );
}

export function parseDate(value: string): Date | null {
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export function parseDateOrFail(value: string, fieldName: string): Date {
  const d = parseDate(value);
  if (!d) throw new Error(`Data inválida em ${fieldName}: ${value}`);
  return d;
}

export function handlePrismaError(error: unknown, notFoundMsg: string) {
  if (error instanceof Object && 'code' in error) {
    const code = (error as { code: string }).code;
    if (code === 'P2025') return apiError(notFoundMsg, 404);
    if (code === 'P2002') return apiError('Registro duplicado', 409);
    if (code === 'P2003') return apiError('Referência inválida', 400);
  }
  console.error('Database error:', error);
  return apiError('Erro interno do servidor', 500);
}
