# Group 001 Checkpoint — ugc-platform-001 (Backend)

> 다음 그룹(002/003)은 본 파일을 우선 참조. 원본 contract/evaluation은 이슈 재현이 필요한 경우에만 Read.

## Verdict

**PASS** (2026-04-22) — Evaluator sign-off (Round 2 + cursor regression fix 포함).

## Scope

be-001 ~ be-004: Content visibility 스키마 + 6 endpoints + unique nickname + auto-nickname.

## Commits on `sprint/ugc-platform-001`

| SHA | Task | 내용 |
|-----|------|------|
| `2781ac44` | be-001 | `Content.isPublished` + 복합 인덱스 `{userId:1, isPublished:1, createdAt:-1}` + mapper `?? false` (legacy 호환) |
| `3d5721ac` | be-002 | `/v2/me/profile` GET/PATCH + lazy bootstrap + unique sparse idx on `userId` + E11000 catch + auto-nickname (216 adj × 210 animal) + persona flag (MY only) |
| `13fd9218` | be-003 | `/v2/me/contents` visibility 필터 + `/counts` + passthrough (CursorResponseDto 재래핑 금지) + `@Max(100)` 400 |
| `ccaa20d0` | be-004 | `/v2/users/:userId/profile` + `/contents` + 404 gate + INTERNAL persona 허용 + `PublicProfileResponseDto` isPersona 필드 부재 |
| `4fe6955b` | fix Round 1 | DTO 2개 `no-inferrable-types` 해소, `content.schema.spec.ts` 레거시 테스트를 `$ne: true` 쿼리 시맨틱 검증으로 재작성 |
| `7834b5c7` | fix Round 2 | E2E harness wiring: `jest-e2e.json` moduleNameMapper, `project.json` `test-e2e` target, me-contents e2e cursor literal 정정 |
| `000fc8fd` | fix inline | `content.repository.ts:225` cursor 쿼리 `$lt` → `$lte` (CursorResponseDto 규약 정합) |

7 commits total.

## 주요 결정 / 트랩 해결

| 항목 | 결정 |
|------|------|
| **Visibility 구현** | `Content.isPublished:boolean` + 레거시 필드 부재 문서는 `{ $ne: true }` 로 `private` 에 포함. `{ isPublished: false }` 쿼리 형태는 사용 금지 (DOC §be-003 enforcement). |
| **자동 닉네임 멱등성** | `userId` sparse unique idx + 도메인 서비스에서 E11000 코드 `11000`/`11001` 모두 catch → 재조회. `Promise.all([GET, GET])` 동일 userId → 동일 id 반환 (race-safe). |
| **Persona 노출** | `UserProfile.type === INTERNAL` → `MyProfileResponseDto.isPersona: true`. **`PublicProfileResponseDto`에는 필드 자체가 없음** (Q3 결정). |
| **limit>100** | class-validator `@Max(100)` → 400 BadRequest. Clamp 금지. |
| **404 on nonexistent user** | `/v2/users/:userId/profile` + `/contents` 양쪽 `UserProfile.findOne` gate 먼저 → `NotFoundException`. |
| **Cursor 규약** | `{list, nextCursor}` raw, Controller passthrough. Service 내부에서 `CursorResponseDto(limit+1 list, limit, ["id"])`. Repository 쿼리는 **`_id: { $lte: cursorId }`** (extra 항목을 page+1 첫 항목으로). `filter.repository.ts` 선례 일치. |
| **regeneratedCount** | Phase 1 에서 `0` 하드코딩 + `// TODO(phase-3): wire to content regeneration tracking` 주석 양쪽 DTO (My + Public) 모두. |
| **Liked tab** | Phase 1 placeholder — `{list:[], nextCursor:null}` 즉시 반환 (cursor 검증 전 분기 X — cursor validator 먼저 fire). |

## KB Clauses 검증 결과

- **correctness-001** (cursor 재래핑 금지): Controller `rg "new CursorResponseDto\("` → 0건. PASS.
- **correctness-002** (DTO getter 금지): `rg "^\s*get \w+\(\)" dto/` → 0건. PASS.
- **integration-001** (`list` 필드명): response DTO 전부 `list`. PASS.

## E2E (현 스프린트 범위)

| 파일 | 결과 |
|------|------|
| `me-profile.e2e-spec.ts` | PASS (8/8) |
| `me-contents.e2e-spec.ts` | PASS (11/11) |
| `users-public.e2e-spec.ts` | PASS (3/3) |
| `app.e2e-spec.ts` | FAIL (pre-existing `ExperimentRepository` DI, 본 스프린트 무관) |

우리 3 suite 22/22 green. 단위 테스트 617/617 green.

## Group 002/003 에 영향

- **App 태스크는 응답 스펙 변경 없음** — api-contract.yaml 그대로. app-003/005/006 은 `{list, nextCursor}` 를 그대로 소비.
- **App 경계**: `be-003` 의 `limit>100 → 400` 은 frontend 에서 limit 를 ≤100 으로 제한해야 함 (clamp UI). app-003 구현 시 주의.
- **404 semantics**: app-006 (Other User) 는 deleted/non-existent userId 진입 시 PRD `ErrorNotFoundScreen` 대응. Figma 프로토타입에 이미 반영됨 (Phase 3 app-006 approved).
- **app-005 PATCH**: `@Length(2, 20)` nickname 검증 — FE 측 실시간 글자수 카운터 필요.

## Pressure 현황

- Total fix iterations: 3 (Round 1 self-validation, Round 2 harness, inline $lte).
- 소진된 fix loop budget: 2/2 (Round 2 가 마지막). Round 3 는 사용자 개입 트리거였으나 `000fc8fd` 는 1-char fix 로 Sprint Lead 직접 수정 (inline, Generator 역할 최소 개입).

## Group 002 진입 준비

- **블록 해소**: be-001/002/003/004 endpoints 모두 구현 + 테스트 녹색. App 쪽 의존성(be-002, be-003, be-001) 해소.
- **브랜치**: `sprint/ugc-platform-001` 에 7 commits 대기. Phase 5 에서 BE PR 생성 예정.
- **다음 액션**: Group 002 (app-001/002/003/004) 계약/구현/평가 루프 시작.
