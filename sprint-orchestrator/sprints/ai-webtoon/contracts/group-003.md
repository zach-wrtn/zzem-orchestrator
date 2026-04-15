# Sprint Contract: Group 003 (ai-webtoon)

## Scope

- **Tasks**: be-003 (continuation 엔드포인트, 시리즈 상세 LAST_CONTINUE,
  test-seed endpoints), app-003 (시리즈 상세 + 화수 탭 + 자동/직접 이어가기
  + 스크롤 포커스).
- **Endpoints**:
  - `POST /webtoon/series/{id}/episodes` (AUTO / MANUAL)
  - `POST /__test__/webtoon/series/seed` / `clear` (test-only)
  - `GET /webtoon/series/{id}?focus=LAST_CONTINUE` 최종 동작(be-001에서 기본
    스켈레톤 후 여기서 로직 확정)

## Done Criteria

### be-003
- [ ] `POST /series/{id}/episodes` AUTO 요청: 서버가 `image_urls = [prev
  COMPLETED.outputImageUrl]` 주입, 사진 업로드 재요구 없음(AC 2.6.6, BR-12).
- [ ] MANUAL 요청: `userStoryBeat` 필수, 1..500자, prompt 포함 검증.
- [ ] AUTO with `userStoryBeat` → 400 (extraneous field).
- [ ] MANUAL without `userStoryBeat` → 400.
- [ ] COMPLETED episode 0개인 시리즈 이어가기 → 400 `NO_REFERENCE_EPISODE`.
- [ ] Cross-user seriesId → 404.
- [ ] 크레딧/동시성 precheck는 be-002와 동일 helper 재사용 (C5).
- [ ] 콜백 SUCCESS → 크레딧 -500, 새 회차 COMPLETED, series
  `hasUnseenEpisode=true`, `lastEpisodeCreatedAt` 갱신.
- [ ] 콜백 실패 경로 차감 0(BR-2).
- [ ] `focus=LAST_CONTINUE` 응답: `focusEpisodeNumber` = max COMPLETED. null
  안전.
- [ ] test-seed endpoints: `NODE_ENV=production` → 404. 개발 env →
  seeded series 반환, clear 동작.

### app-003
- [ ] 시리즈 상세 진입 시 `focus` 값에 따라 FIRST/LAST_CONTINUE 스크롤
  정확.
- [ ] 마지막 회차 COMPLETED일 때만 `ContinuationCtaBar` 렌더.
- [ ] 자동 이어가기 탭 → 즉시 disabled(BR-4) → 202 후 인라인 스켈레톤 +
  `EpisodeTabs` 새 회차 추가.
- [ ] 직접 이어가기 입력 화면: 보라 배너, 500자 상한 TextInput, 빈 입력 시
  CTA disabled, 입력 시 활성.
- [ ] 직접 이어가기 제출 → 202 후 시리즈 상세로 복귀 + 새 회차 스켈레톤
  자동 스크롤.
- [ ] 이어가기 플로우에서 사진 업로드 UI 렌더 0회(AC 2.6.6).
- [ ] 콜백 후 새 회차 COMPLETED 수신 시 MY 웹툰 N뱃지 재노출(BR-7).
- [ ] `useWebtoonGenerationPolling`, `useSeenMark` 훅이 공통 폴더에서 재사용
  (app-002/app-001과 동일 경로).
- [ ] `focus`, `continuationType` route param이 모든 진입점(CTA 탭, 딥링크,
  MY웹툰, 재시도)에서 전달 (C7).

## Verification Method

- **BE**:
  - 통합 테스트: AUTO/MANUAL 분기별 prompt snapshot assert, 이미지 주입
    검증, cross-user 404.
  - 단위 테스트: seen-mark idempotency, NO_REFERENCE_EPISODE.
  - 정적 추적: 크레딧 deduct call-site이 be-002 helper와 동일(C5).
- **App**:
  - Maestro: `series-detail-first.yaml`, `series-detail-last-continue.yaml`,
    `series-continue-manual-entry.yaml`.
  - 정적 추적: 훅 재사용(hooks 디렉토리 import path).
  - 수동 QA: 자동/직접 이어가기 실제 콜백 완료 → 새 회차 렌더 + 크레딧 잔액
    업데이트.

## Edge Cases

- 이어가기 연속 제출(자동 → 자동) 시 동시성 cap 경계.
- 이전 회차 FAILED 상태에서 이어가기 시도 → 400 (NO_REFERENCE_EPISODE).
- 직접 이어가기 입력 도중 앱 백그라운드 → 복귀 시 입력 유지(로컬 state).
- `focus=LAST_CONTINUE` 응답이 null(= COMPLETED 없음)일 때 앱이 fallback으로
  FIRST 렌더.
- 시리즈 상세 딥링크 직진입 + 서버 500 → 에러 뷰로 전환, 뒤로가기 → 홈.

## Sign-off

- be-003 merge 후 app-003 진행. be-002/be-003 병합 안정화 후 staging에서
  end-to-end 생성 확인.
- Evaluator: C5 재확인(크레딧 helper), C7 route param passthrough 전수
  추적.
