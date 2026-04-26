# BE-004 — `POST /preview-contents/:contentId/proceed` (Preview → i2v)

## Target
- Controller: `apps/meme-api/src/controller/filter/` (또는 `preview-content/` 신규 controller).
- App service: `apps/meme-api/src/application/filter/preview-proceed.app-service.ts` (제안).

## Context
유저가 프리뷰 결과를 보고 [이 이미지로 만들기]를 탭했을 때 i2v 비디오 생성을 시작한다.

## Objective
i2i preview Content를 source로 i2v Content를 생성하고, 차액(`총액 - previewCredit`)을
차감해 fal.ai i2v를 호출한다. fire-and-forget — 응답 후 클라이언트는 MemeCollection으로
이동하고 기존 active-generations 폴링이 진행 상태를 표시한다.

## Specification

### Path
- `POST /preview-contents/:contentId/proceed`

### Pre-conditions (404/409)
- contentId의 Content가 존재 + 호출자 소유 + `decompRole === 'i2i'` + status === DONE.
- 동일 preview Content로 두 번 proceed 금지 (`PREVIEW_ALREADY_PROCEEDED` 409).

### Order
1. preview Content 조회 + 권한·상태 검증 (404/409).
2. parent filter 조회 → `i2vCredit = parent.requiredCredit - previewCredit`.
3. 잔액 확인 — 부족 시 402 (차감·생성 없음).
4. 슬롯 점유 — 부족 시 429.
5. `i2vCredit` 차감.
6. 새 i2v Content 생성 — `isHidden: false`, `decompRole: 'i2v'`,
   `parentFilterId = preview.parentFilterId`, `sourcePreviewContentId = preview._id`,
   status = PENDING.
7. fal.ai i2v 호출 (input = preview의 fal.ai CDN URL).
8. 응답: `{ contentId, falJobId }` (i2v Content id).

### State on preview Content
- proceed 성공 시 preview Content에 `proceededAt: Date` 또는 `i2vChildContentId` 세팅 (재호출 차단용).

## Acceptance Criteria
- [ ] preview Content 검증 실패 시 404/409, 차감·생성 없음.
- [ ] 잔액 부족 시 402, 차감·생성 없음.
- [ ] 성공 시 i2v Content는 `isHidden: false, decompRole: 'i2v', parentFilterId 정확히 전파`, `sourcePreviewContentId` 세팅.
- [ ] 동일 preview에 두 번 proceed 시 두 번째는 409.
- [ ] 응답 직후 MemeCollection 폴링 (`GET /filters/generations/active`)에 i2v Content가 노출된다 (`isHidden: false`).

## Implementation Hints
- 슬롯 풀은 BE-009와 동일 헬퍼 (i2i 완료 후 한번 release 되었다가 다시 acquire — BR-4).
- fal.ai input image URL은 preview Content에 저장된 fal.ai CDN URL을 그대로 사용 (BR-7).
