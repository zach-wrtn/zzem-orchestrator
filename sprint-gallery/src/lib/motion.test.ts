import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DUR, EASE, prefersReducedMotion, pickDuration, pickEase } from './motion';

describe('motion tokens', () => {
  it('declares the four canonical durations in ms', () => {
    expect(DUR.fast).toBe(100);
    expect(DUR.ui).toBe(140);
    expect(DUR.springSoft).toBe(220);
    expect(DUR.springHandoff).toBe(320);
  });

  it('declares the four canonical easing curves', () => {
    expect(EASE.easeOutQuart).toMatch(/^cubic-bezier\(/);
    expect(EASE.springSoft).toMatch(/^cubic-bezier\(/);
    expect(EASE.springHandoff).toMatch(/^cubic-bezier\(/);
    expect(EASE.linearFast).toBe('linear');
  });
});

describe('prefersReducedMotion', () => {
  beforeEach(() => {
    (globalThis as any).matchMedia = vi.fn((q: string) => ({
      matches: q.includes('reduce'),
      media: q, addListener: () => {}, removeListener: () => {},
      addEventListener: () => {}, removeEventListener: () => {},
      onchange: null, dispatchEvent: () => false,
    }));
  });

  it('returns true when media query matches reduce', () => {
    expect(prefersReducedMotion()).toBe(true);
  });
});

describe('pickDuration / pickEase', () => {
  it('returns original when reduced-motion is false', () => {
    (globalThis as any).matchMedia = vi.fn(() => ({ matches: false }));
    expect(pickDuration('springHandoff')).toBe(320);
    expect(pickEase('springHandoff')).toMatch(/cubic-bezier/);
  });

  it('collapses to fast/linear under reduced-motion', () => {
    (globalThis as any).matchMedia = vi.fn(() => ({ matches: true }));
    expect(pickDuration('springHandoff')).toBe(100);
    expect(pickEase('springHandoff')).toBe('linear');
  });
});
