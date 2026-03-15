'use client';

import { useState, useCallback, useRef } from 'react';
import { transcribeWithChunking } from '@/lib/audio';

interface ChunkedTranscriptionProgress {
  current: number;
  total: number;
}

interface UseChunkedTranscriptionReturn {
  isTranscribing: boolean;
  progress: ChunkedTranscriptionProgress | null;
  partialText: string;
  error: string | null;
  transcribe: (audioBlob: Blob) => Promise<string>;
  reset: () => void;
}

export function useChunkedTranscription(): UseChunkedTranscriptionReturn {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progress, setProgress] = useState<ChunkedTranscriptionProgress | null>(null);
  const [partialText, setPartialText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const reset = useCallback(() => {
    setIsTranscribing(false);
    setProgress(null);
    setPartialText('');
    setError(null);
    abortRef.current = false;
  }, []);

  const transcribe = useCallback(async (audioBlob: Blob): Promise<string> => {
    setIsTranscribing(true);
    setProgress(null);
    setPartialText('');
    setError(null);
    abortRef.current = false;

    try {
      const text = await transcribeWithChunking(audioBlob, (current, total) => {
        setProgress({ current, total });
      });

      const hasFailedChunks = text.includes('[...chunk');
      if (hasFailedChunks) {
        setError('Alguns trechos não puderam ser transcritos.');
      }

      setPartialText(text);
      setIsTranscribing(false);
      return text;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro na transcrição';
      setError(message);
      setIsTranscribing(false);
      throw err;
    }
  }, []);

  return {
    isTranscribing,
    progress,
    partialText,
    error,
    transcribe,
    reset,
  };
}
