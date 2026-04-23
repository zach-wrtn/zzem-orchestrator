/**
 * Motion primitives — durations and easings kept in lockstep with tokens.css.
 * All values are safe to use both in CSS (via var(--...)) and in JS animations.
 */

export const DUR = {
  fast: 100,
  ui: 140,
  springSoft: 220,
  springHandoff: 320,
} as const;

export const EASE = {
  easeOutQuart: 'cubic-bezier(0.25, 1, 0.5, 1)',
  springSoft: 'cubic-bezier(0.34, 1.35, 0.64, 1)',
  springHandoff: 'cubic-bezier(0.22, 1.5, 0.36, 1)',
  linearFast: 'linear',
} as const;

export type DurKey = keyof typeof DUR;
export type EaseKey = keyof typeof EASE;

export function prefersReducedMotion(): boolean {
  if (typeof matchMedia === 'undefined') return false;
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function pickDuration(key: DurKey): number {
  return prefersReducedMotion() ? DUR.fast : DUR[key];
}

export function pickEase(key: EaseKey): string {
  return prefersReducedMotion() ? EASE.linearFast : EASE[key];
}

/**
 * Thin wrapper over Element.animate that respects reduced-motion.
 * Falls back to no-op if the element is missing.
 */
export function animate(
  el: Element | null,
  keyframes: Keyframe[],
  opts: { duration: DurKey; ease: EaseKey; fill?: FillMode },
): Animation | null {
  if (!el) return null;
  return (el as HTMLElement).animate(keyframes, {
    duration: pickDuration(opts.duration),
    easing: pickEase(opts.ease),
    fill: opts.fill ?? 'none',
  });
}
