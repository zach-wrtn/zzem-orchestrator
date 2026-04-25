import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { addExemplar } from '../scripts/exemplar-add.js';
import { ExemplarIndex, type ExemplarIndex as ExemplarIndexType } from '../src/lib/exemplars/schema.js';

interface Fixture {
  repoRoot: string;
  galleryRoot: string;
  indexPath: string;
}

function createFixture(): Fixture {
  const root = mkdtempSync(join(tmpdir(), 'exemplar-test-'));
  const galleryRoot = join(root, 'sprint-gallery');
  const exemplarsDir = join(galleryRoot, 'exemplars');
  mkdirSync(exemplarsDir, { recursive: true });
  const indexPath = join(exemplarsDir, '_index.json');
  writeFileSync(
    indexPath,
    JSON.stringify(
      { schema_version: '1.0', generated_at: '2026-04-25T00:00:00Z', exemplars: [] },
      null,
      2,
    ) + '\n',
  );
  return { repoRoot: root, galleryRoot, indexPath };
}

function seedSprintArtifacts(
  repoRoot: string,
  sprint: string,
  task: string,
  screen: string,
  opts: { antiSlop?: 'passed' | 'failed' | 'missing' } = {},
): { prototypePath: string; screenshotPath: string } {
  const protoDir = join(repoRoot, 'sprint-orchestrator/sprints', sprint, 'prototypes/app', task);
  const shotDir = join(protoDir, 'screenshots');
  mkdirSync(shotDir, { recursive: true });
  const prototypePath = join(protoDir, 'prototype.html');
  const screenshotPath = join(shotDir, 'default.png');
  writeFileSync(prototypePath, '<html><body><h1>Prototype</h1></body></html>');
  writeFileSync(screenshotPath, 'png-stub');

  if (opts.antiSlop !== 'missing') {
    const approvalPath = join(repoRoot, 'sprint-orchestrator/sprints', sprint, 'prototypes/approval-status.yaml');
    const status = opts.antiSlop ?? 'passed';
    writeFileSync(
      approvalPath,
      `screens:\n  ${screen}:\n    anti_slop_audit: ${status}\n`,
    );
  }
  return { prototypePath, screenshotPath };
}

function readIndex(path: string): ExemplarIndexType {
  return ExemplarIndex.parse(JSON.parse(readFileSync(path, 'utf8')));
}

let fixture: Fixture;

beforeEach(() => {
  fixture = createFixture();
});

afterEach(() => {
  if (fixture && existsSync(fixture.repoRoot)) {
    rmSync(fixture.repoRoot, { recursive: true, force: true });
  }
});

describe('exemplar-add', () => {
  it('appends a valid exemplar to the index when prototype + anti-slop preconditions hold', async () => {
    seedSprintArtifacts(fixture.repoRoot, 'sprint-x', 'app-001', 'Home');
    const meta = await addExemplar({
      sprint: 'sprint-x',
      task: 'app-001',
      screen: 'Home',
      archetype: 'feed',
      reason: 'Stable feed reference — token compliance + interaction completeness.',
      dimensions: ['token_compliance', 'archetype_fit'],
      addedBy: 'tester@example.com',
      now: '2026-04-25T01:00:00Z',
      indexPath: fixture.indexPath,
      repoRoot: fixture.repoRoot,
      galleryRoot: fixture.galleryRoot,
    });

    const index = readIndex(fixture.indexPath);
    expect(index.exemplars).toHaveLength(1);
    expect(index.exemplars[0].id).toBe(meta.id);
    expect(index.exemplars[0].validation_status).toBe('valid');
    expect(index.exemplars[0].archetype).toBe('feed');
  });

  it('throws on invalid archetype (Zod parse error)', async () => {
    seedSprintArtifacts(fixture.repoRoot, 'sprint-x', 'app-001', 'Home');
    await expect(
      addExemplar({
        sprint: 'sprint-x',
        task: 'app-001',
        screen: 'Home',
        archetype: 'not-an-archetype',
        reason: 'irrelevant — should fail at Zod parse for archetype.',
        dimensions: ['token_compliance'],
        addedBy: 'tester@example.com',
        now: '2026-04-25T01:00:00Z',
        indexPath: fixture.indexPath,
        repoRoot: fixture.repoRoot,
        galleryRoot: fixture.galleryRoot,
      }),
    ).rejects.toThrow();
  });

  it('throws when the prototype.html is missing', async () => {
    await expect(
      addExemplar({
        sprint: 'sprint-x',
        task: 'app-missing',
        screen: 'Home',
        archetype: 'feed',
        reason: 'should fail because prototype.html does not exist on disk.',
        dimensions: ['token_compliance'],
        addedBy: 'tester@example.com',
        now: '2026-04-25T01:00:00Z',
        indexPath: fixture.indexPath,
        repoRoot: fixture.repoRoot,
        galleryRoot: fixture.galleryRoot,
      }),
    ).rejects.toThrow(/prototype\.html not found/);
  });
});
