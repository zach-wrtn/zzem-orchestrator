# Sprint Contract: Group 004 (free-tab-diversification)

## Scope
- Tasks: app-003 (확인/크레딧 바텀시트 + 생성 플로우 연결), app-004 (추천탭 등 외부 진입점 동일 무료 경험)
- 레포: app-core-packages
- 의존: app-002 (CTA hand-off bridge), be-004 (FREE_ALREADY_USED 응답)

## Done Criteria

### app-003
- [ ] `FreeUseConfirmSheet` 컴포넌트: 문구/버튼("무료 사용하기"/"더 둘러볼게요") 정확.
- [ ] `CreditUseConfirmSheet` 컴포넌트: 문구/버튼("크레딧 사용하기"/"취소") 정확.
- [ ] 무료 상태 CTA 탭 (`freeUsedToday==false`) → `FreeUseConfirmSheet` 노출 (AC 2.2.3).
- [ ] 유료 상태 CTA 탭 (`freeUsedToday==true`) → `CreditUseConfirmSheet` 노출 (AC 2.6.3).
- [ ] "무료 사용하기" → 약관/권한/동시생성 슬롯 확인 → 앨범 피커 → 크롭 → `POST /filters/:filterId/gen` → MemeCollection 이동 (AC 2.2.4).
- [ ] "더 둘러볼게요" → 시트 닫기, SwipeFeed 유지 (AC 2.2.5).
- [ ] "크레딧 사용하기" → 기존 유료 생성 플로우 (AC 2.6.4).
- [ ] 게스트 상태 → 로그인 바텀시트 → 로그인 완료 후 플로우 재개 (AC 2.2.6).
- [ ] CTA 빠르게 2회 탭 → 1건만 요청됨 (로컬 디바운스 + 버튼 비활성화, AC 2.2.7).
- [ ] 앨범/크롭 취소 → SwipeFeed 복귀, CTA 상태 유지 (AC 2.2.8).
- [ ] 동시생성 상한 상태 → "밈 생성 중에는 다른 밈을 만들 수 없어요!" 토스트 (AC 2.2.9).
- [ ] 서버 응답 `FREE_ALREADY_USED` (409) 수신 → `CreditUseConfirmSheet` 재노출 + "이미 무료 기회를 사용했어요" 안내 + `paidPrice` 표시 (자동 폴백).
- [ ] 서버 생성 오류 → 에러 안내 + 무료 기회 재조회 호출 (BR-2, AC 2.5.2 — 보라 배너 복귀).
- [ ] app-002 `navigation.setParams({pendingCtaAction})` bridge event 수신 → 올바른 시트 오픈.
- [ ] FilterPreview 진입 params에 `source: "free" | "paid"` 추가.
- [ ] testID: `free-use-confirm-sheet`, `credit-use-confirm-sheet`, 각 버튼 식별자.

### app-004
- [ ] 추천탭 SwipeFeed 모드는 `algo` 유지 (무료 필터 포함되어도 무료 전용 모드 전환 금지, BR-14).
- [ ] 추천탭에서 오늘 활성 무료 필터 CTA 탭 (`freeUsedToday==false`) → `FreeUseConfirmSheet` 노출 (AC 2.7.1).
- [ ] 동일 상황 "더 둘러볼게요" → 현재 추천 피드 유지 (AC 2.7.2, 무료 전용 모드 전환 금지).
- [ ] 추천탭 사용 완료 상태 무료 필터 CTA 탭 → `CreditUseConfirmSheet` 노출 (AC 2.7.3).
- [ ] CTA/시트 로직을 재사용 훅(`useFreeGenCTA`)으로 분리 → 무료탭/추천탭 양쪽에서 호출.
- [ ] 추천탭 피드 응답에 무료 필터 포함 노출 (API/컴포넌트 단 검증, server-injection은 BE 통합 테스트로 대체 가능).

## Verification Method
- **시트 노출 분기**: `useFreeGenCTA` unit test — `freeUsedToday` true/false → 시트 종류 분기 호출.
- **생성 플로우**: mock service chain (약관/권한/album/crop) → 성공 경로 assertion, 취소 경로 SwipeFeed 복귀.
- **디바운스**: CTA 2회 탭 시뮬레이션 → mutation 1회만 발화 (jest spy).
- **FREE_ALREADY_USED 폴백**: mutation onError → 409 + `FREE_ALREADY_USED` 에러 코드 → credit sheet 재오픈 + `paidPrice` 표시.
- **생성 오류 후 재조회**: mutation onError → `invalidateFreeTab` 호출 검증.
- **추천탭 algo 유지**: Recommend 카드 탭 → SwipeFeed `mode==="algo"`, CTA 탭 후 시트만 오픈, 피드 유지.
- **E2E**: `filter-preview.yaml` extend + `free-gen-confirm.yaml` new + `external-entry-free-parity.yaml` new.

## Edge Cases
- 동시생성 상한이 정확히 **도달한 시점**에 CTA 탭 → 토스트, 시트 미오픈.
- 게스트 상태에서 "크레딧 사용하기" → 로그인 유도 (기존 credit flow 동일).
- "더 둘러볼게요" 후 즉시 재탭 → 시트 재오픈 (상태 리셋).
- 크롭 후 생성 요청 중 앱 백그라운드 → 포그라운드 복귀 시 mutation 상태 복구 여부.
- 추천탭에서 무료 필터가 응답에 없을 때 — 기존 피드 그대로 (신규 UI 없음).
- `FREE_ALREADY_USED` 재수신 후 유저가 "크레딧 사용하기" → 정상 유료 생성으로 진행.

## Lessons from Group 003 (이월 반영)
- `navigation.navigate` params에 필드 추가 시 `useCallback` deps에도 반영.
- `zzem://swipe-feed/free` 직진입 경로는 `freeTabFilters`가 없으므로 CTA 로직이 이 케이스에서도 동작해야 함 (usage fallback).
- 추천탭에서도 `useTabScrollRestore` 활용 — app-001과 동일 훅.
- `FREE_ROSTER_MIN_VERSION` 게이트 — 추천탭에서도 동일 버전 분기 적용.

## Sign-off
- Sprint Lead 자체 서명(2026-04-14): Group 001~003 evaluator 이력 기반, Contract는 task spec과 approved prototype에서 직접 파생. 구현 중 이견은 Evaluator fix loop에서 교정.
