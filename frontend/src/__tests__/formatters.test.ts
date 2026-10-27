import { describe, it, expect } from 'vitest';
import {
  formatMW,
  formatDecMW,
  formatSignedMW,
  formatDateTime,
} from '../utils/formatters';

describe('formatters', () => {
  it('formats MW values with comma separators', () => {
    expect(formatMW(14200)).toBe('14,200 MW');
    expect(formatMW(0)).toBe('0 MW');
    expect(formatMW(null)).toBe('—');
  });

  it('formats decimal MW with 1 decimal place', () => {
    expect(formatDecMW(842.15)).toBe('842.2 MW');
    expect(formatDecMW(1200)).toBe('1,200.0 MW');
    expect(formatDecMW(undefined)).toBe('—');
  });

  it('formats signed MW with + or -', () => {
    expect(formatSignedMW(250.5)).toBe('+250.5 MW');
    expect(formatSignedMW(-120.4)).toBe('-120.4 MW');
    expect(formatSignedMW(null)).toBe('—');
  });

  it('formats ISO UTC datetime strings consistently', () => {
    const formatted = formatDateTime('2026-01-01T14:30:00Z');
    expect(formatted).toContain('01');
    expect(formatted).toContain('Jan');
    expect(formatted).toContain('14:30');
    expect(formatted).toContain('UTC');
  });
});
