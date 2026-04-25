import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { addExemplar } from '../scripts/exemplar-add.js';
import { validateExemplars } from '../scripts/exemplar-validate.js';
import { lookupExemplars, formatExemplarsAsMarkdown } from '../scripts/exemplar-lookup.js';
import {
  ExemplarIndex,
  type ExemplarIndex as ExemplarIndexType,
  type ExemplarMeta,
} from '../src/lib/exemplars/schema.js';

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

describe('exemplar-validate', () => {
  it('marks valid when verifier returns pass and refreshes last_validated_at', async () => {
    seedSprintArtifacts(fixture.repoRoot, 'sprint-v', 'app-001', 'Home');
    await addExemplar({
      sprint: 'sprint-v',
      task: 'app-001',
      screen: 'Home',
      archetype: 'feed',
      reason: 'Reference for validation success path — verifier stub returns pass.',
      dimensions: ['token_compliance'],
      addedBy: 'tester@example.com',
      now: '2026-04-01T00:00:00Z',
      indexPath: fixture.indexPath,
      repoRoot: fixture.repoRoot,
      galleryRoot: fixture.galleryRoot,
    });

    const result = await validateExemplars({
      indexPath: fixture.indexPath,
      repoRoot: fixture.repoRoot,
      galleryRoot: fixture.galleryRoot,
      now: '2026-04-25T00:00:00Z',
      verify: vi.fn().mockResolvedValue({
        file: '',
        status: 'pass',
        consoleErrors: [],
        unhandledRejections: [],
        clickedElements: 1,
        clickErrors: [],
        durationMs: 10,
      }),
    });

    expect(result.exitCode).toBe(0);
    const index = readIndex(fixture.indexPath);
    expect(index.exemplars[0].validation_status).toBe('valid');
    expect(index.exemplars[0].last_validated_at).toBe('2026-04-25T00:00:00Z');
  });

  it('marks invalid + exit code 1 when verifier returns fail', async () => {
    seedSprintArtifacts(fixture.repoRoot, 'sprint-v', 'app-002', 'Detail');
    await addExemplar({
      sprint: 'sprint-v',
      task: 'app-002',
      screen: 'Detail',
      archetype: 'detail',
      reason: 'Reference for validation failure path — verifier stub returns fail.',
      dimensions: ['interaction_completeness'],
      addedBy: 'tester@example.com',
      now: '2026-04-01T00:00:00Z',
      indexPath: fixture.indexPath,
      repoRoot: fixture.repoRoot,
      galleryRoot: fixture.galleryRoot,
    });

    const result = await validateExemplars({
      indexPath: fixture.indexPath,
      repoRoot: fixture.repoRoot,
      galleryRoot: fixture.galleryRoot,
      now: '2026-04-25T00:00:00Z',
      verify: vi.fn().mockResolvedValue({
        file: '',
        status: 'fail',
        consoleErrors: ['ReferenceError'],
        unhandledRejections: [],
        clickedElements: 1,
        clickErrors: ['ReferenceError'],
        durationMs: 10,
      }),
    });

    expect(result.exitCode).toBe(1);
    const index = readIndex(fixture.indexPath);
    expect(index.exemplars[0].validation_status).toBe('invalid');
  });

  it('auto-marks stale when last_validated_at exceeds 30 days', async () => {
    seedSprintArtifacts(fixture.repoRoot, 'sprint-v', 'app-003', 'Onb');
    await addExemplar({
      sprint: 'sprint-v',
      task: 'app-003',
      screen: 'Onb',
      archetype: 'onboarding',
      reason: 'Reference for stale-detection — last_validated_at older than 30 days.',
      dimensions: ['archetype_fit'],
      addedBy: 'tester@example.com',
      now: '2026-01-01T00:00:00Z',
      indexPath: fixture.indexPath,
      repoRoot: fixture.repoRoot,
      galleryRoot: fixture.galleryRoot,
    });

    const result = await validateExemplars({
      indexPath: fixture.indexPath,
      repoRoot: fixture.repoRoot,
      galleryRoot: fixture.galleryRoot,
      now: '2026-04-25T00:00:00Z',
      verify: null,
      skipVerify: true,
    });

    expect(result.exitCode).toBe(0);
    const index = readIndex(fixture.indexPath);
    expect(index.exemplars[0].validation_status).toBe('stale');
  });
});

async function seedTwo(
  fixture: Fixture,
  archetype: ExemplarMeta['archetype'],
  sprintA: string,
  sprintB: string,
): Promise<void> {
  seedSprintArtifacts(fixture.repoRoot, sprintA, 'app-001', 'Home');
  seedSprintArtifacts(fixture.repoRoot, sprintB, 'app-001', 'Feed');
  await addExemplar({
    sprint: sprintA,
    task: 'app-001',
    screen: 'Home',
    archetype,
    reason: 'First exemplar — sprint A — used to verify lookup ordering and archetype filter.',
    dimensions: ['token_compliance'],
    addedBy: 'tester@example.com',
    now: '2026-04-25T00:00:00Z',
    indexPath: fixture.indexPath,
    repoRoot: fixture.repoRoot,
    galleryRoot: fixture.galleryRoot,
  });
  await addExemplar({
    sprint: sprintB,
    task: 'app-001',
    screen: 'Feed',
    archetype,
    reason: 'Second exemplar — sprint B — used to verify exclude-sprint and limit options.',
    dimensions: ['archetype_fit'],
    addedBy: 'tester@example.com',
    now: '2026-04-25T00:00:00Z',
    indexPath: fixture.indexPath,
    repoRoot: fixture.repoRoot,
    galleryRoot: fixture.galleryRoot,
  });
}

describe('exemplar-lookup', () => {
  it('returns valid exemplars matching the requested archetype', async () => {
    await seedTwo(fixture, 'feed', 'sprint-a', 'sprint-b');
    const results = await lookupExemplars({
      archetype: 'feed',
      indexPath: fixture.indexPath,
    });
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.archetype === 'feed')).toBe(true);
  });

  it('excludes exemplars from --exclude-sprint', async () => {
    await seedTwo(fixture, 'feed', 'sprint-a', 'sprint-b');
    const results = await lookupExemplars({
      archetype: 'feed',
      excludeSprint: 'sprint-a',
      indexPath: fixture.indexPath,
    });
    expect(results).toHaveLength(1);
    expect(results[0].sprint_id).toBe('sprint-b');
  });

  it('respects --limit', async () => {
    await seedTwo(fixture, 'feed', 'sprint-a', 'sprint-b');
    const results = await lookupExemplars({
      archetype: 'feed',
      limit: 1,
      indexPath: fixture.indexPath,
    });
    expect(results).toHaveLength(1);
  });

  it('renders markdown output that DEs can inline directly', async () => {
    await seedTwo(fixture, 'feed', 'sprint-a', 'sprint-b');
    const results = await lookupExemplars({
      archetype: 'feed',
      indexPath: fixture.indexPath,
    });
    const md = formatExemplarsAsMarkdown(results);
    expect(md).toContain('## Exemplar References');
    expect(md).toContain('- id:');
    expect(md).toContain('why_curated:');
  });
});
