# BE-007 — Refund Policy (i2i 전액 / i2v 부분)

## Target
- `apps/meme-api/src/application/filter/filter-creation.app-service.ts` 의 실패 콜백
  처리 경로 (또는 `preview-refund.app-service.ts` 신규).
- credit-app.service.

## Context
BR-3 환불 정책. 기존 `refundByContentId` 또는 등가 helper가 있으나 i2v 부분 환불은
신규. 패턴: `correctness-005`(reference 파일 경로 명시).

## Objective
- i2i 실패 → previewCredit 전액 환불.
- i2v 실패 → i2v 크레딧(`총액 - previewCredit`)만 환불. previewCredit은 유지 (서비스
  이행됨).

## Specification

### Trigger
- fal.ai 콜백 status가 실패 + Content가 preview 경로 (`decompRole !== null`).

### Logic
- `decompRole === 'i2i'`:
  - 환불 = `previewCredit` (Content 차감 시 사용한 정확한 금액).
- `decompRole === 'i2v'`:
  - 환불 = `parent.requiredCredit - previewCredit` (= i2v 차감액).
  - source preview Content (`sourcePreviewContentId`)의 previewCredit은 환불 대상 아님.

### Audit / 멱등성
- 동일 contentId에 대해 두 번 환불되지 않도록 idempotency key를 `contentId + 'refund'` 등으로 고정.

## Acceptance Criteria
- [ ] i2i 실패 → 유저 잔액 += previewCredit 정확히.
- [ ] i2v 실패 → 유저 잔액 += (총액 - previewCredit) 정확히. previewCredit은 변동 없음.
- [ ] 동일 contentId에 대한 콜백이 중복 도착해도 환불은 1회만.
- [ ] cancel(BE-005)은 환불을 트리거하지 않는다.
