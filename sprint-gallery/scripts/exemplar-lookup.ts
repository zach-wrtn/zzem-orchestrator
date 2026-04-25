/**
 * Exemplar lookup CLI — invoked by Sprint Lead during Frozen Snapshot
 * assembly to inline structural references for the Design Engineer.
 *
 * Filters: archetype + validation_status=valid, optional exclude-sprint
 * (prevents reflexive self-copy), optional --keywords boost on
 * `notes` / `why_curated`, top-N (default 2).
 *
 * Usage:
 *   pnpm gallery:exemplar:lookup \
 *     --archetype=<feed|detail|onboarding|form|modal|empty_state> \
 *     [--limit=2] \
 *     [--keywords="..."] \
 *     [--exclude-sprint=<sprint-id>] \
 *     --format=json|md
 *
 * stdout is the consumed surface — DE captures it verbatim.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ExemplarIndex,
  ScreenArchetype,
  type ExemplarMeta,
} from '../src/lib/exemplars/schema.js';

const HERE = dirname(fileURLToPath(import.meta.url));
export const GALLERY_ROOT = resolve(HERE, '..');
export const INDEX_PATH = resolve(GALLERY_ROOT, 'exemplars/_index.json');

export interface LookupOptions {
  archetype: string;
  limit?: number;
  keywords?: string;
  excludeSprint?: string;
  /** Custom index path (test-only). */
  indexPath?: string;
}

interface CliOptions extends LookupOptions {
  format?: 'json' | 'md';
}

function parseArgs(argv: string[]): Partial<CliOptions> {
  const out: Record<string, string | number> = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const eq = arg.indexOf('=');
    if (eq < 0) continue;
    const key = arg.slice(2, eq);
    const value = arg.slice(eq + 1);
    out[key] = value;
  }
  const result: Partial<CliOptions> = {};
  if (typeof out.archetype === 'string') result.archetype = out.archetype;
  if (typeof out.limit === 'string') result.limit = Number.parseInt(out.limit, 10);
  if (typeof out.keywords === 'string') result.keywords = out.keywords;
  if (typeof out['exclude-sprint'] === 'string') {
    result.excludeSprint = out['exclude-sprint'] as string;
  }
  if (out.format === 'json' || out.format === 'md') result.format = out.format;
  return result;
}

function tokenize(s: string | undefined): string[] {
  if (!s) return [];
  return s
    .toLowerCase()
    .split(/[^a-z0-9가-힣]+/u)
    .filter((t) => t.length >= 2);
}

function scoreExemplar(exemplar: ExemplarMeta, keywordTokens: string[]): number {
  if (keywordTokens.length === 0) return 0;
  const haystack = (exemplar.why_curated + ' ' + (exemplar.notes ?? '')).toLowerCase();
  let score = 0;
  for (const tok of keywordTokens) {
    if (haystack.includes(tok)) score += 1;
  }
  return score;
}

export async function lookupExemplars(opts: LookupOptions): Promise<ExemplarMeta[]> {
  const indexPath = opts.indexPath ?? INDEX_PATH;
  const archetype = ScreenArchetype.parse(opts.archetype);
  const limit = opts.limit && opts.limit > 0 ? opts.limit : 2;

  const raw = readFileSync(indexPath, 'utf8');
  const index = ExemplarIndex.parse(JSON.parse(raw));

  const keywordTokens = tokenize(opts.keywords);

  const filtered = index.exemplars
    .filter((e) => e.archetype === archetype)
    .filter((e) => e.validation_status === 'valid')
    .filter((e) => !opts.excludeSprint || e.sprint_id !== opts.excludeSprint)
    .map((e) => ({ exemplar: e, score: scoreExemplar(e, keywordTokens) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.exemplar);

  return filtered;
}

export function formatExemplarsAsMarkdown(exemplars: ExemplarMeta[]): string {
  if (exemplars.length === 0) {
    return '## Exemplar References\n\n_(none — no curated exemplar matches this archetype)_\n';
  }
  const lines: string[] = ['## Exemplar References', ''];
  lines.push('> 참조만 — 콘텐츠/이미지 복사 금지. 구조적 패턴 (레이아웃, interaction, 상태 표현) 만 참고.');
  lines.push('');
  for (const e of exemplars) {
    lines.push(`- id: \`${e.id}\``);
    lines.push(`  archetype: ${e.archetype}`);
    lines.push(`  why_curated: ${e.why_curated}`);
    lines.push(`  prototype_path: \`${e.prototype_path}\``);
    lines.push(`  screenshot_path: \`${e.screenshot_path}\``);
    lines.push(`  dimensions: [${e.design_dimensions.join(', ')}]`);
    lines.push('');
  }
  return lines.join('\n');
}

export function formatExemplarsAsJson(exemplars: ExemplarMeta[]): string {
  return JSON.stringify(exemplars, null, 2);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.archetype) {
    console.error('exemplar-lookup: --archetype is required');
    process.exit(1);
  }
  const format = opts.format ?? 'md';
  const results = await lookupExemplars(opts as LookupOptions);
  if (format === 'json') {
    process.stdout.write(formatExemplarsAsJson(results) + '\n');
  } else {
    process.stdout.write(formatExemplarsAsMarkdown(results));
  }
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith('exemplar-lookup.ts');
if (invokedDirectly) {
  main().catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`exemplar-lookup: ${msg}`);
    process.exit(1);
  });
}
