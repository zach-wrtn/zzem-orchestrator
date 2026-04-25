export interface MetricSpec {
  weight: number;
  description: string;
  extractor: string;
}

export interface EvalSuite {
  schema_version: '1.0';
  threshold: {
    regression_score: number;
    per_metric_floor: number;
  };
  metrics: Record<string, MetricSpec>;
  inputs: EvalInput[];
  ci: {
    trigger_paths: string[];
    cooldown_per_day: number;
    fail_blocks_merge: boolean;
  };
}

export interface EvalInput {
  id: string;
  description: string;
  expected_archetype?: string;
}

export interface MetricScore {
  name: string;
  value: number;          // 0-1
  weight: number;
  baseline_value: number;
  delta: number;          // value - baseline_value
}

export interface EvalResult {
  input_id: string;
  metrics: MetricScore[];
  regression_score: number;
  status: 'pass' | 'fail';
  failures: string[];     // metric names below floor
  duration_ms: number;
  artifacts: {
    spec_path: string;
    html_path: string;
    quality_report_path: string;
  };
}

export interface EvalSuiteResult {
  suite_id: string;
  generated_at: string;
  inputs: EvalResult[];
  overall_status: 'pass' | 'fail';
  summary: string;
}
