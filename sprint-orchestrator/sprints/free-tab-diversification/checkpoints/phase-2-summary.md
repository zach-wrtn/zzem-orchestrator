# Phase 2 Checkpoint: free-tab-diversification

## Tasks
| ID | Type | Target | Group |
|----|------|--------|-------|
| be-001 | backend | FreeFilterSlot 스키마 + themeTag 인프라 | 001 |
| be-002 | backend | 날짜별 슬롯 스케줄러(활성/만료/예약, 3-3-4, 7일 배제, 폴백) | 001 |
| be-003 | backend | GET /free-tab, GET /filters v2 usage 블록, 구앱 호환 | 002 |
| be-004 | backend | 생성 시 슬롯 자동 매핑 + DB 유니크 1일1회 + KST 재검증 | 002 |
| app-001 | app | 무료탭 N그리드 + 보라/틸 배너 + 레드닷 + 스크롤 복원 | 003 |
| app-002 | app | SwipeFeed 무료 전용 모드 + circular scroll + CTA 상태 | 003 |
| app-003 | app | 확인/크레딧 바텀시트 + 생성 플로우 연결 | 004 |
| app-004 | app | 추천탭 등 외부 진입점 동일 무료 경험 | 004 |

## API Endpoints
| Method | Path | Related Tasks |
|--------|------|---------------|
| GET | /free-tab | be-003, app-001, app-002 |
| GET | /filters (v2) | be-003, app-001 |
| POST | /filters/{filterId}/gen | be-004, app-003 |
| POST | /__test__/free-roster/* | be-003 (test-only, e2e seed) |
| POST | /__test__/free-quota/* | be-004 (test-only, e2e seed) |

## Key Decisions
- `/free-tab` 전용 엔드포인트 신설(v2 `/filters`의 usage 블록과 중복이지만 무료탭 UX의 응답 크기/폴백 시맨틱을 명확히 분리).
- 슬롯은 BR-12대로 앱에 노출하지 않음. 서버가 (userId, filterId, KST) 자동 매핑.
- DB 유니크는 `UserFreeQuota` 별도 컬렉션(partial unique on ACTIVE)로 구현 권장 — Content 인덱스 변경 범위 축소.
- 구앱 호환(BR-11)은 `X-App-Version` 헤더 분기로 legacy shape 유지.
- Circular scroll은 데이터 복제 대신 onMomentumScrollEnd 경계 감지 + jumpToIndex.
- Circular scroll/배너/레드닷 스타일은 Phase 3 프로토타입에서 확정.

## Group Plan
- Group 001: be-001, be-002 — 데이터/스케줄러 기반
- Group 002: be-003, be-004 — API + 생성 통합 (Group 001 완료 후)
- Group 003: app-001, app-002 — 무료탭 화면 + SwipeFeed (Group 002 계약 기반)
- Group 004: app-003, app-004 — 바텀시트/플로우 + 외부 진입점

## Cross-Sprint Memory
- 현재 KB에 도메인-태그된 reflection 없음(reflections 디렉토리는 README만). 참고 패턴: `completeness-*`, `correctness-*`는 일반 원칙으로 Evaluator criteria에 이미 반영.
