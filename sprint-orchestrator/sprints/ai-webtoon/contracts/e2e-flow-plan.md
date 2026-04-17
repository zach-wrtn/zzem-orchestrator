# E2E Flow Plan — ai-webtoon

> Maestro 제약: Fabric+RNGH tap 미발화 → 네비게이션은 딥링크 우선.
> 생성 파이프라인(사진 업로드, 크레딧 차감, fal-ai 콜백, 폴링 완료)은
> 대부분 Deferred (server-injection-required / time-warp) → BE 유닛·통합
> 테스트 + 수동 QA로 대체. 결과 화면의 UI 렌더링·이어가기 CTA 위치·빈
> 상태·N뱃지는 Maestro 커버 대상.

## 기존 flow 확인

| 파일 | 재사용 여부 |
|------|-----------|
| `home-tabs.yaml` | Extend (웹툰 탭 assertVisible) |
| `deeplink-smoke.yaml` | Extend (웹툰 딥링크 5종 추가) |
| `home-to-settings.yaml`, `swipe-feed.yaml`, 기타 | 변경 없음 |

신규 `app/apps/MemeApp/e2e/flows/webtoon-*.yaml` 파일군을 생성한다.

## 신규 / 확장 flow

| 이름 | 분류 | 대상 AC |
|------|------|---------|
| `home-tabs.yaml` | Extend | AC 2.1.1 (탭 3개 + 웹툰 탭 assertVisible) |
| `webtoon-tab-browse.yaml` | New | AC 2.1.2, 2.2.1 (템플릿 카드 2개, 상세 진입) |
| `webtoon-tab-empty.yaml` | New | AC 2.1.3 (빈 응답 — test-seed로 템플릿 비우기 or feature flag) |
| `webtoon-generate-entry.yaml` | New | AC 2.3.1, 2.3.2 (입력 화면 진입 + CTA disabled) |
| `my-webtoon-empty.yaml` | New | AC 2.6.1, 2.6.5 (플로팅 → 빈 상태) |
| `my-webtoon-seeded.yaml` | New | AC 2.6.1 (N뱃지), 2.6.3 (카드→FIRST), 2.6.4 (이어가기→LAST_CONTINUE) |
| `series-detail-first.yaml` | New | AC 2.4.1 (완료 상태 렌더), 2.6.2 (/seen 호출 검증 — 리스트 재진입 뱃지 off) |
| `series-detail-last-continue.yaml` | New | AC 2.4.2, 2.6.4 (이어가기 CTA testID assertVisible) |
| `series-continue-manual-entry.yaml` | New | AC 2.5.2 (보라 배너 + 입력 필드 + 활성 토글) |
| `deeplink-smoke.yaml` | Extend | `zzem://webtoon`, `.../template/{id}`, `.../my`, `.../series/{id}`, `.../series/{id}/continue` smoke |

## AC 커버리지 매트릭스

| AC | 분류 | Flow / 대체 |
|----|------|-----------|
| 2.1.1 | Extend | `home-tabs.yaml` |
| 2.1.2 | New | `webtoon-tab-browse.yaml` |
| 2.1.3 | New | `webtoon-tab-empty.yaml` |
| 2.2.1 | New | `webtoon-tab-browse.yaml` |
| 2.3.1 | New | `webtoon-generate-entry.yaml` |
| 2.3.2 | New | `webtoon-generate-entry.yaml` |
| 2.3.3 | Deferred | server-injection-required (실제 제출/차감 분기) → BE 통합 + 수동 QA |
| 2.3.4 | Deferred | 실 폴링·콜백 의존 → BE 통합 + 수동 QA |
| 2.3.5 | Deferred | 크레딧 제로 상태 주입 필요 → BE 통합(크레딧 precheck) + 수동 QA |
| 2.3.6 | Deferred | 유해 이미지 모델 의존 → BE 통합 + 수동 QA |
| 2.3.7 | Deferred | 서버 500 주입 어려움 → BE 통합 + 수동 QA |
| 2.3.8 | Deferred | time-warp → BE watchdog 유닛 + 수동 QA |
| 2.4.1 (완료) | New | `series-detail-first.yaml` (test-seed 완료 상태) |
| 2.4.1 (실패/진행) | Deferred | 실 상태 주입 한계 → BE 유닛 + 수동 QA |
| 2.4.2 | New | `series-detail-last-continue.yaml` |
| 2.5.1 (제출) | Deferred | 실 콜백 의존 → BE 통합 + 수동 QA |
| 2.5.2 (입력 화면) | New | `series-continue-manual-entry.yaml` |
| 2.5.2 (제출) | Deferred | 위와 동일 |
| 2.6.1 | New | `my-webtoon-seeded.yaml`, `my-webtoon-empty.yaml` |
| 2.6.2 | Covered | `series-detail-first.yaml` (리스트 재진입 뱃지 off 확인) |
| 2.6.3 | New | `my-webtoon-seeded.yaml` (카드 탭) |
| 2.6.4 | New | `my-webtoon-seeded.yaml` (이어가기 버튼 탭) + `series-detail-last-continue.yaml` |
| 2.6.5 | New | `my-webtoon-empty.yaml` |
| 2.6.6 | Covered | `series-continue-manual-entry.yaml`(사진 업로드 UI assertNotVisible) |

## Deep links (신규 선언)

| URL | 대상 화면 |
|-----|-----------|
| `zzem://webtoon` | 홈의 웹툰 탭 활성 |
| `zzem://webtoon/template/{templateId}` | 템플릿 상세 |
| `zzem://webtoon/generate/{templateId}` | 입력 화면 (test 진입) |
| `zzem://webtoon/my` | MY 웹툰 리스트 |
| `zzem://webtoon/series/{seriesId}` | 시리즈 상세(FIRST) |
| `zzem://webtoon/series/{seriesId}/continue` | 시리즈 상세(LAST_CONTINUE) |
| `zzem://webtoon/series/{seriesId}/continue/manual` | ManualContinueInputScreen |

모든 딥링크 직진입은 back stack 없이도 홈으로 착지해야 함(C8 lesson).

## testID 요구

- 탭: `home-tab-webtoon`
- 탭 스크린: `webtoon-template-card-{index}`, `webtoon-empty`, `webtoon-floating-button`
- 템플릿 상세: `webtoon-template-detail-header`, `webtoon-template-detail-cta`
- 입력 화면: `webtoon-photo-slot`, `webtoon-generate-cta`, `webtoon-character-chip`, `webtoon-synopsis-readonly`
- MY 웹툰: `my-webtoon-empty`, `my-webtoon-card-{seriesId}`, `my-webtoon-continue-button-{seriesId}`, `my-webtoon-n-badge-{seriesId}`
- 시리즈 상세: `series-header-title`, `episode-tab-{n}`, `continuation-cta-bar`, `continuation-auto-cta`, `continuation-manual-cta`, `inline-episode-error-{n}`, `webtoon-image-{n}`
- 직접 이어가기: `manual-continue-banner`, `manual-continue-input`, `manual-continue-cta`

## Seed 요구

`e2e-seed-plan.md` 참조. 주요 의존: `test-seed-series`(완료 시리즈 주입),
`test-seed-empty-series`(clear).

## 제약 요약

- 사진 업로드/크롭, fal-ai 콜백, 크레딧 차감은 e2e 범위 외(Deferred).
- BE 통합 테스트는 be-002/be-003 AC 항목이 1:1 대응 커버.
- 수동 QA 체크리스트는 Phase 4 kickoff에서 별도 산출(여기선 언급만).
