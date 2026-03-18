'use client';

import Link from 'next/link';
import { Calendar, CheckCircle2, ChevronRight } from 'lucide-react';
import type { MeetingListItem } from '@/lib/types';

interface MeetingCardProps {
  meeting: MeetingListItem;
}

export function MeetingCard({ meeting }: MeetingCardProps) {
  const date = new Date(meeting.date);
  const day = date.toLocaleDateString('pt-BR', { day: '2-digit' });
  const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  const year = date.getFullYear();
  const todoCount = meeting._count.todos;

  return (
    <Link href={`/meeting/${meeting.id}`} className="block group">
      <div className="glass-card flex items-center gap-4 rounded-xl px-4 py-3.5 transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
        {/* Date badge */}
        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
          <span className="text-lg font-bold leading-none">{day}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide">{month}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <h3 className="font-medium truncate group-hover:text-primary transition-colors">
            {meeting.title || 'Reuniao sem titulo'}
          </h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {year}
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {todoCount} to-do{todoCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
      </div>
    </Link>
  );
}
