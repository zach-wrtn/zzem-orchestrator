# Evaluation Criteria — ai-webtoon

## 공통 원칙

- Active evaluation: 코드 로직/엣지 케이스를 정적 추적. 린트·타입·단위
  테스트 통과는 전제.
- Critical / Major / Minor 분류. Critical 1건으로도 FAIL.
- Pressure level: Caution → Minor 생략. Urgent → Critical만 보고.
- 모든 Critical은 재현 시나리오(입력 → 기대 → 실제)를 명시.

## KB-calibrated checks (free-tab-diversification reflection 반영)

이 스프린트에서 **반드시** 확인할 항목 (reflection lessons 매핑):

- **C5 — Cross-path cleanup/deduction 일원화 (integration-002, BR-2 rollback
  lesson)**: 크레딧 차감/환불/상태 전이가 webtoon + 기존 meme 양쪽 callback
  엔트리에 대해 동일한 도메인 helper로 수행되는지 확인. 웹툰 전용으로 신규
  차감 경로를 만들었다면 Critical. `CreditDomainService.deduct` 또는 기존
  공통 helper 1개만 호출해야 함.
- **C6 — Fallback/optional field 응답 스펙 명시 (correctness-003 lesson)**:
  `focusEpisodeNumber`가 `null`로 내려올 때 앱이 안전하게 처리하는지,
  `imageUrl`이 null일 때(PENDING/FAILED/PROHIBITED) 렌더 가드 존재하는지.
  응답 필드 nullable 경계 처리 누락 시 Major.
- **C7 — Route/Navigation params passthrough (completeness-003 lesson)**:
  `focus`, `continuationType`, `seriesId`, `generationId` 같은 navigation
  파라미터가 **모든 진입점**(딥링크, CTA 탭, MY웹툰 리스트 카드/이어가기
  버튼, 재시도 CTA)에서 전달되는지. 1곳이라도 누락 시 Major.
- **C8 — Deep link fallback**: `zzem://webtoon/series/{id}/continue` 등
  심부 딥링크 직진입 시 back stack 없이도 홈으로 착지하는지. 크래시 / 무한
  이전 스택이면 Critical.
- **C9 — E2E env prerequisites**: test-seed/auth 토큰 의존 flow의 상단
  주석에 prerequisites 명시, `optional: true` 방어. 누락 시 Minor.
- **Re-usable hook precedence (free-tab lesson)**: `useSeenMark`,
  `useWebtoonGenerationPolling`을 app-001/app-002에서 **공통 hook으로
  추출**했는지 확인. app-003에서 재구현한 흔적이 있으면 Major (fix-loop
  유발 가능).

## Group 001 (be-001, app-001) — 템플릿/시리즈/MY웹툰 리스트

### be-001
- [ ] 템플릿 레지스트리는 정확히 2개 엔트리(PERSON 1, ANIMAL 1) — BR-8.
- [ ] `WebtoonEpisode` unique index `(seriesId, episodeNumber)` +
  `generationId` unique.
- [ ] `appendEpisode` 동시성 테스트: 5 parallel → episodeNumber 중복/누락 0.
- [ ] `markSeriesSeen` idempotent.
- [ ] `listSeriesByUser` 사용자 격리 + 정렬.
- [ ] `focus=LAST_CONTINUE` 응답의 `focusEpisodeNumber` 정확성 (최대
  COMPLETED 회차, 없으면 null).

### app-001
- [ ] 탭 3개 노출 + 기본 활성 `[추천]` (AC 2.1.1).
- [ ] 웹툰 탭 카드 수 == 서버 응답 템플릿 수.
- [ ] 빈 응답 시 `WebtoonEmptyView` (AC 2.1.3).
- [ ] 시리즈 카드 영역 / "이어가기" 버튼 히트박스 구분 (AC 2.6.3 vs 2.6.4).
- [ ] N뱃지 렌더 조건이 서버 `hasUnseenEpisode`와 1:1.
- [ ] `POST /seen` 호출 경로가 카드 탭/이어가기 버튼/딥링크 모두에서 동일.
- [ ] 구앱(feature flag off) 웹툰 탭 미노출.

## Group 002 (be-002, app-002) — 1화 생성 파이프라인

### be-002
- [ ] `FAL_AI_MODEL_INPUT_MAP`에 `nano-banana-2/edit` 엔트리 + 2K default.
- [ ] 제출 시 크레딧 차감 0 (BR-2).
- [ ] callback SUCCESS → 차감 500 + 이벤트 emit.
- [ ] callback PROHIBITED/MODEL_ERROR/TIMEOUT → 차감 0 + 상태 전이 (BR-2).
- [ ] callback 재시도(2회) idempotent — 차감 1회만.
- [ ] HMAC 서명 검증 (실패 시 400).
- [ ] 동시생성 풀이 meme과 공유 (BR-3, 5 이상 → 409).
- [ ] Timeout watchdog 동작 (AC 2.3.8).
- [ ] Cross-user poll → 404 (존재 누설 방지).
- [ ] **Critical check (C5)**: 차감 로직이 기존 공통 helper 재사용, 웹툰
  전용 중복 구현 없음.

### app-002
- [ ] 사진 미선택 시 CTA disabled (AC 2.3.2). 사진 채워지면 활성.
- [ ] CTA 탭 즉시 disabled + 재탭 무시 (BR-4).
- [ ] 402/422/409/500 분기별 UI 분리 (시트/시트/토스트/토스트).
- [ ] 폴링 5초 주기 (BR-11). 백그라운드 복귀 즉시 재폴링.
- [ ] 폴링 `COMPLETED` → 결과 화면 replace (back stack에 스켈레톤 없음).
- [ ] 폴링 `PROHIBITED`(비동기) → 바텀시트 + 입력 화면 복귀.
- [ ] 클라 timeout 240s 방어 가드.
- [ ] 크레딧 스토어 구독으로 COMPLETED 시점 잔액 자동 갱신.
- [ ] 읽기 전용 synopsis (BR-6), 캐릭터 칩 탭 불가 (BR-5).

## Group 003 (be-003, app-003) — 이어가기 + 시리즈 상세

### be-003
- [ ] `AUTO`/`MANUAL` 분기 올바름. AUTO with story beat → 400. MANUAL without → 400.
- [ ] 0-COMPLETED 시리즈 이어가기 → 400 `NO_REFERENCE_EPISODE`.
- [ ] 서버가 `image_urls = [prev.outputImageUrl]`만 주입, 사진 업로드 재요구
  없음 (AC 2.6.6, BR-12).
- [ ] MANUAL prompt에 `userStoryBeat` 포함 (snapshot 검증).
- [ ] 크레딧/동시성 helper가 be-002와 동일 call-site (C5).
- [ ] callback 성공 시 `hasUnseenEpisode=true`, lastEpisodeCreatedAt 갱신.
- [ ] test-seed 엔드포인트 prod에서 404.
- [ ] `focus=LAST_CONTINUE` 응답 일관성.

### app-003
- [ ] `focus=FIRST` → 최상단, `LAST_CONTINUE` → 이어가기 CTA 자동 스크롤
  (AC 2.6.3/2.6.4).
- [ ] 마지막 회차 COMPLETED일 때만 CTA 렌더 (AC 2.4.2).
- [ ] 자동 이어가기 탭 → 즉시 disabled, 202 후 인라인 스켈레톤 + 폴링.
- [ ] 직접 이어가기 입력 화면 보라 배너 + 500자 상한 + disabled→활성.
- [ ] 이어가기 화면에서 사진 업로드 UI 렌더 0회 (AC 2.6.6).
- [ ] 새 회차 완료 직후 MY웹툰에서 N뱃지 재노출 (BR-7).
- [ ] 폴링 훅이 app-002와 동일 (재사용 여부, KB lesson).
- [ ] 모든 navigation param(`focus`, `continuationType`)이 진입점별 전달
  (C7).
- [ ] `InlineEpisodeError` 재시도 CTA가 원래 continuationType으로 재요청.

## Active evaluation 엣지케이스 (전 그룹)

- KST 자정 경계 생성 시 `createdAt` 날짜 건너뜀 없음.
- fal-ai 중복 callback (동일 generationId 2회) 내성.
- 네트워크 단절 중 제출 → 폴링 재개 시 최신 상태 정상 반영.
- 앱 백그라운드 10분 → 포그라운드 복귀 → 폴링 재개 및 상태 재동기.
- 동시 5개 생성 진행 중 이어가기 제출 → 409 정상 반환 + 기존 UI 유지.
- 크레딧 정확히 500 보유 → 생성 허용 (경계 테스트).
- 유해 이미지 감지가 제출 단계(sync, 422) vs 콜백 단계(async, status=
  PROHIBITED) 모두에서 UI 동일하게 시트 노출.

## Calibration

- 모호 문구("빠른", "적절한") 발견 시 Critical.
- 네트워크 스파이 테스트는 정적 추적으로 대체 가능.
- PRD §5 ASK 항목(timeout 기준, BR-12 유의미성, 해상도/프롬프트 튜닝)은
  이 스프린트에서 결정 대상 아님 → 관련 값은 env-configurable로만 두고
  하드코딩 발견 시 Minor.
