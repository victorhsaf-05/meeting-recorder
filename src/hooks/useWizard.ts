'use client';

import { useReducer, useCallback, useMemo } from 'react';
import type {
  WizardState,
  WizardStep,
  Participant,
  GPTAnalysisResponse,
  EditablePain,
  EditableTodo,
} from '@/lib/types';

const STEPS: WizardStep[] = [
  'participants',
  'recording',
  'transcription',
  'analysis',
  'pains-solutions',
  'todos',
  'save',
];

const STEP_LABELS: Record<WizardStep, string> = {
  participants: 'Participantes',
  recording: 'Gravação',
  transcription: 'Transcrição',
  analysis: 'Análise IA',
  'pains-solutions': 'Dores/Soluções',
  todos: 'To-Do',
  save: 'Salvar',
};

type WizardAction =
  | { type: 'SET_STEP'; step: WizardStep }
  | { type: 'SET_PARTICIPANTS'; participants: Participant[] }
  | { type: 'SET_AUDIO'; blob: Blob; fileName?: string }
  | { type: 'SET_TRANSCRIPTION'; text: string }
  | { type: 'SET_ANALYSIS'; analysis: GPTAnalysisResponse }
  | { type: 'SET_PAINS'; pains: EditablePain[] }
  | { type: 'SET_TODOS'; todos: EditableTodo[] }
  | { type: 'SET_TITLE'; title: string }
  | { type: 'RESET' };

const initialState: WizardState = {
  step: 'participants',
  selectedParticipants: [],
  audioBlob: null,
  audioFileName: null,
  transcription: null,
  analysis: null,
  editedPains: [],
  editedTodos: [],
  title: null,
};

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step };
    case 'SET_PARTICIPANTS':
      return { ...state, selectedParticipants: action.participants };
    case 'SET_AUDIO':
      return {
        ...state,
        audioBlob: action.blob,
        audioFileName: action.fileName || null,
      };
    case 'SET_TRANSCRIPTION':
      return { ...state, transcription: action.text };
    case 'SET_ANALYSIS':
      return { ...state, analysis: action.analysis };
    case 'SET_PAINS':
      return { ...state, editedPains: action.pains };
    case 'SET_TODOS':
      return { ...state, editedTodos: action.todos };
    case 'SET_TITLE':
      return { ...state, title: action.title };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function useWizard() {
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  const currentStepIndex = STEPS.indexOf(state.step);

  const canProceed = useMemo(() => {
    switch (state.step) {
      case 'participants':
        return state.selectedParticipants.length > 0;
      case 'recording':
        return state.audioBlob !== null;
      case 'transcription':
        return state.transcription !== null;
      case 'analysis':
        return true; // can always proceed (manual fallback)
      case 'pains-solutions':
        return true;
      case 'todos':
        return true;
      case 'save':
        return false; // last step
      default:
        return false;
    }
  }, [state]);

  const nextStep = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      dispatch({ type: 'SET_STEP', step: STEPS[nextIndex] });
    }
  }, [currentStepIndex]);

  const prevStep = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      dispatch({ type: 'SET_STEP', step: STEPS[prevIndex] });
    }
  }, [currentStepIndex]);

  return {
    state,
    dispatch,
    steps: STEPS,
    stepLabels: STEP_LABELS,
    currentStepIndex,
    canProceed,
    nextStep,
    prevStep,
    isFirstStep: currentStepIndex === 0,
    isLastStep: currentStepIndex === STEPS.length - 1,
  };
}

export { STEPS, STEP_LABELS };
