'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

interface AudioRecorderProps {
  onAudioReady?: (blob: Blob) => void;
  disabled?: boolean;
}

export function AudioRecorder({ onAudioReady, disabled }: AudioRecorderProps) {
  const {
    status,
    audioBlob,
    audioUrl,
    elapsedSeconds,
    error,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  useEffect(() => {
    if (audioBlob && status === 'stopped') {
      onAudioReady?.(audioBlob);
    }
  }, [audioBlob, status, onAudioReady]);

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {(status === 'recording' || status === 'paused') && (
          <div className="flex items-center justify-center gap-3">
            <span
              className={`inline-block h-3 w-3 rounded-full ${
                status === 'recording' ? 'animate-pulse bg-red-500' : 'bg-yellow-500'
              }`}
            />
            <span className="font-mono text-2xl">{formatTime(elapsedSeconds)}</span>
          </div>
        )}

        <div className="flex items-center justify-center gap-2">
          {status === 'idle' && (
            <Button onClick={startRecording} disabled={disabled}>
              Gravar
            </Button>
          )}

          {status === 'recording' && (
            <>
              <Button variant="outline" onClick={pauseRecording}>
                Pausar
              </Button>
              <Button variant="destructive" onClick={stopRecording}>
                Parar
              </Button>
            </>
          )}

          {status === 'paused' && (
            <>
              <Button variant="outline" onClick={resumeRecording}>
                Continuar
              </Button>
              <Button variant="destructive" onClick={stopRecording}>
                Parar
              </Button>
            </>
          )}

          {status === 'stopped' && audioUrl && (
            <Button variant="outline" onClick={resetRecording}>
              Descartar
            </Button>
          )}
        </div>

        {status === 'stopped' && audioUrl && (
          <div className="flex justify-center">
            <audio controls src={audioUrl} className="w-full max-w-md" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { formatTime };
