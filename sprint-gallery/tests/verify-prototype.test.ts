import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { verifyPrototype } from '../scripts/verify-prototype.js';

const FIXTURES = join(__dirname, 'fixtures');

describe('verifyPrototype', () => {
  it('passes a well-formed prototype with console-clean interactions', async () => {
    const result = await verifyPrototype(join(FIXTURES, 'prototype-good.html'));
    expect(result.status).toBe('pass');
    expect(result.consoleErrors).toEqual([]);
    expect(result.unhandledRejections).toEqual([]);
    expect(result.clickedElements).toBeGreaterThanOrEqual(3);
    expect(result.clickErrors).toEqual([]);
  }, 30_000);

  it('fails a broken prototype with ReferenceError on click', async () => {
    const result = await verifyPrototype(join(FIXTURES, 'prototype-broken.html'));
    expect(result.status).toBe('fail');
    expect(result.clickErrors.length).toBeGreaterThan(0);
    const joined = result.clickErrors.join('\n');
    expect(joined).toMatch(/nonExistentFunction|ghost|null/i);
  }, 30_000);
});
