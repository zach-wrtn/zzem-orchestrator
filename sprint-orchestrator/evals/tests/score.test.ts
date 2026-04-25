import { describe, it, expect } from 'vitest';
import {
  computeTokenCompliance,
  computeAntiSlopPassRate,
  computeSpecCompleteness,
  computeVerifyPrototypePass,
  computeArchetypePersonaCompliance,
  computeFileSizeDrift,
  scoreArtifacts,
  DEFAULT_THRESHOLD,
  DEFAULT_METRIC_WEIGHTS,
} from '../scripts/score.js';

// ---- Fixture helpers ------------------------------------------------------

const tokenCompliantHtml = `<style>
.btn { color: var(--color-fg-primary); background: var(--color-bg-primary); }
.card { padding: var(--space-4); border-radius: var(--radius-md); }
.text { font-family: var(--font-sans); }
</style>`;

const rawHexHtml = `<style>
.btn { color: #ff0000; background: #00ff00; }
.card { padding: 16px; border-radius: 8px; color: #112233; }
.text { color: #aabbcc; background: #336699; }
</style>`;

const fullSpec = {
  meta: { id: 'x' },
  layout: {},
  components: {},
  states: {},
  motion: {},
  copy: {},
  data: {},
  accessibility: {},
  edge_cases: {},
  archetype: {},
  acceptance_criteria: {},
};

const partialSpec = {
  meta: { id: 'x' },
  layout: {},
  components: {},
};

const passingQualityReport = {
  anti_slop_audit: {
    passed_count: 7,
    total_count: 7,
  },
  archetype_persona_passed: true,
};

const failingQualityReport = {
  anti_slop_audit: {
    passed_count: 3,
    total_count: 7,
  },
  archetype_persona_passed: false,
};

const verifyPass = { status: 'pass', clickErrors: [] };
const verifyFailStatus = { status: 'fail', clickErrors: [] };
const verifyFailClick = { status: 'pass', clickErrors: [{ id: 'btn-1' }] };

// ---- Per-metric tests -----------------------------------------------------

describe('computeTokenCompliance', () => {
  it('returns near-1 for fully tokenized CSS', () => {
    const v = computeTokenCompliance(tokenCompliantHtml);
    expect(v).toBeGreaterThanOrEqual(0.9);
  });

  it('returns near-0 when raw hex dominates', () => {
    const v = computeTokenCompliance(rawHexHtml);
    expect(v).toBeLessThan(0.5);
  });

  it('returns 1 when no color references at all (vacuous pass)', () => {
    const v = computeTokenCompliance('<div>no styles</div>');
    expect(v).toBe(1);
  });
});

describe('computeAntiSlopPassRate', () => {
  it('returns passed_count / total_count', () => {
    expect(computeAntiSlopPassRate(passingQualityReport)).toBe(1);
    expect(computeAntiSlopPassRate(failingQualityReport)).toBeCloseTo(3 / 7, 4);
  });

  it('returns 0 when total_count is 0 or missing', () => {
    expect(computeAntiSlopPassRate({})).toBe(0);
  });
});

describe('computeSpecCompleteness', () => {
  it('returns 1 when all 11 sections present', () => {
    expect(computeSpecCompleteness(fullSpec)).toBe(1);
  });

  it('returns fractional when partial', () => {
    expect(computeSpecCompleteness(partialSpec)).toBeCloseTo(3 / 11, 4);
  });
});

describe('computeVerifyPrototypePass', () => {
  it('returns 1 on pass + zero clickErrors', () => {
    expect(computeVerifyPrototypePass(verifyPass)).toBe(1);
  });

  it('returns 0 on non-pass status', () => {
    expect(computeVerifyPrototypePass(verifyFailStatus)).toBe(0);
  });

  it('returns 0 when clickErrors not empty', () => {
    expect(computeVerifyPrototypePass(verifyFailClick)).toBe(0);
  });
});

describe('computeArchetypePersonaCompliance', () => {
  it('returns 1 when archetype_persona_passed true', () => {
    expect(computeArchetypePersonaCompliance(passingQualityReport)).toBe(1);
  });

  it('returns 0 when explicitly false', () => {
    expect(computeArchetypePersonaCompliance(failingQualityReport)).toBe(0);
  });

  it('returns 1 when missing (vacuous)', () => {
    expect(computeArchetypePersonaCompliance({})).toBe(1);
  });
});

describe('computeFileSizeDrift', () => {
  it('returns 1 when current size <= baseline', () => {
    expect(computeFileSizeDrift(1000, 1000)).toBe(1);
    expect(computeFileSizeDrift(800, 1000)).toBe(1);
  });

  it('returns < 1 when current size > baseline', () => {
    expect(computeFileSizeDrift(2000, 1000)).toBe(0.5);
  });
});

// ---- Integrated scorer tests ----------------------------------------------

describe('scoreArtifacts', () => {
  it('returns 1.0 when artifacts exactly match baseline', () => {
    const result = scoreArtifacts({
      inputId: 'fixture-identical',
      current: {
        html: tokenCompliantHtml,
        spec: fullSpec,
        qualityReport: passingQualityReport,
        verifyResult: verifyPass,
        htmlBytes: 1000,
      },
      baseline: {
        html: tokenCompliantHtml,
        spec: fullSpec,
        qualityReport: passingQualityReport,
        verifyResult: verifyPass,
        htmlBytes: 1000,
      },
    });
    expect(result.regression_score).toBeGreaterThanOrEqual(0.99);
    expect(result.status).toBe('pass');
    expect(result.failures).toEqual([]);
  });

  it('fails when token_compliance drops below per_metric_floor', () => {
    const result = scoreArtifacts({
      inputId: 'fixture-raw-hex',
      current: {
        html: rawHexHtml,
        spec: fullSpec,
        qualityReport: passingQualityReport,
        verifyResult: verifyPass,
        htmlBytes: 1000,
      },
      baseline: {
        html: tokenCompliantHtml,
        spec: fullSpec,
        qualityReport: passingQualityReport,
        verifyResult: verifyPass,
        htmlBytes: 1000,
      },
    });
    expect(result.status).toBe('fail');
    expect(result.failures).toContain('token_compliance');
  });

  it('fails when verify_prototype_pass drops to 0', () => {
    const result = scoreArtifacts({
      inputId: 'fixture-broken-clicks',
      current: {
        html: tokenCompliantHtml,
        spec: fullSpec,
        qualityReport: passingQualityReport,
        verifyResult: verifyFailClick,
        htmlBytes: 1000,
      },
      baseline: {
        html: tokenCompliantHtml,
        spec: fullSpec,
        qualityReport: passingQualityReport,
        verifyResult: verifyPass,
        htmlBytes: 1000,
      },
    });
    expect(result.status).toBe('fail');
    expect(result.failures).toContain('verify_prototype_pass');
  });

  it('aggregates regression_score as weighted sum of metrics', () => {
    const result = scoreArtifacts({
      inputId: 'fixture-mid',
      current: {
        html: tokenCompliantHtml,
        spec: fullSpec,
        qualityReport: passingQualityReport,
        verifyResult: verifyPass,
        htmlBytes: 1000,
      },
      baseline: {
        html: tokenCompliantHtml,
        spec: fullSpec,
        qualityReport: passingQualityReport,
        verifyResult: verifyPass,
        htmlBytes: 1000,
      },
    });
    const expected =
      Object.values(DEFAULT_METRIC_WEIGHTS).reduce((acc, w) => acc + w * 1, 0);
    expect(result.regression_score).toBeCloseTo(expected, 4);
  });

  it('exposes DEFAULT_THRESHOLD constants', () => {
    expect(DEFAULT_THRESHOLD.regression_score).toBe(0.85);
    expect(DEFAULT_THRESHOLD.per_metric_floor).toBe(0.7);
  });
});
