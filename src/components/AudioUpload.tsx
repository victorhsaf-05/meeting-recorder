'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const ACCEPTED_MIME_TYPES = [
  'audio/mp4',
  'audio/x-m4a',
  'audio/mpeg',
  'audio/wav',
  'audio/webm',
];

const ACCEPTED_EXTENSIONS = ['.m4a', '.mp3', '.wav', '.webm'];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isValidAudioFile(file: File): boolean {
  if (ACCEPTED_MIME_TYPES.includes(file.type)) return true;
  // Fallback: check extension if type is empty
  if (!file.type) {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    return ACCEPTED_EXTENSIONS.includes(ext);
  }
  return false;
}

interface AudioUploadProps {
  onAudioReady?: (blob: Blob, fileName?: string) => void;
  onAudioClear?: () => void;
  disabled?: boolean;
}

export function AudioUpload({ onAudioReady, onAudioClear, disabled }: AudioUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setError(null);

      if (!isValidAudioFile(file)) {
        setError('Formato não suportado. Use m4a, mp3, wav ou webm.');
        // Reset the input
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Revoke previous URL
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }

      const url = URL.createObjectURL(file);
      audioUrlRef.current = url;
      setSelectedFile(file);
      setAudioUrl(url);
      onAudioReady?.(file, file.name);
    },
    [onAudioReady],
  );

  const handleRemove = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setSelectedFile(null);
    setAudioUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onAudioClear?.();
  }, [onAudioClear]);

  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {!selectedFile ? (
          <div className="flex justify-center">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
            >
              Upload Áudio
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/mp4,audio/x-m4a,audio/mpeg,audio/wav,audio/webm"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-center text-sm">
              {selectedFile.name} — {formatFileSize(selectedFile.size)}
            </p>

            {audioUrl && (
              <div className="flex justify-center">
                <audio controls src={audioUrl} className="w-full max-w-md" />
              </div>
            )}

            <div className="flex justify-center">
              <Button variant="outline" onClick={handleRemove}>
                Remover
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { formatFileSize, isValidAudioFile };
