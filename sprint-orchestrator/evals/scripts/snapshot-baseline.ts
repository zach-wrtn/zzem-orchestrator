/**
 * Promote the most recent eval run to a frozen baseline.
 *
 * Usage:
 *   tsx snapshot-baseline.ts --inputs=ugc-001-home
 *   tsx snapshot-baseline.ts --inputs=ugc-001-home --dry-run
 *
 * Flow:
 *   1. Find latest /tmp/eval-runs/<id>/<latest>/
 *   2. Show git diff between current baselines/<id>/ and the new run
 *   3. Copy new run into baselines/<id>/ (overwrite)
 *   4. Update baselines/<id>/meta.yaml with frozen_at + de_version_hash
 *   5. Print `git add` instructions
 *
 * Always treat baseline overwrites as user-approved actions: this CLI does
 * not auto-commit. A human reviews the diff and stages the change.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

interface CliOptions {
  inputs: string[];
  dryRun: boolean;
  evalsRoot: string;
  runsRoot: string;
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    inputs: [],
    dryRun: false,
    evalsRoot: path.resolve(path.dirname(new URL(import.meta.url).pathname), '..'),
    runsRoot: '/tmp/eval-runs',
  };
  for (const arg of argv) {
    if (arg.startsWith('--inputs=')) {
      opts.inputs = arg.slice('--inputs='.length).split(',').map((s) => s.trim()).filter(Boolean);
    } else if (arg === '--dry-run') {
      opts.dryRun = true;
    } else if (arg.startsWith('--runs-root=')) {
      opts.runsRoot = arg.slice('--runs-root='.length);
    }
  }
  return opts;
}

async function findLatestRun(runsRoot: string, inputId: string): Promise<string | null> {
  const dir = path.join(runsRoot, inputId);
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return null;
  }
  const sorted = entries
    .filter((e) => !e.startsWith('.'))
    .sort()
    .reverse();
  if (sorted.length === 0) return null;
  return path.join(dir, sorted[0]);
}

async function copyDir(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

function gitDiff(targetDir: string): void {
  const result = spawnSync('git', ['diff', '--stat', '--', targetDir], {
    encoding: 'utf8',
  });
  if (result.stdout) console.log(result.stdout);
}

function gitRevParse(filePath: string): string {
  const result = spawnSync('git', ['log', '-n', '1', '--pretty=format:%H', '--', filePath], {
    encoding: 'utf8',
  });
  return result.stdout?.trim() || 'unknown';
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
  const opts = parseArgs(argv);
  if (opts.inputs.length === 0) {
    throw new Error('--inputs=<id1,id2,...> is required');
  }

  for (const inputId of opts.inputs) {
    console.log(`\n=== promote ${inputId} ===`);
    const latestRun = await findLatestRun(opts.runsRoot, inputId);
    if (!latestRun) {
      console.error(`  no runs found in ${opts.runsRoot}/${inputId}/`);
      continue;
    }
    console.log(`  source: ${latestRun}`);

    const baselineDir = path.join(opts.evalsRoot, 'baselines', inputId);
    console.log(`  target: ${baselineDir}`);

    if (opts.dryRun) {
      console.log(`  [dry-run] would copy ${latestRun} -> ${baselineDir}`);
      continue;
    }

    await copyDir(latestRun, baselineDir);

    const repoRoot = path.resolve(opts.evalsRoot, '..', '..');
    const metaPath = path.join(baselineDir, 'meta.yaml');
    const meta = [
      `frozen_at: "${new Date().toISOString()}"`,
      `frozen_by: "$(git config user.email)"`,
      `de_version_hash: "${gitRevParse(path.join(repoRoot, '.claude/teammates/design-engineer.md'))}"`,
      `phase_prototype_hash: "${gitRevParse(path.join(repoRoot, '.claude/skills/sprint/phase-prototype.md'))}"`,
      `notes: "Promoted from ${path.basename(latestRun)}."`,
      '',
    ].join('\n');
    await fs.writeFile(metaPath, meta);

    console.log('  ---- diff ----');
    gitDiff(baselineDir);
    console.log(`\n  next: git add ${baselineDir}`);
  }
}

const isDirect = import.meta.url === `file://${process.argv[1]}`;
if (isDirect) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
