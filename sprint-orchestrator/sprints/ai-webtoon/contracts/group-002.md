# Sprint Contract: Group 002 (ai-webtoon)

## Scope

- **Tasks**: be-002 (episode-1 생성 파이프라인, fal-ai submit + callback,
  크레딧 차감, timeout watchdog, 폴링), app-002 (입력 화면, 스켈레톤 로딩,
  결과/에러 화면, 크레딧/유해/동시성 분기).
- **Endpoints**:
  - `POST /webtoon/generations`
  - `GET /webtoon/generations/{id}`
  - `POST /internal/webtoon/generations/callback`
  - `FAL_AI_MODEL_INPUT_MAP[nano-banana-2/edit]`

## Done Criteria

### be-002
- [ ] `FAL_AI_MODEL_INPUT_MAP` 항목 존재, `supportedParams` 및 `requiredParams`
  스펙 일치, `resolution=2K` default.
- [ ] `POST /webtoon/generations` 정상 요청 → 202 + `status=PENDING`, 크레딧
  잔액 불변.
- [ ] 402 `INSUFFICIENT_CREDIT` 반환 조건 정확(잔액 < 500).
- [ ] 409 `CONCURRENCY_CAP_REACHED` — webtoon + meme 풀 공유 5 cap.
- [ ] 422 `PROHIBITED_IMAGE` 동기 브랜치 (rekognition 등 precheck 존재 시).
- [ ] 콜백 SUCCESS → 크레딧 -500 정확, 상태 COMPLETED, imageUrl 저장, 이벤트
  1회 발행.
- [ ] 콜백 PROHIBITED/MODEL_ERROR/TIMEOUT → 크레딧 차감 0, 상태 매핑 정확.
- [ ] 콜백 replay(동일 payload 2회) → 차감 1회, 상태 변동 없음.
- [ ] HMAC 서명 위조 → 400, 상태 변동 없음.
- [ ] Timeout watchdog cron 등록, `status ∈ {PENDING, IN_PROGRESS}` AND
  `createdAt < now - TIMEOUT_SECONDS` → TIMEOUT 전이, 차감 0.
- [ ] Cross-user `GET /generations/{id}` → 404.
- [ ] **C5**: 크레딧 deduct 호출 site가 기존 meme 경로 helper와 동일.
  webtoon 전용 중복 구현 없음.

### app-002
- [ ] 입력 화면에서 `PhotoSlot` 미입력 시 CTA disabled, 입력 후 활성.
- [ ] CTA 탭 즉시 disabled + 동일 화면 재탭 무시.
- [ ] 읽기 전용 synopsis + 탭 불가 characterType chip 렌더.
- [ ] 응답 분기:
  - 202 → 스켈레톤 화면 + `generationId` 전달.
  - 402 → 크레딧 부족 시트.
  - 409 → 동시성 토스트.
  - 422 → 유해 이미지 시트.
  - 500 → 서버 에러 토스트.
- [ ] 폴링 주기 5초(BR-11). 앱 백그라운드 → 포그라운드 복귀 시 즉시 재폴링.
- [ ] 폴링 상태별 UI: PENDING/IN_PROGRESS 스켈레톤, COMPLETED 결과 화면으로
  replace, FAILED/TIMEOUT 실패 화면, PROHIBITED 시트 + 입력 복귀.
- [ ] 클라 timeout(240s) 방어 가드 동작.
- [ ] 크레딧 잔액은 COMPLETED 수신 시점 갱신.
- [ ] `useWebtoonGenerationPolling` 훅 공통화 (app-003 재사용 전제).

## Verification Method

- **크레딧 차감 경로**: 정적 추적으로 `CreditDomainService.deduct`
  호출부 확인. webtoon 경로가 helper 재사용 증명.
- **콜백 idempotency**: 통합 테스트 2회 호출 + 크레딧/상태 assert.
- **동시성 cap**: 5개 in-flight 주입 후 6번째 → 409.
- **Timeout watchdog**: 시간 fixture로 `createdAt` 과거 주입 → cron 실행 →
  status 전이 확인.
- **App rendering**: `webtoon-generate-entry.yaml` Maestro, 나머지 제출 분기
  는 BE 통합 + 수동 QA.
- **폴링 간격**: 단위 테스트 / 수동 QA 로그로 5초 확인(±0.5s 허용).

## Edge Cases

- fal-ai submit 순간 실패 → 502 처리? 본 스프린트는 synchronous submit 실패
  시 episode를 바로 FAILED로 세팅하고 202 응답 전 500 반환(AC 2.3.7 매핑).
  구현 시 이 분기가 "차감 없음"임을 assert.
- Callback이 submit ack보다 먼저 도착(레이스) → 멱등 처리로 커버(동일
  generationId 단일 episode unique index).
- 앱 재실행 후 딥링크로 직접 결과 화면 재진입(generationId 로스트) → MY
  웹툰 재진입 경로로 대체 — 명시 가이드 문서화.
- 크레딧 정확히 500 보유 → 허용(경계).
- 빈 이미지 URL, 이상한 MIME 전달 → 400 + 기존 업로드 검증.

## Sign-off

- be-002 merge 후 app-002는 test-seed 없이 mock 서버 또는 sandbox fal-ai로
  부분 검증. full path(E2E w/ fal)는 staging QA.
- Evaluator C5 위반 Critical 판정.
