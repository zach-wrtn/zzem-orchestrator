# E2E Seed Plan — free-tab-diversification

각 플로우에 필요한 시드 fetcher와 주입 env를 정의한다. BE 담당 준비 작업은 **be-003/be-004 태스크 Specification에 반영**한다.

## Fetchers

| 이름 | BE endpoint | 주입 env | 소비 flow |
|------|------------|----------|-----------|
| `fetch-seed-free-roster.mjs` | `GET /free-tab` | `SEED_FREE_FILTER_IDS`(쉼표 구분), `SEED_FREE_ROSTER_DATE` | free-tab-grid, swipe-feed-free-circular, free-gen-confirm |
| `fetch-seed-free-used-today.mjs` | 테스트 전용 토글: `POST /__test__/free-quota/{set|clear}` | `SEED_FREE_USED_TODAY`(true/false) | free-tab-grid(틸배너), free-gen-confirm(유료 CTA) |
| `fetch-seed-empty-roster.mjs` | 테스트 전용 토글: `POST /__test__/free-roster/clear` | `SEED_FREE_ROSTER_EMPTY`=1 | free-tab-grid(빈 상태) |
| `fetch-seed-fallback-roster.mjs` | 테스트 전용 토글: 오늘 슬롯 clear, 어제 slot만 유지 | `SEED_FREE_ROSTER_FALLBACK`=1 | free-tab-grid(폴백) |

## BE 준비 작업 (be-003/be-004 반영 필요)

> be-003에 추가할 Specification 항목:
> - 테스트 전용 엔드포인트 `POST /__test__/free-roster/{seed|clear}` 및 `POST /__test__/free-quota/{set|clear}` 제공(테스트 환경에서만 활성, 프로덕션 비활성 가드).

## 비고
- multi-device(AC 2.6.5) / time-warp(AC 2.5.4, 2.2.10) / concurrent-generation(AC 2.2.9)은 e2e 범위 외.
