import type { Participant } from '@/lib/types';

const API_BASE = '/api';

export async function getParticipants(): Promise<Participant[]> {
  const res = await fetch(`${API_BASE}/participants`);
  if (!res.ok) throw new Error('Failed to fetch participants');
  return res.json();
}

export async function createParticipant(data: {
  name: string;
  costCenter?: string;
  role?: string;
}): Promise<Participant> {
  const res = await fetch(`${API_BASE}/participants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create participant');
  }
  return res.json();
}

export async function updateParticipant(
  id: string,
  data: Partial<Pick<Participant, 'name' | 'costCenter' | 'role'>>
): Promise<Participant> {
  const res = await fetch(`${API_BASE}/participants/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update participant');
  }
  return res.json();
}

export async function deleteParticipant(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/participants/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete participant');
  }
}
