const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB

export function calculateChunks(blob: Blob): number {
  return Math.ceil(blob.size / CHUNK_SIZE);
}

export function getChunk(blob: Blob, index: number): Blob {
  const start = index * CHUNK_SIZE;
  const end = Math.min(start + CHUNK_SIZE, blob.size);
  return blob.slice(start, end, blob.type);
}

export function getExtensionFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/mp4': 'm4a',
    'audio/x-m4a': 'm4a',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/wave': 'wav',
  };
  return map[mimeType] || 'webm';
}

export async function transcribeWithChunking(
  audioBlob: Blob,
  onProgress: (current: number, total: number) => void
): Promise<string> {
  const totalChunks = calculateChunks(audioBlob);
  const texts: string[] = [];
  const ext = getExtensionFromMime(audioBlob.type);

  for (let i = 0; i < totalChunks; i++) {
    onProgress(i + 1, totalChunks);

    const chunk = getChunk(audioBlob, i);
    const formData = new FormData();
    formData.append('audio', chunk, `chunk-${i}.${ext}`);

    let lastError: Error | null = null;
    let success = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch('/api/transcribe', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Chunk ${i + 1} failed`);
        }

        const { text } = await res.json();
        texts.push(text);
        success = true;
        break;
      } catch (err) {
        lastError = err as Error;
        if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }

    if (!success) {
      texts.push(`[...chunk ${i + 1} falhou: ${lastError?.message}...]`);
    }
  }

  return texts.join(' ');
}
