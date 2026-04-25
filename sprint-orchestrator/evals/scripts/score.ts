/**
 * Scorer for the DE eval suite.
 *
 * Pure-function metric extractors + an integrated `scoreArtifacts` entrypoint
 * that composes them into a single weighted regression_score.
 *
 * The runner (run-de-eval.ts) is responsible for loading artifacts off disk
 * and feeding them in here as plain in-memory objects. Keeping score.ts I/O
 * free makes it trivially unit-testable.
 */
import type { EvalResult, MetricScore } from '../lib/types.js';

// ---- Defaults (kept in sync with design-engineer-suite.yaml) --------------

export const DEFAULT_METRIC_WEIGHTS = {
  token_compliance: 0.25,
  anti_slop_pass_rate: 0.2,
  spec_completeness: 0.15,
  verify_prototype_pass: 0.2,
  archetype_persona_compliance: 0.1,
  file_size_drift: 0.1,
} as const;

export const DEFAULT_THRESHOLD = {
  regression_score: 0.85,
  per_metric_floor: 0.7,
} as const;

const SPEC_REQUIRED_SECTIONS = [
  'meta',
  'layout',
  'components',
  'states',
  'motion',
  'copy',
  'data',
  'accessibility',
  'edge_cases',
  'archetype',
  'acceptance_criteria',
] as const;

// ---- Types ----------------------------------------------------------------

export interface QualityReport {
  anti_slop_audit?: {
    passed_count?: number;
    total_count?: number;
  };
  archetype_persona_passed?: boolean;
}

export interface VerifyResult {
  status?: 'pass' | 'fail' | string;
  clickErrors?: unknown[];
}

export interface ArtifactBundle {
  html: string;
  spec: Record<string, unknown>;
  qualityReport: QualityReport;
  verifyResult: VerifyResult;
  htmlBytes: number;
}

export interface ScoreArtifactsArgs {
  inputId: string;
  current: ArtifactBundle;
  baseline: ArtifactBundle;
  weights?: Record<string, number>;
  threshold?: { regression_score: number; per_metric_floor: number };
}

// ---- Per-metric extractors ------------------------------------------------

/**
 * Ratio of tokenized color references (`var(--*)`) to total color references
 * (`var(--*)` + `#RRGGBB`). Returns 1.0 when there are no color references at
 * all (vacuous pass — a screen with no styling can't violate token rules).
 */
export function computeTokenCompliance(html: string): number {
  const varRefs = html.match(/var\(--[a-zA-Z0-9_-]+\)/g)?.length ?? 0;
  const hexRefs = html.match(/#[0-9a-fA-F]{6}\b/g)?.length ?? 0;
  const total = varRefs + hexRefs;
  if (total === 0) return 1;
  return varRefs / total;
}

/** passed_count / total_count, clamped 0..1. Missing data → 0. */
export function computeAntiSlopPassRate(report: QualityReport): number {
  const audit = report?.anti_slop_audit;
  const total = audit?.total_count ?? 0;
  const passed = audit?.passed_count ?? 0;
  if (total <= 0) return 0;
  return Math.max(0, Math.min(1, passed / total));
}

/** Fraction of the 11 required sections present (truthy) on the spec. */
export function computeSpecCompleteness(spec: Record<string, unknown>): number {
  const present = SPEC_REQUIRED_SECTIONS.filter(
    (k) => spec && spec[k] !== undefined && spec[k] !== null,
  ).length;
  return present / SPEC_REQUIRED_SECTIONS.length;
}

/** 1 iff status === 'pass' AND clickErrors is empty. */
export function computeVerifyPrototypePass(result: VerifyResult): number {
  if (!result) return 0;
  if (result.status !== 'pass') return 0;
  if (Array.isArray(result.clickErrors) && result.clickErrors.length > 0) return 0;
  return 1;
}

/**
 * 1 when persona check passes OR is absent (vacuous), 0 when explicitly false.
 * Archetypes without persona rules don't penalize the score.
 */
export function computeArchetypePersonaCompliance(report: QualityReport): number {
  if (report?.archetype_persona_passed === undefined) return 1;
  return report.archetype_persona_passed ? 1 : 0;
}

/**
 * Penalize HTML that grew beyond baseline. Same size or smaller → 1.0.
 * 2× baseline → 0.5. Floor at 0.
 */
export function computeFileSizeDrift(currentBytes: number, baselineBytes: number): number {
  if (baselineBytes <= 0) return 1;
  if (currentBytes <= baselineBytes) return 1;
  return Math.max(0, baselineBytes / currentBytes);
}

// ---- Aggregator -----------------------------------------------------------

export function scoreArtifacts(args: ScoreArtifactsArgs): EvalResult {
  const weights = args.weights ?? (DEFAULT_METRIC_WEIGHTS as Record<string, number>);
  const threshold = args.threshold ?? DEFAULT_THRESHOLD;
  const t0 = Date.now();

  const metricValues: Record<string, { value: number; baseline: number }> = {
    token_compliance: {
      value: computeTokenCompliance(args.current.html),
      baseline: computeTokenCompliance(args.baseline.html),
    },
    anti_slop_pass_rate: {
      value: computeAntiSlopPassRate(args.current.qualityReport),
      baseline: computeAntiSlopPassRate(args.baseline.qualityReport),
    },
    spec_completeness: {
      value: computeSpecCompleteness(args.current.spec),
      baseline: computeSpecCompleteness(args.baseline.spec),
    },
    verify_prototype_pass: {
      value: computeVerifyPrototypePass(args.current.verifyResult),
      baseline: computeVerifyPrototypePass(args.baseline.verifyResult),
    },
    archetype_persona_compliance: {
      value: computeArchetypePersonaCompliance(args.current.qualityReport),
      baseline: computeArchetypePersonaCompliance(args.baseline.qualityReport),
    },
    file_size_drift: {
      value: computeFileSizeDrift(args.current.htmlBytes, args.baseline.htmlBytes),
      baseline: 1, // baseline against itself is always 1.0
    },
  };

  const metrics: MetricScore[] = [];
  const failures: string[] = [];
  let regressionScore = 0;

  for (const [name, weight] of Object.entries(weights)) {
    const slot = metricValues[name];
    if (!slot) continue;
    const value = slot.value;
    metrics.push({
      name,
      value,
      weight,
      baseline_value: slot.baseline,
      delta: value - slot.baseline,
    });
    regressionScore += value * weight;
    if (value < threshold.per_metric_floor) {
      failures.push(name);
    }
  }

  const status: 'pass' | 'fail' =
    failures.length === 0 && regressionScore >= threshold.regression_score
      ? 'pass'
      : 'fail';

  return {
    input_id: args.inputId,
    metrics,
    regression_score: regressionScore,
    status,
    failures,
    duration_ms: Date.now() - t0,
    artifacts: {
      spec_path: '',
      html_path: '',
      quality_report_path: '',
    },
  };
}

// ---- Disk-backed convenience (used by run-de-eval.ts) --------------------

export interface ScoreInputArgs {
  inputId: string;
  currentDir: string;
  baselineDir: string;
}

/**
 * Disk-backed wrapper. Loads artifacts from `currentDir` and `baselineDir`
 * and delegates to `scoreArtifacts`. Kept thin so tests can hit
 * `scoreArtifacts` directly with in-memory fixtures.
 *
 * Expected layout in each dir:
 *   prototype.html
 *   screen-spec.yaml
 *   quality-report.yaml
 *   verify-result.json (optional)
 */
export async function scoreInput(args: ScoreInputArgs): Promise<EvalResult> {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const yaml = await import('yaml');

  const load = async (dir: string): Promise<ArtifactBundle> => {
    const htmlPath = path.join(dir, 'prototype.html');
    const specPath = path.join(dir, 'screen-spec.yaml');
    const qrPath = path.join(dir, 'quality-report.yaml');
    const verifyPath = path.join(dir, 'verify-result.json');

    const html = await fs.readFile(htmlPath, 'utf8');
    const specRaw = await fs.readFile(specPath, 'utf8');
    const qrRaw = await fs.readFile(qrPath, 'utf8');
    let verifyResult: VerifyResult = { status: 'pass', clickErrors: [] };
    try {
      const verifyRaw = await fs.readFile(verifyPath, 'utf8');
      verifyResult = JSON.parse(verifyRaw);
    } catch {
      // verify-result.json is optional; default to passing
    }

    const stat = await fs.stat(htmlPath);
    return {
      html,
      spec: yaml.parse(specRaw) as Record<string, unknown>,
      qualityReport: yaml.parse(qrRaw) as QualityReport,
      verifyResult,
      htmlBytes: stat.size,
    };
  };

  const [current, baseline] = await Promise.all([
    load(args.currentDir),
    load(args.baselineDir),
  ]);

  const result = scoreArtifacts({
    inputId: args.inputId,
    current,
    baseline,
  });

  result.artifacts = {
    spec_path: path.join(args.currentDir, 'screen-spec.yaml'),
    html_path: path.join(args.currentDir, 'prototype.html'),
    quality_report_path: path.join(args.currentDir, 'quality-report.yaml'),
  };

  return result;
}
