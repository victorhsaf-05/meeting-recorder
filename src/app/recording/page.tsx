'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { WizardStepper } from '@/components/WizardStepper';
import { ParticipantSelector } from '@/components/ParticipantSelector';
import { AudioRecorder } from '@/components/AudioRecorder';
import { AudioUpload } from '@/components/AudioUpload';
import { TranscriptionView } from '@/components/TranscriptionView';
import { AnalysisView, generateTempId } from '@/components/AnalysisView';
import { TodoTable } from '@/components/TodoTable';
import { useWizard } from '@/hooks/useWizard';
import { useChunkedTranscription } from '@/hooks/useChunkedTranscription';
import type {
  EditablePain,
  EditableTodo,
  GPTAnalysisResponse,
  CreateMeetingRequest,
} from '@/lib/types';

export default function RecordingPage() {
  const router = useRouter();
  const { state, dispatch, steps, currentStepIndex, canProceed, nextStep, prevStep, isFirstStep, isLastStep } = useWizard();
  const { isTranscribing, progress, partialText, error: transcriptionError, transcribe } = useChunkedTranscription();

  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const transcriptionStarted = useRef(false);
  const analysisStarted = useRef(false);

  // Step 3: Auto-start transcription
  useEffect(() => {
    if (state.step === 'transcription' && state.audioBlob && !state.transcription && !transcriptionStarted.current) {
      transcriptionStarted.current = true;
      transcribe(state.audioBlob).then((text) => {
        dispatch({ type: 'SET_TRANSCRIPTION', text });
      });
    }
  }, [state.step, state.audioBlob, state.transcription, transcribe, dispatch]);

  // Step 4: Auto-start analysis
  useEffect(() => {
    if (state.step === 'analysis' && state.transcription && !state.analysis && !analysisStarted.current && !analysisLoading) {
      analysisStarted.current = true;
      runAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step, state.transcription, state.analysis]);

  const runAnalysis = useCallback(async () => {
    if (!state.transcription) return;
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcription: state.transcription,
          participants: state.selectedParticipants.map((p) => ({
            name: p.name,
            costCenter: p.costCenter,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro na análise');
      }

      const analysis: GPTAnalysisResponse = await res.json();
      dispatch({ type: 'SET_ANALYSIS', analysis });

      // Convert analysis to editable pains and todos
      const pains: EditablePain[] = analysis.pains.map((p) => ({
        tempId: generateTempId(),
        description: p.description,
        solutions: p.solutions.map((s) => ({
          tempId: generateTempId(),
          description: s,
        })),
      }));
      dispatch({ type: 'SET_PAINS', pains });

      const todos: EditableTodo[] = [];
      analysis.pains.forEach((p, pi) => {
        p.actions.forEach((a) => {
          const responsible = a.responsible || '';
          const participant = state.selectedParticipants.find(
            (pp) => pp.name.toLowerCase() === responsible.toLowerCase()
          );
          todos.push({
            tempId: generateTempId(),
            action: a.action,
            responsible,
            actionOwner: a.actionOwner || '',
            costCenter: participant?.costCenter || '',
            account: a.account || '',
            deadline: a.deadline || '',
            status: 'Pendente',
            painTempId: pains[pi].tempId,
          });
        });
      });
      dispatch({ type: 'SET_TODOS', todos });

      if (analysis.title) {
        dispatch({ type: 'SET_TITLE', title: analysis.title });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro na análise';
      setAnalysisError(message);
    } finally {
      setAnalysisLoading(false);
    }
  }, [state.transcription, state.selectedParticipants, dispatch]);

  const handleSkipAnalysis = useCallback(() => {
    dispatch({ type: 'SET_PAINS', pains: [] });
    dispatch({ type: 'SET_TODOS', todos: [] });
    nextStep();
  }, [dispatch, nextStep]);

  const handleRetryAnalysis = useCallback(() => {
    analysisStarted.current = false;
    setAnalysisError(null);
    runAnalysis();
  }, [runAnalysis]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const meetingDate = new Date().toISOString();
      const request: CreateMeetingRequest = {
        title: state.title,
        date: meetingDate,
        transcription: state.transcription!,
        context: state.analysis?.context || null,
        participantIds: state.selectedParticipants.map((p) => p.id),
        pains: state.editedPains.map((pain) => ({
          description: pain.description,
          solutions: pain.solutions.map((s) => s.description),
          todos: state.editedTodos
            .filter((t) => t.painTempId === pain.tempId)
            .map((t) => ({
              action: t.action,
              responsible: t.responsible || undefined,
              actionOwner: t.actionOwner || undefined,
              costCenter: t.costCenter || undefined,
              account: t.account || undefined,
              deadline: t.deadline || undefined,
              meetingDate,
            })),
        })),
        orphanTodos: state.editedTodos
          .filter((t) => !t.painTempId)
          .map((t) => ({
            action: t.action,
            responsible: t.responsible || undefined,
            actionOwner: t.actionOwner || undefined,
            costCenter: t.costCenter || undefined,
            account: t.account || undefined,
            deadline: t.deadline || undefined,
            meetingDate,
          })),
      };

      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao salvar');
      }

      const meeting = await res.json();
      router.push(`/meeting/${meeting.id}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erro ao salvar reunião');
      setSaving(false);
    }
  }, [state, router]);

  const handleUpdateTodo = useCallback(
    (tempId: string, field: keyof EditableTodo, value: string) => {
      const updated = state.editedTodos.map((t) => {
        if (t.tempId !== tempId) return t;
        const u = { ...t, [field]: value };
        if (field === 'responsible') {
          const participant = state.selectedParticipants.find((p) => p.name === value);
          if (participant?.costCenter) u.costCenter = participant.costCenter;
        }
        return u;
      });
      dispatch({ type: 'SET_TODOS', todos: updated });
    },
    [state.editedTodos, state.selectedParticipants, dispatch]
  );

  const handleAddTodo = useCallback(() => {
    const newTodo: EditableTodo = {
      tempId: generateTempId(),
      action: '',
      responsible: '',
      actionOwner: '',
      costCenter: '',
      account: '',
      deadline: '',
      status: 'Pendente',
      painTempId: null,
    };
    dispatch({ type: 'SET_TODOS', todos: [...state.editedTodos, newTodo] });
  }, [state.editedTodos, dispatch]);

  const handleRemoveTodo = useCallback(
    (tempId: string) => {
      dispatch({
        type: 'SET_TODOS',
        todos: state.editedTodos.filter((t) => t.tempId !== tempId),
      });
    },
    [state.editedTodos, dispatch]
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nova Gravação</h1>

      <WizardStepper steps={steps} currentStepIndex={currentStepIndex} />

      {/* Step 1: Participants */}
      {state.step === 'participants' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Selecione os Participantes</h2>
          <ParticipantSelector
            selectedParticipants={state.selectedParticipants}
            onSelectionChange={(participants) =>
              dispatch({ type: 'SET_PARTICIPANTS', participants })
            }
          />
        </div>
      )}

      {/* Step 2: Recording/Upload */}
      {state.step === 'recording' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Gravação ou Upload de Áudio</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-medium">Gravar Áudio</h3>
              <AudioRecorder
                onAudioReady={(blob) =>
                  dispatch({ type: 'SET_AUDIO', blob })
                }
              />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium">Upload de Arquivo</h3>
              <AudioUpload
                onAudioReady={(blob, fileName) =>
                  dispatch({ type: 'SET_AUDIO', blob, fileName })
                }
                onAudioClear={() =>
                  dispatch({ type: 'SET_AUDIO', blob: null as unknown as Blob })
                }
              />
            </div>
          </div>
          {state.audioBlob && (
            <p className="text-sm text-muted-foreground text-center">
              Áudio pronto ({(state.audioBlob.size / (1024 * 1024)).toFixed(1)} MB)
              {state.audioFileName && ` — ${state.audioFileName}`}
            </p>
          )}
        </div>
      )}

      {/* Step 3: Transcription */}
      {state.step === 'transcription' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Transcrição</h2>
          <TranscriptionView
            isTranscribing={isTranscribing}
            progress={progress}
            text={state.transcription || partialText || undefined}
            error={transcriptionError}
          />
        </div>
      )}

      {/* Step 4: Analysis */}
      {state.step === 'analysis' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Análise com IA</h2>
          {analysisLoading && (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">
                    Analisando transcrição com IA...
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          {analysisError && (
            <Card>
              <CardContent className="space-y-4 pt-6">
                <p className="text-sm text-destructive">{analysisError}</p>
                <div className="flex gap-2">
                  <Button onClick={handleRetryAnalysis}>
                    Tentar novamente
                  </Button>
                  <Button variant="outline" onClick={handleSkipAnalysis}>
                    Preencher manualmente
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          {state.analysis && !analysisLoading && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Análise concluída. {state.analysis.pains.length} dor(es) identificada(s).
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Step 5: Pains/Solutions */}
      {state.step === 'pains-solutions' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Dores e Soluções</h2>
          <AnalysisView
            mode="wizard"
            context={state.analysis?.context}
            pains={state.editedPains}
            onPainsChange={(pains) =>
              dispatch({ type: 'SET_PAINS', pains })
            }
          />
        </div>
      )}

      {/* Step 6: Todos */}
      {state.step === 'todos' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Tabela de To-Do</h2>
          <TodoTable
            todos={state.editedTodos}
            onUpdateTodo={handleUpdateTodo}
            onAddTodo={handleAddTodo}
            onRemoveTodo={handleRemoveTodo}
            participants={state.selectedParticipants}
            pains={state.editedPains}
            meetingDate={new Date().toISOString().split('T')[0]}
          />
        </div>
      )}

      {/* Step 7: Save */}
      {state.step === 'save' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Salvar Reunião</h2>
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div>
                <label className="text-sm font-medium">Título da Reunião</label>
                <Input
                  value={state.title || ''}
                  onChange={(e) =>
                    dispatch({ type: 'SET_TITLE', title: e.target.value })
                  }
                  placeholder="Título da reunião..."
                  className="mt-1"
                />
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>{state.selectedParticipants.length} participante(s)</p>
                <p>{state.editedPains.length} dor(es)</p>
                <p>{state.editedTodos.length} to-do(s)</p>
              </div>
              {saveError && (
                <p className="text-sm text-destructive">{saveError}</p>
              )}
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? 'Salvando...' : 'Salvar Reunião'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={isFirstStep}
        >
          Voltar
        </Button>
        {!isLastStep && (
          <Button onClick={nextStep} disabled={!canProceed}>
            Próximo
          </Button>
        )}
      </div>
    </div>
  );
}
