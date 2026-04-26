# BE-009 — Concurrency Slot Management (i2i / i2v / cancel)

## Target
- `apps/meme-api/src/common/constant/generation-limit.constant.ts` (existing `MAX_CONCURRENT_GENERATIONS`).
- 슬롯 acquire/release 헬퍼가 분산되어 있으면 단일 module로 강화.

## Context
BR-4: preview i2i/i2v 모두 기존 slot pool에 포함. i2i 완료 후 슬롯 반환 → 유저 결정 →
i2v 시 재점유. 슬롯 부족 시 기존 429 패턴 재사용.

## Objective
preview 경로(start/proceed/cancel + callback)에서 slot 점유·반환 규칙을 정확히 구현.

## Specification

### Acquire / Release 시점
| Phase | Action |
|---|---|
| BE-003 preview start | acquire 1 (PENDING으로 진입). |
| BE-006 callback (i2i 완료/실패) | release 1. |
| BE-005 cancel (loading 중) | release 1 (즉시). 이후 도착 콜백은 release하지 않는다. |
| BE-004 proceed | acquire 1 (i2v 시작). 별도 Content이므로 새 슬롯. |
| BE-006 callback (i2v 완료/실패) | release 1. |

### Idempotency
- 콜백이 중복 도착해도 release는 1회만.
- cancel 후 콜백 도착 시 release 시도하지 않는다 (이미 release됨).

### Counter source of truth
- 기존 slot 카운터 (Redis 또는 DB) 그대로 사용. 신규 카운터 만들지 않는다.

## Acceptance Criteria
- [ ] preview start 직후 active count += 1.
- [ ] 콜백(성공/실패) 후 active count -= 1.
- [ ] cancel 후 active count -= 1, 후속 콜백은 무영향.
- [ ] proceed 직후 active count += 1 (i2v).
- [ ] proceed 콜백 후 active count -= 1.
- [ ] 슬롯 풀 ≥ MAX 시 start/proceed 모두 429 + 차감 없음.
