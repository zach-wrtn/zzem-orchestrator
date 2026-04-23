import { describe, it, expect } from 'vitest';
import { resolveToken, loadTokenMap } from './token-resolve';

const fixturePath = 'src/content/tokens';

describe('loadTokenMap', () => {
  it('flattens all synced token files into a path-keyed map', async () => {
    const map = await loadTokenMap(fixturePath);
    // After `pnpm run sync:tokens`, primitive-color.json should contain wds.color.purple.500
    expect(map['wds.color.purple.500']).toBeDefined();
    expect(map['wds.color.purple.500'].value).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});

describe('resolveToken', () => {
  it('returns the value for a valid dotted path', async () => {
    const map = await loadTokenMap(fixturePath);
    const result = resolveToken(map, 'wds.color.purple.500');
    expect(result?.value).toBe('#8752FA');
  });

  it('returns null for an unknown path', async () => {
    const map = await loadTokenMap(fixturePath);
    expect(resolveToken(map, 'wds.color.unicorn.42')).toBeNull();
  });

  it('records the source file for each resolved token', async () => {
    const map = await loadTokenMap(fixturePath);
    const result = resolveToken(map, 'wds.color.purple.500');
    expect(result?.source).toBe('primitive-color.json');
  });
});
