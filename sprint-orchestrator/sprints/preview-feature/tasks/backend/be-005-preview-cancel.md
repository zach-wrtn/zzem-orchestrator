# BE-005 — `POST /preview-contents/:contentId/cancel` (Abandon)

## Target
- Controller: BE-003/004와 동일 controller에 추가.
- App service: `apps/meme-api/src/application/filter/preview-cancel.app-service.ts`.

## Context
유저가 로딩 중(또는 결과 화면에서) X 탭 → 다이얼로그 [나가기] 선택 시 호출. 서버
fal.ai job은 계속 진행되지만 콜백 도착 시 슬롯만 해제하고 결과는 버린다.

## Objective
preview Content를 cancelled 상태로 표시하고, 진행 중이던 슬롯을 즉시 해제(또는 콜백
시 해제로 위임)한다. 환불 없음 (AC 2.1.9: "사용한 크레딧은 환불되지 않아요").

## Specification

### Path
- `POST /preview-contents/:contentId/cancel`

### Pre-conditions (404)
- 호출자 소유의 Content + `decompRole === 'i2i'`.

### Order
1. Content 조회 + 권한 검증.
2. `cancelledAt: Date` 세팅 (status는 그대로 두되 abandoned 플래그). 콜백 핸들러가 이
   플래그를 보고 후처리 스킵하도록 한다.
3. 슬롯 즉시 release (BE-009 헬퍼).
4. 응답: `{ ok: true, slotReleased: true|false }`.

### Note
- 환불 없음. 이미 차감된 previewCredit은 유지.
- 콜백 분기(BE-006)는 `cancelledAt`이 세팅된 Content는 후처리·결과 저장을 스킵하도록 작성.

## Acceptance Criteria
- [ ] 환불 transaction이 발생하지 않는다.
- [ ] 슬롯이 release된다 (`MAX_CONCURRENT_GENERATIONS`에 즉시 +1 가용).
- [ ] cancel 후 도착하는 fal.ai 콜백은 결과 저장을 스킵한다 (BE-006와 협업).
- [ ] 비-소유자 호출 시 404.
