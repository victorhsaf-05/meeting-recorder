import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { buildAnalysisPrompt } from '@/lib/prompts';
import { apiError } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const { transcription, participants } = await request.json();

  if (!transcription?.trim()) {
    return apiError('Transcrição obrigatória', 400);
  }

  const maxChars = 12000;
  const truncated =
    transcription.length > maxChars
      ? transcription.substring(0, maxChars) + '\n[...transcrição truncada...]'
      : transcription;

  const prompt = buildAnalysisPrompt(truncated, participants || []);

  let content: string | null;
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    content = completion.choices[0]?.message?.content ?? null;
  } catch (error: unknown) {
    console.error('OpenAI error:', error);
    const statusCode =
      error instanceof Object && 'status' in error
        ? (error as { status: number }).status
        : 500;
    let message = 'Erro ao analisar transcrição';
    if (statusCode === 429) message = 'Limite de requisições atingido. Tente novamente em instantes';
    if (statusCode === 401 || statusCode === 403) message = 'Serviço temporariamente indisponível';
    return apiError(message, statusCode);
  }

  if (!content) {
    return apiError('GPT não retornou resposta', 500);
  }

  try {
    const analysis = JSON.parse(content);
    if (!analysis.context || !Array.isArray(analysis.pains)) {
      throw new Error('Estrutura inválida');
    }
    return NextResponse.json(analysis);
  } catch {
    return NextResponse.json(
      { error: 'GPT retornou JSON inválido', raw: content },
      { status: 422 }
    );
  }
}
