'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MeetingCard } from '@/components/MeetingCard';
import type { MeetingListItem } from '@/lib/types';

export default function HomePage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch meetings
  useEffect(() => {
    const params = debouncedSearch
      ? `?search=${encodeURIComponent(debouncedSearch)}`
      : '';
    fetch(`/api/meetings${params}`)
      .then((res) => res.json())
      .then((data: MeetingListItem[]) => {
        setMeetings(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [debouncedSearch]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reuniões</h1>
        <Button onClick={() => router.push('/recording')}>
          Nova Gravação
        </Button>
      </div>

      <Input
        placeholder="Buscar reuniões..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Carregando reuniões...</p>
          </div>
        </div>
      )}

      {!loading && meetings.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {debouncedSearch
              ? 'Nenhuma reunião encontrada para esta busca.'
              : 'Nenhuma reunião gravada ainda.'}
          </p>
          {!debouncedSearch && (
            <Button variant="outline" onClick={() => router.push('/recording')}>
              Gravar primeira reunião
            </Button>
          )}
        </div>
      )}

      {!loading && meetings.length > 0 && (
        <div className="space-y-3">
          {meetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      )}
    </div>
  );
}
