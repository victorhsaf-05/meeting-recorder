import { cn } from '@/lib/utils';

describe('utils', () => {
  it('cn merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('cn handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });
});
