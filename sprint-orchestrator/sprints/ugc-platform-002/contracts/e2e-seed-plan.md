# E2E Seed Plan — ugc-platform-002

> Phase 2 (Spec) 산출물. E2E flow 의 seed fetcher 목록 + BE 준비 요구.

## Seed Fetcher 목록

각 fetcher 는 `app/apps/MemeApp/e2e/scripts/fetch-seed-{name}.mjs` 위치에 Phase 1 동일 패턴 (기존 `fetch-seed-*.mjs` 참조) 으로 구현.

| Fetcher | Env Var | BE Endpoint | Description |
|---------|---------|-------------|-------------|
| `fetch-seed-my-content.mjs` | `E2E_SEED_MY_CONTENT_ID` | GET `/v2/me/contents?visibility=public&limit=1` | 내 공개 일반 콘텐츠 1건 |
| `fetch-seed-my-custom-prompt.mjs` | `E2E_SEED_MY_CUSTOM_PROMPT_CONTENT_ID` | GET `/v2/me/contents?visibility=private&limit=5` → 응답 중 `isCustomPrompt=true` 첫 아이템 | 내 custom-prompt (비공개) |
| `fetch-seed-other-user-content.mjs` | `E2E_SEED_OTHER_USER_CONTENT_ID` + `E2E_SEED_OTHER_USER_ID` | GET `/v2/users/{persona or test-user-id}/contents?limit=1` | 타 유저 공개 콘텐츠 |
| `fetch-seed-liked-content.mjs` | `E2E_SEED_LIKED_CONTENT_ID` | GET `/v2/me/contents?visibility=liked&limit=1` → fallback: POST `/v2/contents/{any-public-id}/likes` 로 생성 후 재조회 | 좋아요 누른 콘텐츠 1건 |
| `fetch-seed-payback-entry.mjs` | `E2E_SEED_PAYBACK_HISTORY_ID` | GET `/v2/credit/history?type=payback&limit=1` (BE 가 type 필터 제공 시) 또는 GET `/v2/credit/history?limit=20` → 첫 PAYBACK 엔트리 | PAYBACK 타입 히스토리 엔트리 |

## BE 준비 작업 (선행)

다음은 각 Backend 태스크의 Specification 에 **사전 반영** 되어야 한다 (그룹 시작 전 준비 완료).

### be-001 (Visibility toggle)
- Dev/staging DB 에 테스트용 유저 (E2E_TEST_USER_ID) 의 공개/비공개 콘텐츠 각 1건 이상 존재 보장 (기존 seed 유지).
- Custom-prompt 비공개 콘텐츠 1건 보장 — 기존 seed 에 없으면 seed 추가 스크립트 (be-001 Test 섹션).

### be-002 (Regeneration tracking)
- 재생성 체인 테스트: A(owner_A) → B(owner_B, src=A) 체인 seed 1건. regenerateCount 검증용.
- Persona (INTERNAL) 유저 콘텐츠 1건 — self-regeneration / persona skip 테스트용.

### be-003 (Payback trigger)
- Credit wallet 초기 balance seed 유저 (테스트 재생성 크레딧 차감 가능). Config `PAYBACK_RATE=0.01` 설정.
- CreditHistory 에 PAYBACK 엔트리 seed 추가용 endpoint 또는 이벤트 트리거 경로 노출 (test-only endpoint 허용).

### be-004 (Likes)
- Like collection seed: E2E_TEST_USER_ID 가 공개 콘텐츠 1건 좋아요 상태 보장.
- `fetch-seed-liked-content.mjs` 가 fallback 으로 POST `/likes` 호출 시 멱등 동작 확인 (이미 좋아요 상태면 재호출 200).

## Env Prerequisites

E2E runtime 환경 변수:
- `LIB_USER_ID` — E2E 테스트 유저 id (기존 convention).
- `E2E_SEED_*` 위 표 참조.
- `PAYBACK_RATE` (BE 설정, staging/dev).

각 flow 상단 주석에 필요 env 명시 (rubric C9 — E2E 환경 의존성 명시):
```yaml
# Env: LIB_USER_ID, E2E_SEED_MY_CONTENT_ID
# Prerequisites: 로그인 상태, seed fetcher 선행 실행
# Optional: E2E_SEED_OTHER_USER_CONTENT_ID (타 소유 분기 테스트에 한함)
```

## Graceful Degradation

- seed fetcher 실패 시 flow 는 `optional: true` 포함된 assertion 만 skip, 필수 assertion 은 fail 유지.
- CI 에서 seed env 없을 시 해당 flow skip + 경고 로그 (rubric C9).
- Manual run 시 seed fetcher 가 누락된 env 를 stdout 에 명시하고 exit code 1.
