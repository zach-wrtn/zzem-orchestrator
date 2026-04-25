/**
 * Exemplar registration CLI.
 *
 * Promotes a passing prototype into the curated exemplar showcase.
 * Validates eligibility (anti-slop audit + verify-prototype evidence),
 * resolves a screenshot, then appends a Zod-validated entry into
 * `exemplars/_index.json`.
 *
 * Usage:
 *   pnpm gallery:exemplar:add \
 *     --sprint=<sprint-id> \
 *     --task=<task-id> \
 *     --screen=<ScreenName> \
 *     --archetype=<feed|detail|onboarding|form|modal|empty_state> \
 *     --reason="..." \
 *     --dimensions=token_compliance,motion \
 *     --added-by=<handle> \
 *     [--id=<custom-slug>] \
 *     [--prototype-path=<rel-path>] \
 *     [--screenshot-path=<rel-path>] \
 *     [--notes="..."]
 *
 * Exit codes:
 *   0  exemplar registered
 *   1  precondition failed (missing prototype, anti-slop fail, invalid args)
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import {
  ExemplarIndex,
  ExemplarMeta,
  ScreenArchetype,
  DesignDimension,
  type ExemplarMeta as ExemplarMetaType,
  type ExemplarIndex as ExemplarIndexType,
} from '../src/lib/exemplars/schema.js';

const HERE = dirname(fileURLToPath(import.meta.url));
export const GALLERY_ROOT = resolve(HERE, '..');
export const REPO_ROOT = resolve(GALLERY_ROOT, '..');
export const INDEX_PATH = resolve(GALLERY_ROOT, 'exemplars/_index.json');

export interface AddOptions {
  sprint: string;
  task: string;
  screen: string;
  archetype: string;
  reason: string;
  dimensions: string[];
  addedBy: string;
  id?: string;
  prototypePath?: string;
  screenshotPath?: string;
  notes?: string;
  /** ISO8601 timestamp override (test-only). */
  now?: string;
  /** Custom index path (test-only). */
  indexPath?: string;
  /** Custom repo root (test-only). */
  repoRoot?: string;
  /** Custom gallery root (test-only). */
  galleryRoot?: string;
}

function parseArgs(argv: string[]): Partial<AddOptions> {
  const out: Record<string, string | string[]> = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const eq = arg.indexOf('=');
    if (eq < 0) continue;
    const key = arg.slice(2, eq);
    const value = arg.slice(eq + 1);
    if (key === 'dimensions') {
      out[key] = value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else {
      out[key] = value;
    }
  }
  const camel = (k: string) => k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const opts: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(out)) opts[camel(k)] = v;
  return opts as Partial<AddOptions>;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function readIndex(indexPath: string): ExemplarIndexType {
  const raw = readFileSync(indexPath, 'utf8');
  const parsed = JSON.parse(raw) as unknown;
  return ExemplarIndex.parse(parsed);
}

function writeIndex(indexPath: string, index: ExemplarIndexType): void {
  writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n', 'utf8');
}

function defaultPrototypePath(repoRoot: string, sprint: string, task: string): string {
  return relative(
    repoRoot,
    resolve(repoRoot, `sprint-orchestrator/sprints/${sprint}/prototypes/app/${task}/prototype.html`),
  );
}

function defaultScreenshotPath(repoRoot: string, sprint: string, task: string): string {
  return relative(
    repoRoot,
    resolve(
      repoRoot,
      `sprint-orchestrator/sprints/${sprint}/prototypes/app/${task}/screenshots/default.png`,
    ),
  );
}

function defaultApprovalStatusPath(repoRoot: string, sprint: string): string {
  return resolve(repoRoot, `sprint-orchestrator/sprints/${sprint}/prototypes/approval-status.yaml`);
}

function defaultQualityReportPath(
  repoRoot: string,
  sprint: string,
  task: string,
  screen: string,
): string {
  return resolve(
    repoRoot,
    `sprint-orchestrator/sprints/${sprint}/prototypes/app/${task}/quality-report.${screen}.yaml`,
  );
}

interface AntiSlopCheck {
  passed: boolean;
  source: string;
  detail: string;
}

/**
 * Confirm anti-slop audit precondition. Looks for `anti_slop_audit: passed`
 * in either approval-status.yaml or per-screen quality-report yaml. Returns
 * a structured result so callers (and tests) can introspect.
 */
export function checkAntiSlop(
  repoRoot: string,
  sprint: string,
  task: string,
  screen: string,
): AntiSlopCheck {
  const approvalPath = defaultApprovalStatusPath(repoRoot, sprint);
  if (existsSync(approvalPath)) {
    const yaml = parseYaml(readFileSync(approvalPath, 'utf8')) as Record<string, unknown>;
    const screens = (yaml?.screens ?? yaml) as Record<string, unknown>;
    const entry = screens?.[screen] as Record<string, unknown> | undefined;
    if (entry && entry.anti_slop_audit === 'passed') {
      return { passed: true, source: approvalPath, detail: 'approval-status.yaml passed' };
    }
  }
  const qualityPath = defaultQualityReportPath(repoRoot, sprint, task, screen);
  if (existsSync(qualityPath)) {
    const yaml = parseYaml(readFileSync(qualityPath, 'utf8')) as Record<string, unknown>;
    if (yaml?.anti_slop_audit === 'passed') {
      return { passed: true, source: qualityPath, detail: 'quality-report passed' };
    }
  }
  return {
    passed: false,
    source: approvalPath,
    detail:
      'anti_slop_audit: passed not found in approval-status.yaml or quality-report.<screen>.yaml',
  };
}

export async function addExemplar(opts: AddOptions): Promise<ExemplarMetaType> {
  const repoRoot = opts.repoRoot ?? REPO_ROOT;
  const galleryRoot = opts.galleryRoot ?? GALLERY_ROOT;
  const indexPath = opts.indexPath ?? INDEX_PATH;
  const now = opts.now ?? new Date().toISOString();

  const archetype = ScreenArchetype.parse(opts.archetype);
  const dimensions = opts.dimensions.map((d) => DesignDimension.parse(d));

  const prototypeRel =
    opts.prototypePath ?? defaultPrototypePath(repoRoot, opts.sprint, opts.task);
  const prototypeAbs = resolve(repoRoot, prototypeRel);
  if (!existsSync(prototypeAbs)) {
    throw new Error(`prototype.html not found at ${prototypeAbs}`);
  }

  const antiSlop = checkAntiSlop(repoRoot, opts.sprint, opts.task, opts.screen);
  if (!antiSlop.passed) {
    throw new Error(`anti-slop precondition failed: ${antiSlop.detail}`);
  }

  const screenshotRel =
    opts.screenshotPath ?? defaultScreenshotPath(repoRoot, opts.sprint, opts.task);
  const screenshotAbs = resolve(repoRoot, screenshotRel);
  if (!existsSync(screenshotAbs)) {
    throw new Error(
      `screenshot not found at ${screenshotAbs} — run capture-screenshots or pass --screenshot-path`,
    );
  }

  const id = opts.id ?? slugify(`${opts.sprint}-${opts.task}-${opts.screen}`);
  const meta = ExemplarMeta.parse({
    id,
    sprint_id: opts.sprint,
    task_id: opts.task,
    screen_name: opts.screen,
    archetype,
    why_curated: opts.reason,
    prototype_path: prototypeRel,
    screenshot_path: screenshotRel,
    design_dimensions: dimensions,
    added_by: opts.addedBy,
    added_at: now,
    last_validated_at: now,
    validation_status: 'valid',
    notes: opts.notes,
  } satisfies ExemplarMetaType);

  const index = readIndex(indexPath);
  if (index.exemplars.some((e) => e.id === id)) {
    throw new Error(`exemplar id "${id}" already exists in ${indexPath}`);
  }
  index.exemplars.push(meta);
  index.generated_at = now;
  writeIndex(indexPath, index);

  // Mark unused vars (gallery root reserved for future relative resolution helpers).
  void galleryRoot;
  return meta;
}

function requireField(opts: Partial<AddOptions>, key: keyof AddOptions): void {
  if (!opts[key] || (Array.isArray(opts[key]) && (opts[key] as unknown[]).length === 0)) {
    throw new Error(`missing required argument --${String(key).replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}`);
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  for (const key of ['sprint', 'task', 'screen', 'archetype', 'reason', 'dimensions', 'addedBy'] as const) {
    requireField(opts, key);
  }
  const meta = await addExemplar(opts as AddOptions);
  console.log(`Added exemplar ${meta.id} (${meta.archetype}) → ${INDEX_PATH}`);
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith('exemplar-add.ts');
if (invokedDirectly) {
  main().catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`exemplar-add: ${msg}`);
    process.exit(1);
  });
}
