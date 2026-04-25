/**
 * Exemplar re-validation CLI.
 *
 * Walks the curated showcase index, re-runs verify-prototype on each
 * `prototype_path`, then mutates `validation_status` + `last_validated_at`.
 * Exit 1 if any exemplar transitions to `invalid` so the gallery build chain
 * (wired between verify:prototypes and capture:screenshots) fails fast.
 *
 * Stale-marking: any entry whose `last_validated_at` is older than 30 days
 * relative to the run timestamp is downgraded to `stale` and excluded from
 * downstream lookup until a curator re-runs `gallery:exemplar:validate`.
 *
 * Usage:
 *   pnpm gallery:exemplar:validate [--id=<exemplar-id>]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ExemplarIndex,
  type ExemplarIndex as ExemplarIndexType,
  type ExemplarMeta,
} from '../src/lib/exemplars/schema.js';
import { verifyPrototype, type VerifyResult } from './verify-prototype.js';

const HERE = dirname(fileURLToPath(import.meta.url));
export const GALLERY_ROOT = resolve(HERE, '..');
export const REPO_ROOT = resolve(GALLERY_ROOT, '..');
export const INDEX_PATH = resolve(GALLERY_ROOT, 'exemplars/_index.json');

const STALE_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

export type VerifyFn = (htmlPath: string) => Promise<VerifyResult>;

export interface ValidateOptions {
  id?: string;
  /** ISO8601 timestamp override (test-only). */
  now?: string;
  /** Custom index path (test-only). */
  indexPath?: string;
  /** Custom repo root (test-only). */
  repoRoot?: string;
  /** Custom gallery root (test-only). */
  galleryRoot?: string;
  /** Verifier injection (test-only). null + skipVerify=true → no-op. */
  verify?: VerifyFn | null;
  /** When true, do not call the verifier — only refresh stale state. */
  skipVerify?: boolean;
}

export interface ValidateResult {
  exitCode: number;
  validated: number;
  invalid: number;
  stale: number;
}

function parseArgs(argv: string[]): { id?: string } {
  const out: { id?: string } = {};
  for (const arg of argv) {
    if (arg.startsWith('--id=')) out.id = arg.slice('--id='.length);
  }
  return out;
}

function readIndex(indexPath: string): ExemplarIndexType {
  const raw = readFileSync(indexPath, 'utf8');
  return ExemplarIndex.parse(JSON.parse(raw));
}

function writeIndex(indexPath: string, index: ExemplarIndexType): void {
  writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n', 'utf8');
}

function isStale(now: number, lastValidatedAt: string): boolean {
  const t = Date.parse(lastValidatedAt);
  if (Number.isNaN(t)) return false;
  return now - t > STALE_AFTER_MS;
}

export async function validateExemplars(opts: ValidateOptions = {}): Promise<ValidateResult> {
  const repoRoot = opts.repoRoot ?? REPO_ROOT;
  const indexPath = opts.indexPath ?? INDEX_PATH;
  const nowIso = opts.now ?? new Date().toISOString();
  const nowMs = Date.parse(nowIso);
  const verify: VerifyFn | null = opts.skipVerify ? null : (opts.verify ?? verifyPrototype);

  const index = readIndex(indexPath);
  const targets = opts.id
    ? index.exemplars.filter((e) => e.id === opts.id)
    : index.exemplars;

  if (targets.length === 0) {
    console.log(`exemplar-validate: 0 exemplars in ${indexPath} (nothing to do)`);
    index.generated_at = nowIso;
    writeIndex(indexPath, index);
    return { exitCode: 0, validated: 0, invalid: 0, stale: 0 };
  }

  let validated = 0;
  let invalid = 0;
  let stale = 0;

  for (const exemplar of targets) {
    const absolute = resolve(repoRoot, exemplar.prototype_path);
    if (!existsSync(absolute)) {
      exemplar.validation_status = 'invalid';
      console.error(`✗ ${exemplar.id} — prototype.html missing at ${absolute}`);
      invalid += 1;
      continue;
    }

    let verifierResult: VerifyResult | null = null;
    if (verify) {
      try {
        verifierResult = await verify(absolute);
      } catch (err: unknown) {
        verifierResult = {
          file: absolute,
          status: 'fail',
          consoleErrors: [],
          unhandledRejections: [],
          clickedElements: 0,
          clickErrors: [err instanceof Error ? err.message : String(err)],
          durationMs: 0,
        };
      }
    }

    if (verifierResult && verifierResult.status === 'fail') {
      exemplar.validation_status = 'invalid';
      invalid += 1;
      console.error(`✗ ${exemplar.id} — verifier fail (${verifierResult.clickErrors.length} errors)`);
      continue;
    }

    if (verifierResult && verifierResult.status === 'pass') {
      exemplar.validation_status = 'valid';
      exemplar.last_validated_at = nowIso;
      validated += 1;
      console.log(`✓ ${exemplar.id}`);
    }

    // Apply stale marking last so a freshly-validated entry always wins.
    if (isStale(nowMs, exemplar.last_validated_at) && exemplar.validation_status !== 'invalid') {
      exemplar.validation_status = 'stale';
      stale += 1;
      console.warn(`… ${exemplar.id} stale (last validated ${exemplar.last_validated_at})`);
    }
  }

  index.generated_at = nowIso;
  writeIndex(indexPath, index);

  console.log(
    `exemplar-validate: ${validated} valid / ${invalid} invalid / ${stale} stale (of ${targets.length})`,
  );
  return { exitCode: invalid > 0 ? 1 : 0, validated, invalid, stale };
}

async function main() {
  const { id } = parseArgs(process.argv.slice(2));
  const result = await validateExemplars({ id });
  process.exit(result.exitCode);
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith('exemplar-validate.ts');
if (invokedDirectly) {
  main().catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`exemplar-validate: ${msg}`);
    process.exit(1);
  });
}

// Helper for type-only tools that import types from here.
export type ExemplarMetaForValidate = ExemplarMeta;
