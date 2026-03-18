'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Copy, Check, FileText, ChevronDown } from 'lucide-react';

interface TranscriptionViewProps {
  isTranscribing?: boolean;
  progress?: { current: number; total: number } | null;
  text?: string;
  error?: string | null;
}

export function TranscriptionView({
  isTranscribing,
  progress,
  text,
  error,
}: TranscriptionViewProps) {
  const textRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (textRef.current && isTranscribing) {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [text, isTranscribing]);

  const handleCopy = useCallback(async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  const progressPercent =
    progress && progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;

  if (isTranscribing && progress) {
    return (
      <div className="glass-card rounded-xl p-5 space-y-3">
        <p className="text-sm text-muted-foreground text-center">
          Transcrevendo parte {progress.current} de {progress.total}...
        </p>
        <Progress value={progressPercent} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-xl p-5">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!text) {
    return (
      <div className="glass-card rounded-xl p-8 flex flex-col items-center justify-center space-y-2">
        <FileText className="h-5 w-5 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Nenhuma transcricao disponivel.</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <FileText className="h-4 w-4" />
          Transcricao
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 gap-1.5 text-xs text-muted-foreground"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copiado' : 'Copiar'}
        </Button>
      </div>

      {/* Content */}
      {expanded && (
        <div
          ref={textRef}
          className="max-h-96 overflow-y-auto px-4 py-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap"
        >
          {text}
        </div>
      )}
    </div>
  );
}
