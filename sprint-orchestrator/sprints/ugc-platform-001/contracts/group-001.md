# Sprint Contract: Group 001 — Backend Data Layer

> Sprint: `ugc-platform-001` (UGC Platform Phase 1 — 프로필 & 네비게이션)
> Drafted: 2026-04-22 (Sprint Lead) — Round 2 (Evaluator feedback 반영)
> Repo: `wrtn-backend`, branch `sprint/ugc-platform-001`, base `apple`
> Target app: `apps/meme-api`

## Scope

| Task | Target | AC 근거 |
|------|--------|---------|
| be-001 | `Content.isPublished: boolean` 스키마 + 복합 인덱스 | 공개/비공개 구분의 스키마 기반 |
| be-002 | `/v2/me/profile` GET/PATCH + 자동 닉네임 + persona 플래그 | PRD AC 2.2 / 2.4 / 2.6 / 7.5 |
| be-003 | `/v2/me/contents` visibility 필터 + counts 엔드포인트 | PRD AC 2.1 / 2.2 / 2.5 |
| be-004 | `/v2/users/:userId/profile` + `/v2/users/:userId/contents` | PRD AC 7.1 |

**Endpoints (SSOT `contracts/api-contract.yaml`)**:
- `GET /v2/me/profile`, `PATCH /v2/me/profile`
- `GET /v2/me/contents?visibility&cursor&limit`, `GET /v2/me/contents/counts`
- `GET /v2/users/{userId}/profile`, `GET /v2/users/{userId}/contents?cursor&limit`

## Done Criteria

### Schema / Data (be-001)

- [ ] `Content` Mongoose 스키마에 `isPublished: boolean` 필드, `default: false` 설정.
- [ ] 필드 부재 문서 로드 시 `doc.isPublished === false` — 단위 테스트 증명.
- [ ] 복합 인덱스 `{ userId: 1, isPublished: 1, createdAt: -1 }` 생성. `db.collection('contents').indexes()` 통합 테스트로 확인.
- [ ] 기존 `status` / `deletedAt` 독립 동작 유지 — 기존 `GET /v2/contents`(visibility-agnostic) 회귀 0.
- [ ] Backfill 스크립트 없음 (PRD "No Batch"). Schema default만 허용.

### /v2/me/profile (be-002)

- [ ] `GET /v2/me/profile` 최초 호출 시 `UserProfile`이 없으면 지연 생성 후 200.
- [ ] `UserProfile.userId` 필드에 **unique index**. 경쟁 요청 시 `E11000 duplicate key` 에러를 catch하여 기존 문서를 re-fetch 후 200 반환 (예외 전파 금지). 통합 테스트: `Promise.all([GET, GET])`로 동일 userId 동시 호출 2회 → 둘 다 200 + 동일 document id.
- [ ] 자동 닉네임 포맷: `/^[가-힣]+[가-힣]+\d{4}$/` (형용사+동물+4자리 숫자). 단어 풀 각 200개 이상.
- [ ] 기본 `profileImageUrl`: 서버 제공 기본 회색 아바타 URL (상수 노출, 명시적으로 null 금지).
- [ ] `isPersona = (UserProfile.type === USER_PROFILE_TYPE.INTERNAL)` — `MyProfileResponse`에만 포함.
- [ ] `PATCH /v2/me/profile` validator: `nickname` 2~20자, `profileImageFileUuid` 존재성 확인(`FileAppService`), `bio`/`link` 최대 500자. 실패 시 400.
- [ ] PATCH 빈 바디 요청 → 200 + 현재 프로필 반환 (no-op).
- [ ] `followerCount`, `followingCount` 모두 Phase 1에서 **0 고정** (응답 필드는 존재).
- [ ] `regeneratedCount: 0` **하드코딩**. 구현 위치에 `// TODO(phase-3): wire to content regeneration tracking` 주석 필수. 추가 로직 검증 없음.

### /v2/me/contents + counts (be-003)

- [ ] `visibility=public` → `{ isPublished: true, userId: self, deletedAt: null }`. `createdAt desc` 정렬.
- [ ] `visibility=private` → **쿼리는 `{ isPublished: { $ne: true }, userId: self, deletedAt: null }`**. `{ isPublished: false }` 형태 **금지** (레거시 필드 부재 문서가 결과에 포함되어야 함 — api-contract.yaml L83). 통합 테스트: `isPublished` 필드 자체가 없는 raw insert seed 문서가 private 응답 list에 포함되는지 검증.
- [ ] `visibility=liked` → **200 + `{ list: [], nextCursor: null }`** (400/501 금지). Phase 2용 자리.
- [ ] `GET /v2/me/contents/counts` → `{ public: N, private: M, liked: 0 }` 정확한 필드명/타입.
- [ ] `limit=2` + 공개 3건 시드 → 첫 응답 `list.length=2`, `nextCursor != null`. 다음 호출에서 나머지 1건 + `nextCursor=null` — 통합 테스트로 검증. **(KB: correctness-001)**
- [ ] `limit > 100` 요청 시 **400 BadRequest** 반환 (api-contract.yaml `maximum: 100` 강제). 100으로 silent clamp 금지.
- [ ] `ContentSummary` 필드: `id`, `thumbnailUrl`, `isPublished`, `createdAt`, `status`.

### /v2/users/:userId/* (be-004)

- [ ] `GET /v2/users/:userId/profile` → `PublicProfileResponse`. 응답에 `isPersona` 필드 **미포함** (type diff로 검증).
- [ ] **INTERNAL(persona) 유저도 조회 허용**. `PublicProfileResponse`는 `isPersona` 필드 자체가 없으므로 응답 스키마만 지키면 된다. 별도 차단/필터 없음.
- [ ] `/v2/users/:userId/profile` — 존재하지 않는 `userId` → **404** (200 + 빈 응답 금지).
- [ ] `/v2/users/:userId/contents` — **존재하지 않는 `userId` → 404** (`profile`과 동일 정책). 진입 시 UserProfile 존재 확인 후 미존재면 404 반환. 200+빈 리스트 금지.
- [ ] `GET /v2/users/:userId/contents` → `{ isPublished: true, userId: {param}, deletedAt: null }` 필터 **강제**. 비공개 콘텐츠가 응답에 섞여 있지 않음 — 공개 2건 + 비공개 3건 시드 시 list.length === 2.
- [ ] 커서 페이지네이션 동작: `limit`/`nextCursor` 규약이 be-003과 동일. `limit > 100` → 400.
- [ ] 인증 필수 (`LibUserGuard`). 헤더 누락 시 401.

### KB Contract Clauses (자동 주입)

- [ ] **correctness-001** (critical): 페이지네이션 Controller에서 `CursorResponseDto` 재래핑 금지. Service 반환값을 그대로 passthrough. 통합 테스트에서 `nextCursor` 실제 값 검증. *(적용: be-003, be-004 list endpoints)*
- [ ] **correctness-002** (critical): 응답 DTO의 모든 필드는 일반 property + `@ApiProperty()`. `get` 키워드 getter 사용 금지. *(적용: 모든 DTO)*
- [ ] **integration-001** (critical): 배열 응답 필드명 `list` 준수. `MyProfileResponse` / `PublicProfileResponse` / `ContentSummary` / `ContentCountsResponse` / `ContentListResponse`의 모든 필드명을 `api-contract.yaml`과 1:1 대조. 특히 `profileImageUrl`, `isPersona`, `regeneratedCount` camelCase.

### 공통 빌드 품질

- [ ] `npm run lint` / `npm run typecheck` 신규 에러 0.
- [ ] Domain/Application/Controller 4-layer 경계 준수 (레포 `nestjs-architecture` 스킬).
- [ ] E2E: `@testcontainers/mongodb` 기반 시나리오 통과 — be-002 (GET→PATCH + nickname 경계 2개 + 동시 GET 멱등), be-003 (public/private/liked/cursor + private 레거시 미필드 포함 + limit=101 400), be-004 (다른 유저가 A 프로필+public contents 조회, 비공개 누출 없음 + 존재하지 않는 userId 양쪽 모두 404).
- [ ] **기존 meme-api 테스트 suite 전체 green** (회귀 없음) **+** `rg "isPublished" apps/meme-api/src/ --type ts` 결과가 신규 경로(`persistence/content/*`, `controller/content/me-contents*`, `controller/users/*`, `domain/content/*` 가시성 predicate) 외에 등장하지 않음. 기존 홈/피드/추천 경로에 `isPublished` 유출 금지.

## Verification Method

Evaluator는 다음을 수행한다:

1. **Static checks**:
   - `rg "new CursorResponseDto\(" apps/meme-api/src/controller/` — 0건 기대 (Service는 허용).
   - `rg "^\s*get \w+\(\)" apps/meme-api/src/**/dto/` — API 응답 DTO 경로에서 0건 기대.
   - `apps/meme-api/src/controller/users/` vs `controller/user/` 기존 경로 중복/오염 없음 확인.
2. **Schema/DTO diff**:
   - `MyProfileResponse` 필드 집합 ⊇ `api-contract.yaml` required 집합 + `isPersona` 존재.
   - `PublicProfileResponse` 필드 집합에 `isPersona` **부재**.
   - `ContentListResponse` → 배열 필드명이 `list` (`items` 아님).
3. **Trace execution (active evaluation)**:
   - `GET /v2/me/profile` — 신규 userId 호출 시 UserProfile 생성 경로를 코드에서 trace. 동시 호출에서 unique index 충돌 시 두 번째 호출이 기존 문서 반환하는지 확인.
   - `visibility=private` → 필드 부재 문서(`isPublished` 없음)가 포함되는 조건 쿼리 검증 (`{ $ne: true }` 또는 `{ $in: [false, null, undefined] }` 의도 확인).
   - `/v2/users/:userId/contents`에서 쿼리가 `userId` 필터를 path param으로 정확히 바인딩하는지 (SQL injection/무단 사용자 ID 조작 여부 검토는 LibUserGuard 범위 밖 OK).
4. **E2E execution**:
   - `apps/meme-api` 테스트 전체 실행. 시드 기반 public 2 + private 3 + otherUserA → assertion.
5. **Regression guard**:
   - 기존 `GET /v2/contents` / 홈·피드·추천 경로에 `isPublished` 필터 유출 없음 — `rg "isPublished" apps/meme-api/src/` 결과에서 신규 경로 외 등장 검토.

### Edge cases Evaluator가 탐색할 것

- `PATCH` `{ nickname: "가나" }` (경계 2자) → 200.
- `PATCH` `{ nickname: "가" }` (1자) → 400.
- `PATCH` `{ nickname: "가".repeat(21) }` (21자) → 400.
- `PATCH` `{}` → 200 (no-op).
- `GET /v2/me/contents?visibility=public&limit=101` → **400 BadRequest** (clamp 금지).
- `visibility=liked&cursor=<anything>` → 200 + 빈 리스트 (cursor 해석이 에러를 일으키지 않는가).
- `GET /v2/users/{INVALID_ID}/profile` → 404 (500 금지).
- `GET /v2/users/{INVALID_ID}/contents` → 404 (200+빈 금지).
- INTERNAL(`isPersona=true`) 유저가 `/v2/users/:userId/profile`로 조회되는 경우: **200 + `PublicProfileResponse`** (조회 허용, `isPersona` 필드 자체가 스키마에 없음).
- 동일 신규 userId로 `GET /v2/me/profile`을 `Promise.all`로 2회 동시 호출 → 둘 다 200 + 동일 `id`. 서버 로그에 `E11000` trace 1회 이하(catch 성공).
- `MyProfileResponse`에서 `followerCount` / `followingCount` / `regeneratedCount` 모두 숫자 0 직렬화 (null 금지, `minimum: 0`).

### Business rule traps

- **`private` 필터 쿼리**: `{ isPublished: { $ne: true } }` 형태 **강제** (Done Criteria §be-003 참조). `{ isPublished: false }`는 레거시 필드 부재 문서를 제외하므로 금지.
- `regeneratedCount` 0 반환 시 필드 자체가 응답에 존재해야 하며 `undefined` 직렬화 누락은 integration-001 위반.
- `E11000 duplicate key` — `userId` unique index 충돌 시 catch 후 기존 문서 re-fetch 필수. 예외 전파하면 동시 최초 GET 중 한 호출이 500 반환.
- `/v2/users/:userId/contents`에서 `userId` 존재 확인을 DB round-trip으로만 수행 — `/profile`과 동일한 404 정책 유지.

## Sign-off

- [x] **Evaluator approved — 2026-04-22** (Round 2)
  - Round 1: REVISIONS REQUESTED (7 이슈)
  - Round 2: APPROVED (7건 모두 RESOLVED, 새 이슈 0건)
  - 사용자 정책 결정: limit>100→400 / users/:id/contents 미존재→404 / INTERNAL public 조회 허용
- [x] BE Engineer 착수 허가
