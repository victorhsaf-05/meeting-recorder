import { render, screen, fireEvent } from '@testing-library/react';
import { AudioUpload, formatFileSize, isValidAudioFile } from '@/components/AudioUpload';

vi.stubGlobal('URL', {
  ...globalThis.URL,
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn(),
});

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(2048)).toBe('2.0 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(12_900_000)).toBe('12.3 MB');
  });
});

describe('isValidAudioFile', () => {
  it('accepts m4a file', () => {
    const file = new File([''], 'test.m4a', { type: 'audio/mp4' });
    expect(isValidAudioFile(file)).toBe(true);
  });

  it('accepts mp3 file', () => {
    const file = new File([''], 'test.mp3', { type: 'audio/mpeg' });
    expect(isValidAudioFile(file)).toBe(true);
  });

  it('rejects txt file', () => {
    const file = new File([''], 'test.txt', { type: 'text/plain' });
    expect(isValidAudioFile(file)).toBe(false);
  });

  it('accepts by extension when type is empty', () => {
    const file = new File([''], 'test.wav', { type: '' });
    expect(isValidAudioFile(file)).toBe(true);
  });
});

describe('AudioUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Upload button in initial state', () => {
    render(<AudioUpload />);
    expect(screen.getByText('Upload Áudio')).toBeInTheDocument();
  });

  it('disables Upload button when disabled prop is true', () => {
    render(<AudioUpload disabled />);
    expect(screen.getByText('Upload Áudio')).toBeDisabled();
  });

  it('shows file name and size after selecting valid file', () => {
    const onAudioReady = vi.fn();
    render(<AudioUpload onAudioReady={onAudioReady} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['audio-data'], 'reuniao.m4a', { type: 'audio/mp4' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText(/reuniao\.m4a/)).toBeInTheDocument();
    expect(onAudioReady).toHaveBeenCalledWith(file, 'reuniao.m4a');
  });

  it('shows error for invalid file type', () => {
    render(<AudioUpload />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['data'], 'doc.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText(/Formato não suportado/)).toBeInTheDocument();
  });

  it('shows preview audio after valid selection', () => {
    render(<AudioUpload />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['audio-data'], 'test.mp3', { type: 'audio/mpeg' });
    fireEvent.change(input, { target: { files: [file] } });

    const audio = document.querySelector('audio');
    expect(audio).toBeInTheDocument();
    expect(audio?.src).toBe('blob:mock-url');
  });

  it('removes file when Remover is clicked', () => {
    const onAudioClear = vi.fn();
    render(<AudioUpload onAudioClear={onAudioClear} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['audio-data'], 'test.wav', { type: 'audio/wav' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText('Remover')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Remover'));

    expect(screen.getByText('Upload Áudio')).toBeInTheDocument();
    expect(onAudioClear).toHaveBeenCalled();
  });
});
