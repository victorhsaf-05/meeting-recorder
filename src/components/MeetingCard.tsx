'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import type { MeetingListItem } from '@/lib/types';

interface MeetingCardProps {
  meeting: MeetingListItem;
}

export function MeetingCard({ meeting }: MeetingCardProps) {
  const date = new Date(meeting.date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Link href={`/meeting/${meeting.id}`} className="block">
      <Card className="transition-colors hover:bg-accent/50">
        <CardContent className="flex items-center justify-between py-4">
          <div className="space-y-1">
            <h3 className="font-medium">
              {meeting.title || 'Reunião sem título'}
            </h3>
            <p className="text-sm text-muted-foreground">{date}</p>
          </div>
          <div className="text-sm text-muted-foreground">
            {meeting._count.todos} to-do{meeting._count.todos !== 1 ? 's' : ''}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
