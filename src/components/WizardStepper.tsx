'use client';

import { cn } from '@/lib/utils';
import type { WizardStep } from '@/lib/types';
import { STEP_LABELS } from '@/hooks/useWizard';

interface WizardStepperProps {
  steps: WizardStep[];
  currentStepIndex: number;
}

export function WizardStepper({ steps, currentStepIndex }: WizardStepperProps) {
  return (
    <nav aria-label="Progresso do wizard" className="mb-6">
      <ol className="flex items-center gap-1 overflow-x-auto">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <li key={step} className="flex items-center gap-1 shrink-0">
              <div
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  isCompleted && 'bg-primary/10 text-primary',
                  isCurrent && 'bg-primary text-primary-foreground',
                  !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                )}
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold">
                  {isCompleted ? '✓' : index + 1}
                </span>
                <span className="hidden sm:inline">{STEP_LABELS[step]}</span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-px w-4 shrink-0',
                    index < currentStepIndex ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
