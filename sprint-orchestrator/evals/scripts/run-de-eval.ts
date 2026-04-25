/**
 * DE Eval Runner
 *
 * Orchestrates the Design Engineer regression suite:
 *   1. Load `design-engineer-suite.yaml`
 *   2. For each (filtered) input: invoke the Claude Code CLI headless against
 *      the frozen snapshot to produce spec/html/quality-report
 *   3. Score against the matching baseline and aggregate into EvalSuiteResult
 *
 * Usage:
 *   tsx run-de-eval.ts                                # all inputs
 *   tsx run-de-eval.ts --inputs=ugc-001-home          # single input
 *   tsx run-de-eval.ts --no-compare                   # skip scoring (baseline bootstrap)
 *   tsx run-de-eval.ts --dry-run                      # plan only, no API calls
 *   tsx run-de-eval.ts --output-json=/tmp/result.json # write result to disk
 *
 * Cost: each input run = 30k-80k tokens against Opus. See evals/README.md.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import yaml from 'yaml';

import type {
  EvalInput,
  EvalSuite,
  EvalResult,
  EvalSuiteResult,
} from '../lib/types.js';
import { scoreInput } from './score.js';

// ---- CLI parsing ----------------------------------------------------------

interface CliOptions {
  inputs: string[] | null; // null = all
  noCompare: boolean;
  dryRun: boolean;
  outputJson: string | null;
  suitePath: string;
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    inputs: null,
    noCompare: false,
    dryRun: false,
    outputJson: null,
    suitePath: path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      '..',
      'design-engineer-suite.yaml',
    ),
  };
  for (const arg of argv) {
    if (arg.startsWith('--inputs=')) {
      opts.inputs = arg.slice('--inputs='.length).split(',').map((s) => s.trim()).filter(Boolean);
    } else if (arg === '--no-compare') {
      opts.noCompare = true;
    } else if (arg === '--dry-run') {
      opts.dryRun = true;
    } else if (arg.startsWith('--output-json=')) {
      opts.outputJson = arg.slice('--output-json='.length);
    } else if (arg.startsWith('--suite=')) {
      opts.suitePath = arg.slice('--suite='.length);
    }
  }
  return opts;
}

// ---- Suite loading --------------------------------------------------------

async function loadSuite(suitePath: string): Promise<EvalSuite> {
  const raw = await fs.readFile(suitePath, 'utf8');
  return yaml.parse(raw) as EvalSuite;
}

function filterInputs(all: EvalInput[], filter: string[] | null): EvalInput[] {
  if (!filter || filter.length === 0) return all;
  const set = new Set(filter);
  return all.filter((i) => set.has(i.id));
}

// ---- DE invocation --------------------------------------------------------

interface DeRunOutput {
  outputDir: string;
  durationMs: number;
}

/**
 * Invoke Claude Code CLI headless. The CLI is expected to read the DE prompt
 * + frozen snapshot from stdin and write artifacts (prototype.html /
 * screen-spec.yaml / quality-report.yaml) to outputDir.
 *
 * In --dry-run mode, this no-ops and returns a fake duration so the rest of
 * the pipeline can be exercised end-to-end without burning tokens.
 */
async function runDesignEngineer(
  input: EvalInput,
  inputDir: string,
  outputDir: string,
  dryRun: boolean,
): Promise<DeRunOutput> {
  await fs.mkdir(outputDir, { recursive: true });
  if (dryRun) {
    console.log(`[dry-run] would invoke DE for ${input.id}`);
    console.log(`  inputDir = ${inputDir}`);
    console.log(`  outputDir = ${outputDir}`);
    return { outputDir, durationMs: 0 };
  }

  const designEngineerPrompt = path.resolve(
    path.dirname(new URL(import.meta.url).pathname),
    '../../../.claude/teammates/design-engineer.md',
  );
  const snapshot = path.join(inputDir, 'frozen-snapshot.md');

  const promptPieces = [
    await fs.readFile(designEngineerPrompt, 'utf8').catch(() => ''),
    await fs.readFile(snapshot, 'utf8').catch(() => ''),
  ];
  const fullPrompt = promptPieces.filter(Boolean).join('\n\n---\n\n');

  const t0 = Date.now();
  await new Promise<void>((resolve, reject) => {
    const proc = spawn(
      'claude',
      ['-p', fullPrompt, '--output-format=json', `--output-dir=${outputDir}`],
      { stdio: ['ignore', 'inherit', 'inherit'] },
    );
    proc.on('error', reject);
    proc.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`claude exited with code ${code}`));
    });
  });

  return { outputDir, durationMs: Date.now() - t0 };
}

// ---- Main -----------------------------------------------------------------

export async function main(argv: string[] = process.argv.slice(2)): Promise<EvalSuiteResult> {
  const opts = parseArgs(argv);
  const suite = await loadSuite(opts.suitePath);
  const inputs = filterInputs(suite.inputs, opts.inputs);

  if (inputs.length === 0) {
    throw new Error(`No inputs match filter ${JSON.stringify(opts.inputs)}`);
  }

  const evalsRoot = path.dirname(opts.suitePath);
  const inputsRoot = path.join(evalsRoot, 'inputs');
  const baselinesRoot = path.join(evalsRoot, 'baselines');
  const runsRoot = path.join('/tmp', 'eval-runs');

  const results: EvalResult[] = [];
  for (const input of inputs) {
    const inputDir = path.join(inputsRoot, input.id);
    const baselineDir = path.join(baselinesRoot, input.id);
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const runDir = path.join(runsRoot, input.id, ts);

    console.log(`\n=== ${input.id} ===`);
    const runOut = await runDesignEngineer(input, inputDir, runDir, opts.dryRun);

    if (opts.noCompare) {
      console.log(`  no-compare: artifacts in ${runOut.outputDir}`);
      continue;
    }

    if (opts.dryRun) {
      console.log(`  [dry-run] would score ${runDir} vs ${baselineDir}`);
      continue;
    }

    try {
      const result = await scoreInput({
        inputId: input.id,
        currentDir: runDir,
        baselineDir,
      });
      results.push(result);
      console.log(`  status=${result.status} score=${result.regression_score.toFixed(3)}`);
      if (result.failures.length > 0) {
        console.log(`  failures: ${result.failures.join(', ')}`);
      }
    } catch (err) {
      console.error(`  scoring failed:`, err);
    }
  }

  const overallStatus: 'pass' | 'fail' = results.every((r) => r.status === 'pass')
    ? 'pass'
    : 'fail';

  const suiteResult: EvalSuiteResult = {
    suite_id: 'design-engineer-suite',
    generated_at: new Date().toISOString(),
    inputs: results,
    overall_status: overallStatus,
    summary: results
      .map((r) => `- ${r.input_id}: ${r.status} (${r.regression_score.toFixed(3)})`)
      .join('\n'),
  };

  if (opts.outputJson) {
    await fs.writeFile(opts.outputJson, JSON.stringify(suiteResult, null, 2));
    console.log(`\nWrote result to ${opts.outputJson}`);
  }

  if (!opts.dryRun && !opts.noCompare && overallStatus === 'fail') {
    process.exitCode = 1;
  }

  return suiteResult;
}

// Run if invoked directly (not on import)
const isDirect = import.meta.url === `file://${process.argv[1]}`;
if (isDirect) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
