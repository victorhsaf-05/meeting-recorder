import { render, screen, fireEvent } from '@testing-library/react';
import { AnalysisView } from '@/components/AnalysisView';
import type { EditablePain } from '@/lib/types';

const mockPains: EditablePain[] = [
  {
    tempId: 'pain-1',
    description: 'Falta de comunicação',
    solutions: [
      { tempId: 'sol-1', description: 'Reuniões semanais' },
      { tempId: 'sol-2', description: 'Canal no Slack' },
    ],
  },
  {
    tempId: 'pain-2',
    description: 'Prazo apertado',
    solutions: [],
  },
];

describe('AnalysisView', () => {
  it('shows loading state', () => {
    render(
      <AnalysisView mode="wizard" pains={[]} isLoading />
    );
    expect(screen.getByText('Analisando transcrição com IA...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(
      <AnalysisView mode="wizard" pains={[]} error="Algo deu errado" />
    );
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
  });

  it('displays context', () => {
    render(
      <AnalysisView
        mode="wizard"
        context="Reunião sobre projeto X"
        pains={[]}
      />
    );
    expect(screen.getByText('Reunião sobre projeto X')).toBeInTheDocument();
  });

  it('displays pains with descriptions', () => {
    render(
      <AnalysisView mode="wizard" pains={mockPains} />
    );
    expect(screen.getByDisplayValue('Falta de comunicação')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Prazo apertado')).toBeInTheDocument();
  });

  it('displays solutions within pains', () => {
    render(
      <AnalysisView mode="wizard" pains={mockPains} />
    );
    expect(screen.getByDisplayValue('Reuniões semanais')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Canal no Slack')).toBeInTheDocument();
  });

  it('calls onPainsChange when editing pain description', () => {
    const onChange = vi.fn();
    render(
      <AnalysisView mode="wizard" pains={mockPains} onPainsChange={onChange} />
    );
    const input = screen.getByDisplayValue('Falta de comunicação');
    fireEvent.change(input, { target: { value: 'Falta de comunicação interna' } });
    expect(onChange).toHaveBeenCalled();
    const updatedPains = onChange.mock.calls[0][0];
    expect(updatedPains[0].description).toBe('Falta de comunicação interna');
  });

  it('calls onPainsChange when adding pain', () => {
    const onChange = vi.fn();
    render(
      <AnalysisView mode="wizard" pains={mockPains} onPainsChange={onChange} />
    );
    fireEvent.click(screen.getByText('+ Adicionar Dor'));
    expect(onChange).toHaveBeenCalled();
    const updatedPains = onChange.mock.calls[0][0];
    expect(updatedPains).toHaveLength(3);
  });

  it('calls onPainsChange when removing pain', () => {
    const onChange = vi.fn();
    render(
      <AnalysisView mode="wizard" pains={mockPains} onPainsChange={onChange} />
    );
    const removeButtons = screen.getAllByText('Remover');
    fireEvent.click(removeButtons[0]);
    expect(onChange).toHaveBeenCalled();
    const updatedPains = onChange.mock.calls[0][0];
    expect(updatedPains).toHaveLength(1);
    expect(updatedPains[0].description).toBe('Prazo apertado');
  });

  it('calls onPainsChange when adding solution', () => {
    const onChange = vi.fn();
    render(
      <AnalysisView mode="wizard" pains={mockPains} onPainsChange={onChange} />
    );
    const addSolButtons = screen.getAllByText('+ Solução');
    fireEvent.click(addSolButtons[0]);
    expect(onChange).toHaveBeenCalled();
    const updatedPains = onChange.mock.calls[0][0];
    expect(updatedPains[0].solutions).toHaveLength(3);
  });
});
