'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MeetingCard } from '@/components/MeetingCard';
import { Mic, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { MeetingListItem } from '@/lib/types';

export default function HomePage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

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
    <div className="space-y-8">
      {/* Page header */}
      <div className="space-y-1 animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight">Reunioes</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie suas reunioes e acompanhe acoes.
        </p>
      </div>

      {/* Actions bar */}
      <div className="flex items-center gap-3 animate-fade-in">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar reunioes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => router.push('/recording')} className="shrink-0 gap-2">
          <Mic className="h-4 w-4" />
          Nova Gravacao
        </Button>
      </div>

      {/* Content */}
      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-4 flex gap-4">
              <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && meetings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 space-y-4 animate-fade-in">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Mic className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-medium">
              {debouncedSearch ? 'Nenhum resultado' : 'Nenhuma reuniao ainda'}
            </p>
            <p className="text-sm text-muted-foreground">
              {debouncedSearch
                ? 'Tente outro termo de busca.'
                : 'Grave sua primeira reuniao para comecar.'}
            </p>
          </div>
          {!debouncedSearch && (
            <Button variant="outline" onClick={() => router.push('/recording')} className="gap-2">
              <Mic className="h-4 w-4" />
              Gravar primeira reuniao
            </Button>
          )}
        </div>
      )}

      {!loading && meetings.length > 0 && (
        <div className="space-y-3 stagger-children">
          {meetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      )}
    </div>
  );
}
