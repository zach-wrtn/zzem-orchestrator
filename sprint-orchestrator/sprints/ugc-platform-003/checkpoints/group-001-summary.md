# Group 001 Summary: ugc-platform-003

**Date**: 2026-04-23
**Result**: PASS / ACCEPTED (Round 2)
**Fix loops**: 1

## Scope
- Tasks: be-001, app-001, app-002
- Endpoints: POST/DELETE `/v2/users/:id/follows`, GET `/v2/me/followers`, GET `/v2/me/following`, GET `/v2/users/:id/follow-state`

## Key Artifacts (for Group 002+ reference)

### Public API exposed by Group 001 (consumed by Group 002)

| Artifact | Location | Consumer |
|----------|----------|----------|
| `UserFollowDomainService.rollbackFollowByPair(a, b)` | `domain/user-follow/user-follow-domain.service.ts` | Group 002 be-002 (block write-path) |
| `BlockRelationPort` DI token + `isBlockedEither(a, b): Promise<boolean>` | `domain/user-follow/block-relation.port.ts` | Group 002 be-002 provides real impl (overrides `NoopBlockRelationPort`) |
| `EVENT_TYPE.FOLLOW_CREATED` + payload `{actorUserId, targetUserId, followId, shouldNotify, createdAt}` | `common/constant/event-constant.ts` | Group 003 be-004 FollowNotificationListener |

### Helpful references (reuse patterns)

- Cursor encoding: `application/user-follow/user-follow-app.service.ts:62-115` `buildListResponse` (after M1 fix — uses `page[limit]` extra item). Pattern: `hasNext = page.length > limit; extraItem = hasNext ? page[limit] : null`.
- E2E yaml canonical appId: `com.wrtn.zzem.dev`.

## Issues Found & Resolved

| # | Severity | Issue | Resolution | Commit |
|---|----------|-------|-----------|--------|
| M1 | Major | `buildListResponse` 가 `truncated[limit-1]` (last shown) 을 cursor 로 → createdAt tie 시 중복 | `page[limit]` (extra item) 으로 교정 | `476364e3` |
| M2 | Major | E2E yaml 2개 `appId: io.wrtn.meme` (canonical 불일치) | `com.wrtn.zzem.dev` 로 교체 | `a1ae7ca18` |

## Minor Deferred (retrospective 이월)

1. **Nickname ASC 정렬 (AC 6.2)**: BE 현재 `createdAt DESC`. Contract AC 는 가나다순. TODO 주석 존재. → 후속 스프린트 또는 Group 002 의 Contract 에 추가 검토.
2. **Persona nickname fallback** (`profile.nickname ?? profile.name`): 의도적 persona display fallback. KB completeness-008 경계에 근접. `displayName(profile)` helper 로 encapsulate 권장.
3. **Contract deviation — UserPublicProfile 확장 조항 미이행**: Contract 가 `/v2/users/:id/profile` 에 followState/isBlocked 추가를 언급했으나 실제 endpoint 확장 없음. 기능상 `follow-state` endpoint 로 동등 제공 — Contract 문구 retrospective 반영.
4. **follow-button-tap.yaml seed drift 위험**: 초기 "팔로우" 상태 가정 — e2e-seed-plan.md 에 NONE seed 명시. 주석 보강 권장.

## Lessons for Next Group (Group 002 Contract drafting 시 선제 반영 필수)

1. **Cursor encoding 명시**: Done Criteria 에 "`page[limit]` extra item 을 cursor 로 인코딩 (reference: `me-contents-app.service.ts:buildLikedListResponse` / Group 001 `buildListResponse`)" 조항 추가. formal grep 게이트 (`$lt` 0 hit) 로만 검증 불가 — reference 파일 지정 필수.
2. **E2E appId 검증**: 신규 flow yaml 작성 시 canonical `com.wrtn.zzem.dev` 사용. grep 게이트: `rg '^appId:' app/apps/MemeApp/e2e/flows | awk '{print $2}' | sort -u | wc -l → 1`.
3. **Contract field-level 확장 조항에 파일 경로 명시**: "X 응답에 필드 추가" 언급 시 `backend/.../dto/xxx-response.dto.ts` 수준의 구체 경로 지정. Group 002 의 `UserPublicProfile.isBlocked` 필드 추가 명확화 — 파일 경로 + 응답 필드 name 지정.
4. **Persona fallback 공식 규정 (optional)**: Group 002 에서 `displayName(profile)` helper 도입 검토. 아니면 명시적 `profile.nickname ?? profile.displayName` 주석 의무.
5. **Cross-path cleanup 의무 (integration-002)**: be-002 가 UserFollow 양방향 해제 시 반드시 `rollbackFollowByPair` 호출 — 직접 `UserFollow.deleteMany` 금지. grep 게이트.
6. **Mapper fallback 의도 분류**: `?? / ||` 패턴 중 persona display 같이 의도된 fallback 은 예외 허용 + 주석 의무. Contract 에 명시.

## Files Changed (both repos, sprint/ugc-platform-003)

### backend (commits bc624d43, 476364e3)
- `persistence/user-follow/*` (schema, repository, module, barrel)
- `domain/user-follow/*` (domain service, block-relation port + noop, follow-state enum, event, module, spec)
- `application/user-follow/*` (app service, 4 DTOs, module)
- `controller/user-follow/*` (me-follow controller, user-follows controller, module)
- `common/constant/event-constant.ts` (+ FOLLOW_CREATED)
- `controller/controller.module.ts` (register UserFollowControllerModule)
- `domain/user-profile/user-profile-domain.service.ts` (+ findByUserIds batch)

### app (commit bc624d43의 app-side, a1ae7ca18)
- `domain/follow/*` (entity, repository interface, index)
- `data/follow/*` (model, mapper, repository-impl, query-key, index)
- `presentation/follow/*` (follow-button, hooks [useFollowState/Mutation/Unfollow/MyFollowersInfinite/MyFollowingInfinite], follower/following list screens, row component, barrels)
- `presentation/profile/components/profile-count-row.tsx` (onPress prop 확장)
- `presentation/profile/components/profile-header.tsx` (handler 전파)
- `presentation/profile/profile.screen.tsx` (본인 context handler 주입)
- `presentation/profile/other/other-user-profile-header.tsx` (FollowButton 통합)
- `app/navigation/root-navigator.tsx` (FollowerList / FollowingList Stack.Screen)
- `app/navigation/useNavigationLinking.ts` (AUTH_REQUIRED_PATHS)
- `shared/routes/link-screens.ts`, `route.types.ts`
- `e2e/flows/follow-button-tap.yaml`, `my-profile-follower-list.yaml`, `my-profile-following-list.yaml`
- `e2e/e2e-seed-plan.md`

## Pressure Reset
Group 001 PASS → Group 002 pressure = 🟢 Normal (fix_loop_count reset).
