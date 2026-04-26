# BE-006 — fal.ai Callback Dispatch by `decompRole`

## Target
- `apps/meme-api/src/controller/filter/filter.controller.ts` (existing `/filters/callback/fal-ai`).
- `apps/meme-api/src/application/filter/filter-creation.app-service.ts` 의 `falAiCallback()` (또는 dispatch sub-service).

## Context
기존 callback 경로를 그대로 사용하되, 수신 Content의 `decompRole`에 따라 분기. NEVER:
"기존 gen 엔드포인트를 preview 용도로 수정하지 않는다" — 본 변경은 callback 디스패처
한 곳에서만.

## Objective
- `decompRole === 'i2i'`인 Content에 대해 **S3 저장 / 썸네일 생성 / 워터마크 적용**을
  스킵하고 fal.ai CDN URL을 결과로 보존 (AC 2.3.3, BR-6, BR-7, BR-11).
- `decompRole !== 'i2i'`이면 기존 후처리 경로 그대로 (회귀 0건).
- BE-005와 함께: Content에 `cancelledAt`이 있으면 **결과 저장 자체를 스킵** (슬롯만
  해제), 결과 폐기.

## Specification

### Decision tree on callback receipt
1. Content를 contentId로 조회. 없으면 무시 (idempotent).
2. `cancelledAt`이 세팅 → 슬롯만 release, status=CANCELLED 유지, 결과 폐기. End.
3. `decompRole === 'i2i'`:
   - 결과 image URL을 Content에 저장 (`falCdnUrl`).
   - status=DONE.
   - 슬롯 release.
   - **NO** S3 copy, **NO** thumbnail, **NO** watermark.
4. otherwise (i2v 또는 기존 단일 workflow):
   - 기존 후처리 경로 그대로 호출.

### Failure path
- fal.ai 콜백이 실패 status를 가져오면 BE-007 환불 로직으로 위임.

## Acceptance Criteria
- [ ] `decompRole === 'i2i'` Content의 결과: S3 객체 0개, 썸네일 0개, 워터마크 미적용, fal CDN URL 저장됨.
- [ ] `decompRole === 'i2v'` Content는 기존 후처리 경로(S3+썸네일+워터마크)를 그대로 거친다.
- [ ] `cancelledAt` 세팅된 i2i Content는 결과 저장도 안 됨 — Content 도큐먼트가 콜백 전후로 (status·cancelledAt 외) 변하지 않는다.
- [ ] 기존 atomic workflow (parent의 단일 i2i+i2v gen)의 콜백 동작이 회귀하지 않는다.

## Implementation Hints
- 기존 dispatch 함수에 `if/else` 분기 추가가 아니라, `decompRole`별 strategy 함수를 둬서 가독성 확보 권장 (단, 이 sprint의 scope-creep는 피한다).
