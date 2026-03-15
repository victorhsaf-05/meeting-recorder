'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

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

  useEffect(() => {
    if (textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [text]);

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

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {isTranscribing && progress && (
          <div className="space-y-2">
            <p className="text-center text-sm text-muted-foreground">
              Transcrevendo parte {progress.current} de {progress.total}...
            </p>
            <Progress value={progressPercent} />
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {text && (
          <>
            <div
              ref={textRef}
              className="max-h-80 overflow-y-auto rounded-md border p-4 text-sm whitespace-pre-wrap"
            >
              {text}
            </div>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? 'Copiado!' : 'Copiar'}
              </Button>
            </div>
          </>
        )}

        {!isTranscribing && !text && !error && (
          <p className="text-center text-sm text-muted-foreground">
            Nenhuma transcrição disponível.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
