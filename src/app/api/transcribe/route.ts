import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { apiError } from '@/lib/utils';

const MAX_CHUNK_SIZE = 4.5 * 1024 * 1024; // 4.5MB

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const audioFile = formData.get('audio') as File | null;

  if (!audioFile) {
    return apiError('Audio file required', 400);
  }

  if (audioFile.size > MAX_CHUNK_SIZE) {
    return apiError('Chunk excede 4.5MB. Use chunking no client.', 400);
  }

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'pt',
    });

    return NextResponse.json({ text: transcription.text });
  } catch (error: unknown) {
    const status =
      error instanceof Object && 'status' in error
        ? (error as { status: number }).status
        : 500;
    const message =
      error instanceof Error ? error.message : 'Erro ao transcrever audio';
    return apiError(message, status);
  }
}
