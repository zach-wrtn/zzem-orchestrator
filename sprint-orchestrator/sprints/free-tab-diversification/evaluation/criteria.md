# Evaluation Criteria — free-tab-diversification

## 공통 원칙
- Active evaluation: 코드 로직/엣지 케이스 추적. 린트·타입체크 통과는 전제.
- Critical/Major/Minor로 분류. Critical 1건만 있어도 FAIL.
- Pressure level Caution → Minor 생략. Urgent → Critical만 보고.

## Group 001 (be-001, be-002) — 슬롯 스키마 + 스케줄러
- DB 인덱스/멱등성(중복 크론 실행) 확인.
- 상태 역전/조합영상 필터 배제/테마 비율/7일 제외 로직.
- 폴백 체인 3단계 모두 테스트.

## Group 002 (be-003, be-004) — API + 생성 매핑
- v2 응답이 구앱 DTO와 호환되는지(신규 필드 optional + legacy shape 분기).
- `freeUsedToday` 판정이 in-progress+completed만 포함, failed 제외(BR-2).
- DB 유니크 제약이 동시 요청/다기기 상황에서 동작하는지.
- `FREE_ALREADY_USED` 경로에서 `paidPrice` 정확성.
- KST 경계(23:59→00:01) 재검증 동작.

## Group 003 (app-001, app-002) — 무료탭 + SwipeFeed
- 그리드 ↔ SwipeFeed 순서 동일(BR-6). 추가 API 호출 0회.
- 보라/틸/레드닷 상태 매핑. 포그라운드 복귀 시 갱신.
- Circular scroll 경계 처리(스냅 품질, 중복 렌더 없음).
- 빈 응답/폴백 응답 UI 분기.
- 스크롤 복원이 무료·추천탭 모두에서 동일하게 동작.

## Group 004 (app-003, app-004) — 바텀시트 + 외부 진입
- 무료/유료/게스트/동시생성/크롭취소/서버에러 분기 각각 코드 경로 추적.
- 중복 요청 방지(디바운스 + 버튼 비활성).
- 추천탭 "더 둘러볼게요" 피드 유지(알고리즘 피드 교체 없음).

## Calibration
- 모호 문구("적절한") 발견 시 Critical.
- 네트워크 스파이 테스트는 Evaluator가 코드 정적 추적으로 대체 가능.
- 모든 Critical은 재현 시나리오(입력/기대/실제) 명시.
