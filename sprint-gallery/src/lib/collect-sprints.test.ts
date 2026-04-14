import { describe, it, expect } from 'vitest';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectSprints } from './collect-sprints.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(HERE, '../../tests/fixtures/sprints');

describe('collectSprints', () => {
  it('parses a sprint with full display metadata', async () => {
    const sprints = await collectSprints(FIXTURES);
    const demo = sprints.find((s) => s.slug === 'demo-sprint');
    expect(demo).toBeDefined();
    expect(demo!.title).toBe('Demo Sprint');
    expect(demo!.status).toBe('completed');
    expect(demo!.tags).toEqual(['demo']);
    expect(demo!.summary).toContain('first paragraph of the PRD');
    expect(demo!.prototypes).toHaveLength(1);
    expect(demo!.prototypes[0].id).toBe('demo-001');
    expect(demo!.prototypes[0].hero).toBe(true);
    expect(demo!.prototypes[0].title).toBe('Demo Prototype');
  });

  it('falls back when display block missing', async () => {
    const sprints = await collectSprints(FIXTURES);
    const fallback = sprints.find((s) => s.slug === 'missing-display');
    expect(fallback).toBeDefined();
    expect(fallback!.title).toBe('Missing Display');
    expect(fallback!.status).toBe('in-progress');
    expect(fallback!.summary).toContain('Fallback summary');
    expect(fallback!.prototypes).toEqual([]);
  });

  it('sorts sprints by endDate descending', async () => {
    const sprints = await collectSprints(FIXTURES);
    for (let i = 0; i < sprints.length - 1; i++) {
      expect(sprints[i].endDate >= sprints[i + 1].endDate).toBe(true);
    }
  });
});
