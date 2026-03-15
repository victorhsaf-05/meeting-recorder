export function mockGetUserMedia() {
  const mockStream = {
    getTracks: () => [{ stop: vi.fn() }],
  } as unknown as MediaStream;

  Object.defineProperty(navigator, 'mediaDevices', {
    value: {
      getUserMedia: vi.fn().mockResolvedValue(mockStream),
    },
    writable: true,
  });

  return mockStream;
}

export function mockMediaRecorder() {
  const MockMediaRecorder = vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    ondataavailable: null,
    onstop: null,
    state: 'inactive',
  }));

  (MockMediaRecorder as unknown as Record<string, unknown>).isTypeSupported = vi.fn().mockReturnValue(true);

  Object.defineProperty(window, 'MediaRecorder', {
    value: MockMediaRecorder,
    writable: true,
  });

  return MockMediaRecorder;
}
