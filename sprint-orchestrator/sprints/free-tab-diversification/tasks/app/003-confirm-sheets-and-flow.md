# app-003 · 확인 바텀시트(무료/유료) + 생성 플로우 연결

- **Group**: 004
- **Owner**: fe-engineer + design-engineer
- **Depends on**: app-002, be-004

## Target

`app-core-packages/apps/MemeApp/src/shared/ui/gorhom-sheet/*`, `presentation/swipe-feed/*`, `presentation/meme/filter-preview.screen.tsx` 연결부.

## Context

CTA 탭 후 노출되는 확인/안내 바텀시트와 이후 생성 플로우를 연결한다. US-2, US-6.

## Objective

상태에 따라 두 종의 바텀시트를 노출하고, 수락 시 기존 생성 플로우(약관→권한→앨범→크롭→생성)에 접속한다.

## Specification

### Components
- `FreeUseConfirmSheet` — 문구: "오늘의 무료 기회를 사용할까요? / 하루에 1번만 무료로 만들 수 있어요". 버튼: "무료 사용하기" / "더 둘러볼게요".
- `CreditUseConfirmSheet` — 문구: "크레딧을 사용할까요? / 오늘의 무료 기회를 이미 사용했어요". 버튼: "크레딧 사용하기" / "취소".

### Behavior
- "무료 사용하기" → 서비스 약관 확인 → 사진 권한 → 동시생성 슬롯 확인 → (가이던스 있으면) 가이드 시트 → 앨범 피커 → 크롭 → `POST /filters/:filterId/gen` → MemeCollection 이동(AC 2.2.4).
- "더 둘러볼게요" → 시트 닫기, SwipeFeed 유지(AC 2.2.5).
- "크레딧 사용하기" → 기존 유료 생성 플로우(AC 2.6.4).
- 게스트 → 로그인 바텀시트 → 로그인 완료 후 플로우 재개(AC 2.2.6).
- 생성 요청 진행 중 CTA 연타 방지(로컬 디바운스 + 버튼 비활성화, AC 2.2.7).
- 사진 선택/크롭 취소 → SwipeFeed 복귀(AC 2.2.8).
- 동시생성 슬롯 초과 → 토스트 "밈 생성 중에는 다른 밈을 만들 수 없어요!"(AC 2.2.9).
- 서버 응답 `FREE_ALREADY_USED` → 크레딧 안내 바텀시트로 재노출(유료 가격 표시) + "이미 무료 기회를 사용했어요" 안내.
- 서버 생성 오류 → 에러 안내 표시(AC 2.2.11). 무료 기회 상태 재조회.

## Acceptance Criteria

- [ ] 무료 상태 CTA 탭 → `FreeUseConfirmSheet` 노출(AC 2.2.3).
- [ ] "무료 사용하기" → 약관/권한/슬롯 확인 후 앨범 피커 진입. 성공 시 MemeCollection 도달.
- [ ] 유료 상태 CTA 탭 → `CreditUseConfirmSheet` 노출(AC 2.6.3).
- [ ] 게스트 상태에서 "무료 사용하기" → 로그인 유도 → 로그인 후 생성 플로우 재개.
- [ ] CTA 빠르게 2회 탭 → 1건만 요청됨(네트워크 로그 검증).
- [ ] 앨범/크롭 취소 → SwipeFeed 복귀, CTA 상태 유지.
- [ ] 동시생성 상한 상태에서 시도 → 지정 문구 토스트.
- [ ] `FREE_ALREADY_USED` 응답 수신 → `CreditUseConfirmSheet` 재노출 + 설명 문구 교체.
- [ ] 생성 오류 응답 → 에러 안내 + 무료 기회 재조회 호출 검증(BR-2 · 보라 배너 복귀, AC 2.5.2).

### E2E 인증
- Extend: `filter-preview.yaml` — 무료 경로에서 시작해 바텀시트 CTA tap(assertVisible까지만, CTA 이후는 Evaluator 검증).
- New: `flows/free-gen-confirm.yaml` — 확인 바텀시트 + 취소/확인 버튼 노출.

## Implementation Hints

- `bottom-confirm-sheet.tsx` 패턴 재사용.
- 기존 FilterPreview 진입 navigation params에 `source: "free" | "paid"` 추가.

## Prototype Reference
- **프로토타입**: `prototypes/app/app-003/prototype.html`
- **스크린샷**: `prototypes/app/app-003/screenshots/`
- **상태**: approved
