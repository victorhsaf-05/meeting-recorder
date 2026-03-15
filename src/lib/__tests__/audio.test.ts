import { calculateChunks, getChunk, getExtensionFromMime } from '@/lib/audio';

describe('calculateChunks', () => {
  it('returns 1 for blob smaller than chunk size', () => {
    const blob = new Blob([new ArrayBuffer(1024)]);
    expect(calculateChunks(blob)).toBe(1);
  });

  it('returns correct number for 10MB blob', () => {
    const blob = new Blob([new ArrayBuffer(10 * 1024 * 1024)]);
    expect(calculateChunks(blob)).toBe(3); // ceil(10/4) = 3
  });

  it('returns exact for 8MB blob', () => {
    const blob = new Blob([new ArrayBuffer(8 * 1024 * 1024)]);
    expect(calculateChunks(blob)).toBe(2); // 8/4 = 2
  });
});

describe('getChunk', () => {
  it('returns correct slice for first chunk', () => {
    const data = new ArrayBuffer(10 * 1024 * 1024);
    const blob = new Blob([data], { type: 'audio/webm' });
    const chunk = getChunk(blob, 0);
    expect(chunk.size).toBe(4 * 1024 * 1024);
    expect(chunk.type).toBe('audio/webm');
  });

  it('returns remaining bytes for last chunk', () => {
    const size = 10 * 1024 * 1024;
    const blob = new Blob([new ArrayBuffer(size)], { type: 'audio/webm' });
    const chunk = getChunk(blob, 2); // third chunk: 8MB to 10MB
    expect(chunk.size).toBe(2 * 1024 * 1024);
  });
});

describe('getExtensionFromMime', () => {
  it('maps audio/webm to webm', () => {
    expect(getExtensionFromMime('audio/webm')).toBe('webm');
  });

  it('maps audio/mp4 to m4a', () => {
    expect(getExtensionFromMime('audio/mp4')).toBe('m4a');
  });

  it('maps audio/x-m4a to m4a', () => {
    expect(getExtensionFromMime('audio/x-m4a')).toBe('m4a');
  });

  it('maps audio/mpeg to mp3', () => {
    expect(getExtensionFromMime('audio/mpeg')).toBe('mp3');
  });

  it('maps audio/wav to wav', () => {
    expect(getExtensionFromMime('audio/wav')).toBe('wav');
  });

  it('defaults to webm for unknown type', () => {
    expect(getExtensionFromMime('audio/ogg')).toBe('webm');
  });
});
