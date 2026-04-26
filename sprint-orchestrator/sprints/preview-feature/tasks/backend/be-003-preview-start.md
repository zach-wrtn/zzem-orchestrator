# BE-003 — `POST /filters/:filterId/preview` (Preview Start)

## Target
- Controller: `apps/meme-api/src/controller/filter/` — 새 endpoint 추가 (기존 `/gen` 옆에).
- App service: `apps/meme-api/src/application/filter/` — 새 use case `preview-start.app-service.ts` (또는 기존 filter-creation 서비스 옆).
- 의존: credit-app.service (잔액·차감), rekognition.service, fal-ai.service, slot constant.

## Context
preview 전용 endpoint 3개 중 첫 번째. 기존 `/gen` 엔드포인트는 절대 수정하지 않는다 (NEVER).

## Objective
parent filter id로 i2i preview 생성을 시작한다. AC 2.1.5의 검증 순서를 그대로 구현.

## Specification

### Path / Body
- `POST /filters/:filterId/preview`  (`filterId` = parent workflow filter)
- Body: `{ imageUrl: string }`

### Pre-conditions
- Filter는 `hasDecompPreview: true` + parent (parentFilterId == null) + 1장 입력 (`inputOption.requiredImageCount === 1`).

### Order (AC 2.1.5, BR-2)
1. 크레딧 잔액 확인 — 부족하면 402 `INSUFFICIENT_CREDIT` (차감 없음).
2. Rekognition 윤리 체크 — 거부 시 422 `HARMFUL_IMAGE` (차감 없음).
3. 슬롯 점유 — 풀 부족 시 429 `SLOT_EXHAUSTED` (차감 없음).
4. 크레딧 차감 — `previewCredit = 100` (configurable; constant).
5. Content 생성 — `isHidden: true`, `decompRole: 'i2i'`, `parentFilterId: filterId`, status=PENDING.
6. fal.ai i2i 호출 — 콜백 URL은 기존 `/filters/callback/fal-ai`.
7. 응답: `{ contentId, falJobId }`.

### Errors
| Code | HTTP | Trigger |
|---|---|---|
| `INVALID_FILTER` | 400 | hasDecompPreview false / 2-image filter / not parent |
| `INSUFFICIENT_CREDIT` | 402 | 잔액 < previewCredit |
| `HARMFUL_IMAGE` | 422 | Rekognition reject |
| `SLOT_EXHAUSTED` | 429 | MAX_CONCURRENT_GENERATIONS 도달 |

### Configuration
- `previewCredit = 100` — `apps/meme-api/src/common/constant/` 추가 (configurable per BR-1). 추후 Unleash 승격 (ASK).

## Acceptance Criteria
- [ ] 검증 순서가 PRD 명시 순서를 따른다 (단위 테스트로 증명).
- [ ] 잔액 부족·유해 이미지·슬롯 부족 모든 경우에서 크레딧 차감이 발생하지 않는다.
- [ ] 생성된 Content는 `isHidden: true, decompRole: 'i2i', parentFilterId == filterId`.
- [ ] 응답에 `contentId`, `falJobId` 포함.
- [ ] 기존 `POST /filters/:filterId/gen` 동작이 변하지 않는다 (회귀 테스트).

## Implementation Hints
- 기존 `/gen` 컨트롤러 구조를 참조하되 별도 controller method/use case로 분리한다.
- 슬롯 점유는 BE-009와 같은 슬롯 풀 헬퍼를 재사용 (정의 1 + callsite N — 패턴 completeness-009).
