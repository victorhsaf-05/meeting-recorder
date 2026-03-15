import { buildAnalysisPrompt } from '@/lib/prompts';

describe('buildAnalysisPrompt', () => {
  it('includes transcription in prompt', () => {
    const result = buildAnalysisPrompt('Texto da reunião', []);
    expect(result).toContain('Texto da reunião');
  });

  it('includes participant names', () => {
    const result = buildAnalysisPrompt('texto', [
      { name: 'Alice', costCenter: 'CC-100' },
      { name: 'Bob', costCenter: null },
    ]);
    expect(result).toContain('- Alice (CC: CC-100)');
    expect(result).toContain('- Bob');
    expect(result).not.toContain('Bob (CC:');
  });

  it('requests JSON format', () => {
    const result = buildAnalysisPrompt('texto', []);
    expect(result).toContain('"title"');
    expect(result).toContain('"context"');
    expect(result).toContain('"pains"');
    expect(result).toContain('"actions"');
  });

  it('mentions responsible and actionOwner fields', () => {
    const result = buildAnalysisPrompt('texto', []);
    expect(result).toContain('responsible');
    expect(result).toContain('actionOwner');
    expect(result).toContain('account');
    expect(result).toContain('deadline');
  });
});
