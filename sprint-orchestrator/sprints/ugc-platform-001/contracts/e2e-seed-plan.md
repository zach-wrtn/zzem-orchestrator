# E2E Seed Plan — Sprint ugc-platform-001

> Phase 2 산출물. 신규 Maestro flow에 필요한 seed 데이터와 fetcher 스크립트 설계.
> 기존 e2e 인증은 `zzem://e2e-auth?accessToken=...&refreshToken=...` 딥링크로 바이패스.
> 기존 fetcher: `fetch-seed-content-id.mjs`, `fetch-seed-filter-id.mjs`, `refresh-tokens.mjs`.

## 공통 전제

### 인증
- `.env.e2e`의 `E2E_ACCESS_TOKEN` / `E2E_REFRESH_TOKEN` 사용 (기존 패턴 유지).
- flow 시작 시 `runFlow: ../helpers/login.yaml`.
- 401 시 `refresh-tokens.mjs`가 자동 갱신 (기존 파이프라인).

### API Base
- `.env.e2e`의 `WRTN_API_URL`. 본 스프린트 endpoint는 `${WRTN_API_URL}/meme/v2/...`.

### 필수 환경변수 추가

| 변수 | 용도 | 주입 방식 |
|------|------|-----------|
| `E2E_SEED_OTHER_USER_ID` | 타유저 프로필 deeplink 타겟 | fetcher가 stdout → `run-e2e.mjs`가 maestro `--env`로 주입 |
| `E2E_SEED_PUBLIC_CONTENT_ID` | 공개 탭 첫 아이템 검증 | 동일 |
| `E2E_SEED_PRIVATE_CONTENT_ID` | 비공개 탭 첫 아이템 검증 | 동일 |

## 테스트 계정 구조 (seed 전제)

flow 작성 시 다음 상태의 테스트 계정 2종이 필요하다. Phase 4 시작 전 사용자가 수동 준비하거나, be-001/be-002 구현 후 admin 스크립트로 백필.

| 계정 | 요건 |
|------|------|
| **ME (토큰 소유자)** | 공개 콘텐츠 3개+, 비공개 콘텐츠 2개+, 닉네임/프로필 이미지 세팅 |
| **OTHER (타유저 프로필 타겟)** | 공개 콘텐츠 2개+ (비공개는 보유 무관 — 노출 안 돼야 함) |

> 공개 0/비공개 0 케이스는 별도 seed 없이 기본 랜딩 로직의 `빈 공개 탭 표시` 경로로 검증 가능.
> 공개 0, 비공개 1+ 랜딩 케이스는 ME 계정의 공개 콘텐츠를 수동으로 `isPublished=false`로 토글한 두 번째 스냅샷 필요 — Phase 4에서 보조 flow로 분리 고려.

## 신규 Fetcher 스크립트 (제안)

각 스크립트는 기존 `fetch-seed-content-id.mjs`와 동일한 구조:
- `parseEnvFile(ENV_PATH)` → `WRTN_API_URL`, `E2E_ACCESS_TOKEN` 로드
- API 호출 → 첫 아이템 id stdout 출력
- `fetchX(accessToken)` 함수 export

### 1. `fetch-seed-public-content-id.mjs`

```
GET ${WRTN_API_URL}/meme/v2/me/contents?visibility=public&size=1
→ body.list[0].id
```
- 실패(빈 리스트) 시 `[fetch-seed-public-content-id] 공개 콘텐츠가 없습니다.` + exit 1
- 소비처: `my-profile-default-landing.yaml`, `profile-to-swipe-feed.yaml`

### 2. `fetch-seed-private-content-id.mjs`

```
GET ${WRTN_API_URL}/meme/v2/me/contents?visibility=private&size=1
→ body.list[0].id
```
- 실패 시 "비공개 콘텐츠 seed 부재" 안내
- 소비처: `my-profile-default-landing.yaml` (비공개 랜딩 케이스)

### 3. `fetch-seed-other-user-id.mjs`

```
GET ${WRTN_API_URL}/meme/v2/users/recommended?size=5  // 또는 기존 추천 유저 endpoint
→ 공개 콘텐츠 2개+ 보유한 첫 userId
또는
ENV: E2E_SEED_OTHER_USER_ID 직접 지정 (정적 계정 ID)
```
- Phase 1에서는 **ENV 직접 지정 방식**을 권장 (추천 유저 endpoint 불확정). be-004 구현 후 동적 탐색으로 업그레이드 가능.
- 소비처: `other-user-profile.yaml`, `profile-to-swipe-feed.yaml`

### 4. (선택) `fetch-seed-profile-counts.mjs`

- ME의 공개/비공개 count를 stdout JSON으로 내보내서, flow 내 조건 분기에 활용.
- Phase 4에서 필요 시 추가. 초기 flow는 "seed는 이미 정합성이 맞는다"는 가정으로 작성.

## `run-e2e.mjs` 통합

기존 파이프라인에 env 주입 추가 (Phase 4에서 구현, Spec에서는 설계만):

```
1. refreshTokens() 로 토큰 갱신
2. 병렬 fetch:
   - fetchSeedPublicContentId(accessToken)
   - fetchSeedPrivateContentId(accessToken)
   - fetchSeedOtherUserId() (env fallback)
3. maestro test --env E2E_ACCESS_TOKEN=... \
                --env E2E_REFRESH_TOKEN=... \
                --env E2E_SEED_PUBLIC_CONTENT_ID=... \
                --env E2E_SEED_PRIVATE_CONTENT_ID=... \
                --env E2E_SEED_OTHER_USER_ID=... \
                e2e/flows/${flow}
```

## Flow ↔ Seed 의존성 매트릭스

| Flow | E2E_ACCESS_TOKEN | PUBLIC_CONTENT_ID | PRIVATE_CONTENT_ID | OTHER_USER_ID |
|------|:---:|:---:|:---:|:---:|
| `bottom-tab-nav.yaml` | ✓ | | | |
| `explore-tab.yaml` | ✓ | | | |
| `my-profile-default-landing.yaml` | ✓ | ✓ | ✓ (랜딩 분기) | |
| `settings-menu-full.yaml` | ✓ | | | |
| `profile-edit.yaml` | ✓ | | | |
| `other-user-profile.yaml` | ✓ | | | ✓ |
| `profile-to-swipe-feed.yaml` | ✓ | ✓ | | ✓ (타유저 케이스) |

## Seed 품질 검증 (Phase 4 진입 전 체크)

- [ ] ME 계정에 공개 콘텐츠 3+ / 비공개 2+ 존재 (be-003 구현 후 GET /me/contents 확인)
- [ ] OTHER 계정에 공개 콘텐츠 2+ 존재 (be-004 구현 후 GET /users/:id/contents 확인)
- [ ] `.env.e2e.example`에 신규 env 항목 추가 (`E2E_SEED_OTHER_USER_ID` 등 — 값은 팀 Notion 링크)
- [ ] 새 fetcher 3종이 `e2e/scripts/`에 배치되고 `run-e2e.mjs`가 주입 로직 포함

## 수동 보조 QA 항목 (Deferred)

`e2e-flow-plan.md`의 Deferred에 대응:
- 프로필 공유 OS 시트 — 실기기에서 1회 확인 후 Notion QA 체크리스트에 기록
- 콘텐츠 생성 후 리다이렉트 — Evaluator 코드 추적 + 1회 실기기 확인
- 404 유저 딥링크 — 로컬 `.env.e2e`에 `E2E_SEED_INVALID_USER_ID=000000...` 하드코딩하여 수동 테스트 1회
