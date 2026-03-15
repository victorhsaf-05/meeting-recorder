import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AudioRecorder, formatTime } from '@/components/AudioRecorder';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}));

// Mock URL.createObjectURL / revokeObjectURL
vi.stubGlobal('URL', {
  ...globalThis.URL,
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn(),
});

// Mock MediaRecorder
let mockRecorderInstance: Record<string, unknown>;

function MockMediaRecorderConstructor() {
  mockRecorderInstance = {
    start: vi.fn(function (this: Record<string, unknown>) {
      mockRecorderInstance.state = 'recording';
    }),
    stop: vi.fn(function (this: Record<string, unknown>) {
      mockRecorderInstance.state = 'inactive';
      const ondata = mockRecorderInstance.ondataavailable as ((e: { data: Blob }) => void) | null;
      if (ondata) {
        ondata({ data: new Blob(['audio'], { type: 'audio/webm' }) });
      }
      const onstop = mockRecorderInstance.onstop as (() => void) | null;
      if (onstop) {
        onstop();
      }
    }),
    pause: vi.fn(function (this: Record<string, unknown>) {
      mockRecorderInstance.state = 'paused';
    }),
    resume: vi.fn(function (this: Record<string, unknown>) {
      mockRecorderInstance.state = 'recording';
    }),
    ondataavailable: null,
    onstop: null,
    state: 'inactive',
  };
  return mockRecorderInstance;
}

(MockMediaRecorderConstructor as unknown as Record<string, unknown>).isTypeSupported = vi.fn(() => true);

vi.stubGlobal('MediaRecorder', MockMediaRecorderConstructor);

// Mock getUserMedia
const mockGetUserMedia = vi.fn().mockResolvedValue({
  getTracks: () => [{ stop: vi.fn() }],
});

Object.defineProperty(navigator, 'mediaDevices', {
  value: { getUserMedia: mockGetUserMedia },
  writable: true,
  configurable: true,
});

describe('formatTime', () => {
  it('formats 0 seconds as 00:00', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('formats 65 seconds as 01:05', () => {
    expect(formatTime(65)).toBe('01:05');
  });

  it('formats 3661 seconds as 61:01', () => {
    expect(formatTime(3661)).toBe('61:01');
  });
});

describe('AudioRecorder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    });
  });

  it('renders Gravar button in idle state', () => {
    render(<AudioRecorder />);
    expect(screen.getByText('Gravar')).toBeInTheDocument();
  });

  it('disables Gravar button when disabled prop is true', () => {
    render(<AudioRecorder disabled />);
    expect(screen.getByText('Gravar')).toBeDisabled();
  });

  it('shows Pausar and Parar buttons when recording', async () => {
    render(<AudioRecorder />);
    fireEvent.click(screen.getByText('Gravar'));

    await waitFor(() => {
      expect(screen.getByText('Pausar')).toBeInTheDocument();
      expect(screen.getByText('Parar')).toBeInTheDocument();
    });
  });

  it('shows error when microphone permission denied', async () => {
    mockGetUserMedia.mockRejectedValueOnce(
      Object.assign(new Error('Not allowed'), { name: 'NotAllowedError' })
    );

    render(<AudioRecorder />);
    fireEvent.click(screen.getByText('Gravar'));

    await waitFor(() => {
      expect(screen.getByText(/Permissão de microfone negada/)).toBeInTheDocument();
    });
  });

  it('shows error when microphone not found', async () => {
    mockGetUserMedia.mockRejectedValueOnce(
      Object.assign(new Error('Not found'), { name: 'NotFoundError' })
    );

    render(<AudioRecorder />);
    fireEvent.click(screen.getByText('Gravar'));

    await waitFor(() => {
      expect(screen.getByText(/Microfone não encontrado/)).toBeInTheDocument();
    });
  });

  it('shows Continuar and Parar when paused', async () => {
    render(<AudioRecorder />);
    fireEvent.click(screen.getByText('Gravar'));

    await waitFor(() => {
      expect(screen.getByText('Pausar')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Pausar'));

    await waitFor(() => {
      expect(screen.getByText('Continuar')).toBeInTheDocument();
      expect(screen.getByText('Parar')).toBeInTheDocument();
    });
  });

  it('shows playback controls after stopping', async () => {
    const onAudioReady = vi.fn();
    render(<AudioRecorder onAudioReady={onAudioReady} />);

    fireEvent.click(screen.getByText('Gravar'));
    await waitFor(() => expect(screen.getByText('Parar')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Parar'));
    await waitFor(() => {
      expect(screen.getByText('Descartar')).toBeInTheDocument();
    });

    expect(onAudioReady).toHaveBeenCalledWith(expect.any(Blob));
  });
});
