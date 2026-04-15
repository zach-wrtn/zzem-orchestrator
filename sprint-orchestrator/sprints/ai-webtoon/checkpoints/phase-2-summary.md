# Phase 2 Checkpoint: ai-webtoon

## Tasks
| ID | Type | Target | Group |
|----|------|--------|-------|
| be-001 | backend | Webtoon templates (hardcoded 2 entries) + Series/Episode schema + series read 기본 + /seen | 001 |
| be-002 | backend | Episode-1 생성 파이프라인, fal-ai submit + internal callback, 크레딧/동시성 precheck, timeout watchdog, 폴링 | 002 |
| be-003 | backend | Continuation (AUTO/MANUAL), LAST_CONTINUE focus, test-seed endpoints | 003 |
| app-001 | app | 웹툰 탭 + 템플릿 상세 + MY 웹툰 리스트/빈 상태/N뱃지/플로팅 진입 | 001 |
| app-002 | app | 입력 → 스켈레톤 → 결과/에러 화면 + 크레딧/유해/동시성/timeout 분기 | 002 |
| app-003 | app | 시리즈 상세 + 화수 탭 + 자동/직접 이어가기 + 스크롤 포커스 | 003 |

## API Endpoints
| Method | Path | Related Tasks |
|--------|------|---------------|
| GET | /webtoon/templates | be-001, app-001 |
| GET | /webtoon/templates/{id} | be-001, app-001, app-002 |
| POST | /webtoon/generations | be-002, app-002 |
| GET | /webtoon/generations/{id} | be-002, app-002, app-003 |
| POST | /webtoon/series/{id}/episodes | be-003, app-003 |
| GET | /webtoon/series | be-001, app-001 |
| GET | /webtoon/series/{id} | be-001/be-003, app-001, app-003 |
| POST | /webtoon/series/{id}/seen | be-001, app-001, app-003 |
| POST | /internal/webtoon/generations/callback | be-002 (+be-003 continuation 공유) |
| POST | /__test__/webtoon/series/seed | be-003 (test-only, e2e seed) |
| POST | /__test__/webtoon/series/clear | be-003 (test-only, e2e seed) |

총 API 엔드포인트: **11개** (user 7 + internal 1 + test-only 2 + shared
GET series에 focus param 1 variant 합산).

## Key Decisions

- **별도 컬렉션 vs content discriminator**: `WebtoonSeries`/`WebtoonEpisode`
  를 **신규 컬렉션**으로 분리 제안(be-001에서 재확인 여지 열어둠).
  episode 단위 상태 전이 + 회차별 metadata + series-level 뱃지 상태의 구조가
  기존 content 스키마와 이질적이라 판단.
- **이어가기는 별도 엔드포인트(`/series/{id}/episodes`)**: `/generations`를
  공유하지 않고 분리. 이유: (a) episode-1만 photo 필수라는 입력 스펙 차이,
  (b) 404/NO_REFERENCE_EPISODE 같은 continuation-specific 에러를 깔끔하게
  매핑.
- **크레딧 차감 공통 helper 강제**: be-002/be-003 모두 기존
  `CreditDomainService.deduct` 재사용 — cross-path cleanup lesson(C5) 반영.
- **템플릿 "하드코딩"은 BE-hosted**: BR-8 "앱 코드에 직접 포함"을 literal로
  해석하지 않고, "Jayla 제작 후 하드코딩된 상수를 서버에서 제공"으로 해석.
  앱 배포 없이 Jayla 업데이트 가능 + 구앱 호환 + 두 앱 플랫폼 중복 방지.
- **Polling 선택**: PRD BR-11이 5초 interval을 "기존 구현과 일치"로 고정 →
  SSE/웹소켓 신설 없이 기존 폴링 패턴 유지.
- **timeout 기준은 env-configurable + 기본 180s** (PRD §5 ASK: Jayla
  측정 대기). 클라이언트는 240s 방어 가드.
- **Test-seed endpoints만 제공, callback 시뮬레이터 없음**: fal-ai 콜백
  e2e 시뮬레이션은 범위 외. BE 통합/수동 QA가 담당.
- **Deep link 전략**: 웹툰 전용 5개 경로 신설. 모든 딥링크 직진입은 홈
  fallback 필수 (C8).

## Group Plan

- **Group 001**: be-001 + app-001 — 템플릿/시리즈 데이터 기반 + 탐색/진입
  UI. 이후 그룹의 계약 안정화에 필수.
- **Group 002**: be-002 + app-002 — 1화 생성 파이프라인 + 입력/로딩/결과
  UI. 이 그룹이 통과해야 webtoon이 동작하는 최소 기능으로 쓸 수 있음.
- **Group 003**: be-003 + app-003 — 이어가기 + 시리즈 상세 + 화수 탭. MVP
  완성.

## Cross-Sprint Memory

KB reflections 도메인 인덱스 확인:
- `reflections/free-tab-diversification.md`의 Lessons 6건 모두 이번 스프린트
  Contract에 반영(C5~C9 + 재사용 훅 선행 설계). KB 패턴 인덱스의 `correctness-*`,
  `integration-*`, `completeness-*`는 일반 원칙으로 Evaluator criteria에 흡수.
- 이번 스프린트 도메인(AI 생성) 전용 reflection은 아직 KB에 없음 — Phase 6
  retrospective에서 신규 lesson 후보(Webhook idempotency, 2-stage credit
  deduction timing 등) 수집 예상.

## KB Lesson 반영 상황

| Lesson | 채택 여부 | 반영 위치 |
|--------|-----------|----------|
| C5 Cross-path cleanup 일원화 | 채택 | be-002/be-003 Hints + evaluation/criteria.md (Critical) + group-002/003 Done |
| C6 폴백/nullable 응답 스펙 | 채택 | api-contract.yaml `focusEpisodeNumber` nullable + imageUrl nullable 명시 + evaluation C6 |
| C7 Route params passthrough | 채택 | app-003 hints + evaluation C7 (`focus`, `continuationType`) |
| C8 Deep link fallback | 채택 | app-001/app-003 Deep link 섹션 + evaluation C8 |
| C9 E2E env prerequisites | 채택 | e2e-seed-plan.md 비고, flow 상단 prerequisites 주석 지시 |
| 재사용 훅 선행 설계 | 채택 | `useSeenMark`(app-001), `useWebtoonGenerationPolling`(app-002), app-003 재사용 |

기각된 lesson: 없음(전부 이번 도메인과 겹침).

## Gate 체크

- ✓ OpenAPI 3.0 구조 (paths/components/schemas/tags)
- ✓ 모든 task 파일에 Target/Context/Objective/Specification/Acceptance
  Criteria/Implementation Hints 섹션 존재
- ✓ 순환 의존성 없음 (be-001 → be-002 → be-003, app-001 → app-002 → app-003,
  app-N은 해당 group BE에만 의존)
- ✓ 각 AC가 testable (모호 표현 회피; "정상 소요 시간"은 서버 ENV로 표현,
  클라 240s 방어 명시)
- ✓ Backend/App 태스크가 동일 endpoint 참조 (매트릭스 위에 정리)
- ✓ 모든 AC가 e2e-flow-plan에 분류됨 (Covered / Extend / New / Deferred)
- ✓ KB-calibrated checks(C5~C9)가 evaluation/criteria.md에 명시
- ✓ Deep link 경로 모두 선언 + fallback 요구 명시
- ✓ Test-only endpoints가 prod 비활성 가드 요건 명시

## 주목할 판단 3개 (PRD 해석 시)

1. **"웹툰 템플릿 하드코딩"(BR-8) 해석**: 앱 코드에 상수로 박는 대신
   BE에서 상수 레지스트리 + API 제공으로 해석. 앱 배포 없이 Jayla가
   템플릿 교체 가능, iOS/Android 이중관리 회피. PRD 원문 "앱 코드에 직접
   포함"과 부분 충돌 가능성 있음 — Phase 4 엔지니어 팀과 확인 권장.

2. **이어가기 endpoint를 `/generations` 공유 vs 분리**: 분리 선택. AC
   2.6.6(사진 미필수) + BR-12(자동 주입) + NO_REFERENCE_EPISODE 같은
   continuation 전용 에러를 고려하면 공유 엔드포인트의 request body가
   discriminated union이 되어 contract 복잡도가 오히려 증가. 분리 시 1화
   전용 검증·차감 helper 공유는 도메인 서비스 레이어에서 보장.

3. **AC 2.3.6 유해 이미지 감지의 동기 vs 비동기 분기**: PRD는 단일 분기로
   기술하지만 실제 파이프라인상 사전 검사(예: Rekognition precheck → 422)와
   fal-ai 응답 기반 검출(콜백 PROHIBITED) 두 경로가 공존할 가능성 있음.
   양쪽 모두 UI를 동일(`ProhibitedImageSheet`)으로 수렴하도록 app-002에
   명시. BE 구현 시 양 경로 존재 여부 결정(be-002 Hints로 오픈).
