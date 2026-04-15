# E2E Seed Plan — ai-webtoon

각 Maestro flow에 필요한 seed fetcher와 주입 env를 정의한다. BE seed 엔드
포인트 준비는 **be-003 태스크 Specification에 반영** 되어 있다.

## Fetchers

| 이름 | BE endpoint | 주입 env | 소비 flow |
|------|-------------|----------|-----------|
| `fetch-seed-webtoon-templates.mjs` | `GET /webtoon/templates` | `SEED_WEBTOON_TEMPLATE_IDS`(쉼표) | `webtoon-tab-browse.yaml` |
| `fetch-seed-webtoon-series.mjs` | `POST /__test__/webtoon/series/seed` with `{templateId, episodeCount:2, allCompleted:true, hasUnseen:true}` | `SEED_WEBTOON_SERIES_ID`, `SEED_WEBTOON_LAST_EPISODE` | `my-webtoon-seeded.yaml`, `series-detail-first.yaml`, `series-detail-last-continue.yaml` |
| `fetch-seed-webtoon-empty.mjs` | `POST /__test__/webtoon/series/clear` | `SEED_WEBTOON_SERIES_EMPTY=1` | `my-webtoon-empty.yaml` |
| `fetch-seed-webtoon-templates-empty.mjs` | feature flag off + 템플릿 hide toggle (test env) | `SEED_WEBTOON_TEMPLATES_EMPTY=1` | `webtoon-tab-empty.yaml` |
| `fetch-seed-webtoon-manual-series.mjs` | `POST /__test__/webtoon/series/seed` with `{episodeCount:1, allCompleted:true}` | `SEED_WEBTOON_SERIES_ID` | `series-continue-manual-entry.yaml` (딥링크 진입용) |

## BE 준비 작업 (이미 be-003에 반영)

- `POST /__test__/webtoon/series/seed` — series + episodes 주입, 테스트
  env에서만 활성.
- `POST /__test__/webtoon/series/clear` — 해당 유저의 seeded series 삭제.
- 템플릿 빈 상태 토글은 feature flag(unleash)로 구현 권장 — hardcoded
  템플릿 2개는 BR-8. 테스트용 env `WEBTOON_TEMPLATES_DISABLED=true` 분기
  허용(BE가 `/webtoon/templates` 응답을 `[]`로 반환).

## 인증 전제

- 모든 seeded flow는 authenticated user 필요. 기존 e2e 인증 토큰 발급
  헬퍼(`flows/login-entry-point.yaml` 등에서 사용) 재사용.
- Prerequisites 주석을 각 flow 상단에 명시(C9 lesson).

## 비고

- fal-ai 콜백 시뮬레이션(callback test endpoint)은 이 스프린트 범위에서
  **제공하지 않음**. callback 경로는 BE 통합 테스트 및 수동 QA 전담.
- multi-device 동기화, time-warp, 크레딧 정확 잔액 검증은 e2e 범위 외.
