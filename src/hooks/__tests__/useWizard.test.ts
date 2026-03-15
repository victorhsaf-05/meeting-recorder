import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWizard } from '../useWizard';
import type { Participant, GPTAnalysisResponse } from '@/lib/types';

describe('useWizard', () => {
  it('starts at participants step', () => {
    const { result } = renderHook(() => useWizard());
    expect(result.current.state.step).toBe('participants');
    expect(result.current.currentStepIndex).toBe(0);
    expect(result.current.isFirstStep).toBe(true);
    expect(result.current.isLastStep).toBe(false);
  });

  it('cannot proceed from participants without selecting any', () => {
    const { result } = renderHook(() => useWizard());
    expect(result.current.canProceed).toBe(false);
  });

  it('can proceed after selecting participants', () => {
    const { result } = renderHook(() => useWizard());
    const participant: Participant = {
      id: '1',
      name: 'João',
      costCenter: null,
      role: null,
      createdAt: '',
      updatedAt: '',
    };

    act(() => {
      result.current.dispatch({
        type: 'SET_PARTICIPANTS',
        participants: [participant],
      });
    });

    expect(result.current.canProceed).toBe(true);
  });

  it('navigates to next step', () => {
    const { result } = renderHook(() => useWizard());

    act(() => {
      result.current.dispatch({
        type: 'SET_PARTICIPANTS',
        participants: [
          { id: '1', name: 'Test', costCenter: null, role: null, createdAt: '', updatedAt: '' },
        ],
      });
    });

    act(() => {
      result.current.nextStep();
    });

    expect(result.current.state.step).toBe('recording');
    expect(result.current.currentStepIndex).toBe(1);
    expect(result.current.isFirstStep).toBe(false);
  });

  it('navigates back to previous step', () => {
    const { result } = renderHook(() => useWizard());

    act(() => {
      result.current.dispatch({ type: 'SET_STEP', step: 'recording' });
    });

    act(() => {
      result.current.prevStep();
    });

    expect(result.current.state.step).toBe('participants');
  });

  it('does not go before first step', () => {
    const { result } = renderHook(() => useWizard());

    act(() => {
      result.current.prevStep();
    });

    expect(result.current.state.step).toBe('participants');
  });

  it('does not go past last step', () => {
    const { result } = renderHook(() => useWizard());

    act(() => {
      result.current.dispatch({ type: 'SET_STEP', step: 'save' });
    });

    act(() => {
      result.current.nextStep();
    });

    expect(result.current.state.step).toBe('save');
    expect(result.current.isLastStep).toBe(true);
  });

  it('stores audio blob', () => {
    const { result } = renderHook(() => useWizard());
    const blob = new Blob(['audio'], { type: 'audio/webm' });

    act(() => {
      result.current.dispatch({ type: 'SET_AUDIO', blob, fileName: 'test.webm' });
    });

    expect(result.current.state.audioBlob).toBe(blob);
    expect(result.current.state.audioFileName).toBe('test.webm');
  });

  it('stores transcription', () => {
    const { result } = renderHook(() => useWizard());

    act(() => {
      result.current.dispatch({ type: 'SET_TRANSCRIPTION', text: 'Transcrição de teste' });
    });

    expect(result.current.state.transcription).toBe('Transcrição de teste');
  });

  it('stores analysis result', () => {
    const { result } = renderHook(() => useWizard());
    const analysis: GPTAnalysisResponse = {
      title: 'Reunião de Sprint',
      context: 'Contexto da reunião',
      pains: [{ description: 'Dor 1', solutions: ['Sol 1'], actions: [] }],
    };

    act(() => {
      result.current.dispatch({ type: 'SET_ANALYSIS', analysis });
    });

    expect(result.current.state.analysis).toEqual(analysis);
  });

  it('stores title', () => {
    const { result } = renderHook(() => useWizard());

    act(() => {
      result.current.dispatch({ type: 'SET_TITLE', title: 'Minha Reunião' });
    });

    expect(result.current.state.title).toBe('Minha Reunião');
  });

  it('resets to initial state', () => {
    const { result } = renderHook(() => useWizard());

    act(() => {
      result.current.dispatch({ type: 'SET_TITLE', title: 'Test' });
      result.current.dispatch({ type: 'SET_STEP', step: 'save' });
    });

    act(() => {
      result.current.dispatch({ type: 'RESET' });
    });

    expect(result.current.state.step).toBe('participants');
    expect(result.current.state.title).toBeNull();
  });

  it('has 7 steps', () => {
    const { result } = renderHook(() => useWizard());
    expect(result.current.steps).toHaveLength(7);
  });

  it('cannot proceed from recording without audio', () => {
    const { result } = renderHook(() => useWizard());

    act(() => {
      result.current.dispatch({ type: 'SET_STEP', step: 'recording' });
    });

    expect(result.current.canProceed).toBe(false);
  });

  it('can proceed from recording with audio', () => {
    const { result } = renderHook(() => useWizard());
    const blob = new Blob(['audio']);

    act(() => {
      result.current.dispatch({ type: 'SET_STEP', step: 'recording' });
      result.current.dispatch({ type: 'SET_AUDIO', blob });
    });

    expect(result.current.canProceed).toBe(true);
  });
});
