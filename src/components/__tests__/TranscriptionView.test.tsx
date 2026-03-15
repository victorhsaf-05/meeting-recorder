import { render, screen, fireEvent } from '@testing-library/react';
import { TranscriptionView } from '@/components/TranscriptionView';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

describe('TranscriptionView', () => {
  it('shows empty state when no text and not transcribing', () => {
    render(<TranscriptionView />);
    expect(screen.getByText('Nenhuma transcrição disponível.')).toBeInTheDocument();
  });

  it('shows progress during transcription', () => {
    render(
      <TranscriptionView
        isTranscribing
        progress={{ current: 2, total: 5 }}
      />
    );
    expect(screen.getByText('Transcrevendo parte 2 de 5...')).toBeInTheDocument();
  });

  it('shows text after transcription', () => {
    render(<TranscriptionView text="Texto da reunião completa." />);
    expect(screen.getByText('Texto da reunião completa.')).toBeInTheDocument();
  });

  it('shows copy button when text is available', () => {
    render(<TranscriptionView text="Algum texto" />);
    expect(screen.getByText('Copiar')).toBeInTheDocument();
  });

  it('copies text to clipboard on Copiar click', async () => {
    render(<TranscriptionView text="Texto para copiar" />);
    fireEvent.click(screen.getByText('Copiar'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Texto para copiar');
  });

  it('shows error message', () => {
    render(<TranscriptionView error="Alguns trechos não puderam ser transcritos." />);
    expect(screen.getByText('Alguns trechos não puderam ser transcritos.')).toBeInTheDocument();
  });

  it('shows error with partial text', () => {
    render(
      <TranscriptionView
        text="Parte 1 do texto [...chunk 2 falhou...] Parte 3"
        error="Alguns trechos não puderam ser transcritos."
      />
    );
    expect(screen.getByText(/Parte 1 do texto/)).toBeInTheDocument();
    expect(screen.getByText(/Alguns trechos/)).toBeInTheDocument();
  });
});
