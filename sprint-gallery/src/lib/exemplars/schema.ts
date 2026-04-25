/**
 * Curated Exemplar Schema
 *
 * Zod-validated metadata for gold-standard prototypes promoted from passing
 * sprint output. Consumed by:
 * - `scripts/exemplar-add.ts` — append to `_index.json`
 * - `scripts/exemplar-validate.ts` — re-run verify-prototype + mark stale
 * - `scripts/exemplar-lookup.ts` — DE Frozen Snapshot inline source
 *
 * Eligibility (all must hold) — see `exemplars/README.md`:
 * 1. Pass 6 Anti-Slop Audit 7/7 passed
 * 2. verify-prototype passed (status: pass, clickErrors 0)
 * 3. Explicit user / Sprint Lead approval
 * 4. archetype classification agreement
 */
import { z } from 'zod';

export const ScreenArchetype = z.enum([
  'feed',         // 스크롤 리스트 (피드, 검색결과)
  'detail',       // 상세 페이지 (hero + body)
  'onboarding',   // 진행형 (스텝 + large CTAs)
  'form',         // 입력 (validation + 버튼 상태)
  'modal',        // 모달/시트 (backdrop + focus)
  'empty_state',  // 빈 상태 (illustration + CTA)
  'nav_list',     // 설정/메뉴 list — homogeneous nav (post-zzem-orchestrator#41)
]);
export type ScreenArchetype = z.infer<typeof ScreenArchetype>;

export const DesignDimension = z.enum([
  'token_compliance',
  'asset_fidelity',
  'motion',
  'archetype_fit',
  'interaction_completeness',
  'empty_state_handling',
]);
export type DesignDimension = z.infer<typeof DesignDimension>;

export const ValidationStatus = z.enum(['valid', 'stale', 'invalid']);
export type ValidationStatus = z.infer<typeof ValidationStatus>;

export const ExemplarMeta = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),                // exemplar slug
  sprint_id: z.string(),                                // 출처 sprint
  task_id: z.string(),                                  // 출처 task
  screen_name: z.string(),
  archetype: ScreenArchetype,
  why_curated: z.string().min(20).max(280),             // 한 줄 큐레이션 사유
  prototype_path: z.string(),                           // sprint-gallery 기준 상대경로
  screenshot_path: z.string(),                          // 썸네일 (capture-screenshots 산출)
  design_dimensions: z.array(DesignDimension).min(1),
  added_by: z.string(),                                 // 큐레이터 (사용자 핸들)
  added_at: z.string(),                                 // ISO8601
  last_validated_at: z.string(),                        // ISO8601
  validation_status: ValidationStatus,
  notes: z.string().optional(),
});
export type ExemplarMeta = z.infer<typeof ExemplarMeta>;

export const ExemplarIndex = z.object({
  schema_version: z.literal('1.0'),
  generated_at: z.string(),
  exemplars: z.array(ExemplarMeta),
});
export type ExemplarIndex = z.infer<typeof ExemplarIndex>;
