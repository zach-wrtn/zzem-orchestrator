# Evaluation: group-001 — Follow

- Evaluator: Independent
- Verdict: ISSUES
- Round: 1
- Date: 2026-04-23

## Summary

be-001 도메인/컨트롤러, app-001 FollowButton, app-002 리스트 화면 전부 구조적으로 정상 구현되고 AC 대부분 충족. 단, (1) cursor pagination 이 KB correctness-004 reference 규약 (extra item 을 cursor 로) 에서 이탈해 createdAt tie 시 중복 행 발생, (2) my-profile-{follower,following}-list.yaml E2E flow 의 appId 가 기존 flow 들과 불일치 (`io.wrtn.meme` vs canonical `com.wrtn.zzem.dev`) 로 실행 자체 불가. Major 2건 — fix loop 필요.

## Critical (block merge)

None

## Major (fix loop required)

| # | Task | Issue | File:Line | Repro | Recommendation |
|---|------|-------|-----------|-------|----------------|
| M1 | be-001 | **Cursor 규약 이탈** — `buildListResponse` 가 `cursorItems[limit]` (extra item) 대신 `truncated[limit-1]` (마지막 표시 item) 를 cursor 로 인코딩. `_id: $lte` 와 결합 시 createdAt tie 케이스에서 page boundary 중복. reference (`me-contents-app.service.ts:105`) 는 `cursorItems[limit]` (extra) 를 사용. KB correctness-004 규약은 extra item 기반 `$lte` 전제. | `backend/apps/meme-api/src/application/user-follow/user-follow-app.service.ts:69-110` | seed createdAt 동일한 follow 3건 (A, B, C, _id A<B<C) + limit=2 → page1: [C,B], last=B → page2 query `_id: $lte: B._id` + `createdAt=B.createdAt` → page2: [B, A] (B 중복) | `last = page[limit]` (extra item) 로 변경. `buildListResponse` 가 `page` (limit+1 반환) 를 받으므로 `hasNext = page.length > limit` 조건 하에 `extraItem = page[limit]` 를 cursor 인코딩 대상으로 사용. reference 패턴 복제. |
| M2 | app-002 | **E2E appId 불일치** — `my-profile-follower-list.yaml` / `my-profile-following-list.yaml` 의 `appId: io.wrtn.meme` 이 기존 flows (30+개) 의 canonical `com.wrtn.zzem.dev` 와 불일치 → Maestro 실행 시 앱 launch 실패. `follow-button-tap.yaml` 은 `com.wrtn.zzem.dev` 로 정상. | `app/apps/MemeApp/e2e/flows/my-profile-follower-list.yaml:1`, `my-profile-following-list.yaml:1` | `maestro test e2e/flows/my-profile-follower-list.yaml` → "app not installed" | 두 yaml 의 `appId` 를 `com.wrtn.zzem.dev` 로 교체. `launchApp: clearState: true` 이후 login.yaml helper 또는 토큰 주입 필요시 추가 검토 (follow-button-tap 은 `runFlow: ../helpers/login.yaml` 사용). |

## Minor (deferred to next sprint)

- **Nickname 정렬 TODO**: `UserFollowDomainService.listFollowersWithCursor` / `listFollowingWithCursor` 가 AC 6.2 의 가나다순 대신 createdAt DESC 로 구현 (task 내 TODO 주석 명시). BE 가 아직 nickname ASC 미지원이므로 E2E 의 "MAESTRO_MY_FOLLOWER_NICKNAME assertVisible" 는 seed 가 단일일 때만 안정. Group 001 후속 follow-up 또는 Contract 차기 반영 필요.
- **Mapper 간 persona nickname fallback**: `user-follow-app.service.ts:98` `profile.nickname ?? profile.name` — persona 의 nickname=null 시 name 투영. 비즈니스 의도 (persona display) 로 타당하나 KB completeness-008 정신과 경계. Zod 는 `nickname: z.string()` 이므로 응답 필드는 유효. 주석으로 명시 보강 권장.
- **Contract UserPublicProfile 확장 누락**: Contract "UserPublicProfile 응답에 followState + isBlocked 추가 — `/v2/users/{userId}/profile` 만 확장" 언급했으나 실제 endpoint 확장 없음. FollowButton 은 `/v2/users/{userId}/follow-state` 에서 isBlocked 수신하므로 기능 동작. Contract 문구와 구현 deviation — retrospective 반영 필요.
- **follow-button-tap.yaml fallback 라벨**: 초기 seed 가 FOLLOWING 상태이면 `assertVisible: "팔로우"` 실패 가능. seed 정합성은 `e2e-seed-plan.md` 가 "NONE 상태 seed" 보장. 현 구현 기반 동작이지만 seed drift 시 flaky 위험. 주석 보강 권장.

## Regression Check

| Target | Result | Notes |
|--------|--------|-------|
| Phase 1 ProfileCountRow backward-compat | ✓ | `onPressFollowers`/`onPressFollowing` optional prop 확장. 타 유저 프로필 `OtherUserProfileHeader:56-60` 는 handler 미주입 → Pressable 대신 VStack 렌더 (accessibility role "button" 노출 방지). 본인 프로필 `ProfileHeader:64-70` handler 전파. |
| Phase 1 ProfileHeader 외형 불변 | ✓ | Prop 확장만. layout/token 변경 없음. |
| Phase 1 RootNavigator / link-screens 순서 | ✓ | FollowerList/FollowingList 가 `profile/:userId?` 동적 라우트보다 **앞에** 등록 (`link-screens.ts:14-15`). 기존 ProfileEdit 선언 순서 컨벤션 재사용. AUTH_REQUIRED_PATHS 에 `follower-list`/`following-list` 추가. |
| Phase 2 Like endpoint / PaybackEventListener | ✓ | event-constant.ts 값 추가 only (기존 enum 값 보존). EventEmitter2 공유하나 FOLLOW_CREATED 리스너 없음 (Group 003 wire-up 예약). |
| Phase 2 UserPublicProfile consumer (swipe-feed) | ✓ | `publicProfileSchema` 미변경. 신규 field 없음 → tolerant. Group 002 에서 확장 예정. |

## KB Pattern Gates (active trace)

| Pattern | Result | Notes |
|---------|--------|-------|
| completeness-008 (mapper fallback) | ⚠ | 직접 `?? 0 / ?? false / \|\| ""` grep 0 hit. BUT `user-follow-app.service.ts:98` `profile.nickname ?? profile.name` 는 패턴 유사. 의도적 persona display — Minor 로 분류. Zod 는 nickname required string 이므로 응답 계약 무결. |
| completeness-009 (dead hook) | ✓ | `useFollowState`/`useFollowMutation`/`useUnfollowMutation`/`useMyFollowersInfinite`/`useMyFollowingInfinite` 각 정의 1 + 실제 callsite ≥ 1 (각 hook 확인). `rollbackFollowByPair` 정의 1 + spec 2 callsites (≥2). `followUser`/`unfollowUser`/`listMyFollowers`/`listMyFollowing`/`getFollowState` 정의 + controller callsite + app service callsite 각 ≥3 hit. |
| completeness-010 (cross-component) | ⚠ | `ProfileCountRow` prop 확장 callsite 2곳 (ProfileHeader 전파 + OtherUserProfileHeader 미주입) 전수 처리. `UserPublicProfile` 에 followState/isBlocked 추가 명시 Contract 조항 미이행 (endpoint 미확장). FollowButton 이 follow-state 로 isBlocked 수신하므로 기능상 동등하나 Contract deviation → Minor. |
| correctness-004 (cursor $lte) | ✗ | grep `_id:\s*\{\s*\$lt\s*:` 는 0 hit (formal gate 통과) 이나 **semantic 위반**: reference 는 `cursorItems[limit]` (extra item) 기반 $lte 조합인데 본 구현은 last-shown 기반 → tie 케이스 중복. M1 참조. |

## Lessons for Next Group (Group 002)

- **Cursor encoding convention 명시 필수**: KB correctness-004 는 `$lt`/`$lte` 연산자만 다루나, "cursor item 선택 (extra vs last-shown)" 은 별도 축. Group 002 block list / Group 003 notification list Contract 에 "`cursorItems[limit]` (extra item, not last-shown) 를 cursor 로 인코딩" 조항 추가. reference: `me-contents-app.service.ts:buildLikedListResponse`.
- **E2E appId canonical 값 표준화**: 신규 .yaml 작성 시 기존 flows grep 으로 canonical appId 확인 필수 (`com.wrtn.zzem.dev`). Contract "E2E flows 명시" 조항에 "appId 기존 flow 들과 일치 필수" 명시. grep 게이트: `rg '^appId:' e2e/flows | awk '{print $2}' | sort -u | wc -l` → 1.
- **Contract field-level 확장 조항은 파일 경로 지정**: "UserPublicProfile 에 followState/isBlocked 추가" 는 endpoint 파일이 안 적혀 우발 누락. Done Criteria 에 `backend/apps/meme-api/src/application/user-profile/dto/public-profile-response.dto.ts` 급의 구체 파일 지정 조항으로 보강.
- **Persona nickname fallback 공식 규정**: `profile.nickname ?? profile.name` 패턴은 완전 금지 vs 허용 경계 모호. KB completeness-008 확장 또는 persona-specific display name helper (e.g. `displayName(profile)`) 로 표준화하여 fallback 의도를 명시적으로 encapsulate.
- **가나다순 정렬 TODO 공식 이월**: Group 001 이 createdAt DESC 로 임시 구현 + TODO 주석 남김. AC 6.2 "가나다순" 요구사항의 이행 그룹/태스크를 Contract 에 명시 (Group 001 후속 or Group 002 추가).

---

## Round 2 Re-Evaluation (2026-04-23)

- **Verdict**: PASS
- **Fixes verified**:
  - M1 (cursor): ✓ — `user-follow-app.service.ts:110` 가 `const extraItem = hasNext ? page[limit] : null` 로 교정. `hasNext = page.length > limit` (line 69) 이므로 `hasNext=true` 일 때 `page[limit]` 존재 보장. `hasNext=false` 일 때 `lastCursorFields=null`. reference `me-contents-app.service.ts:105` `cursorItems[limit]` (extra item) 패턴과 정확히 일치. 주석 (line 107-109) 에 KB correctness-004 규약 및 reference 명시.
  - M2 (appId): ✓ — 두 yaml 모두 `appId: com.wrtn.zzem.dev` 로 교체 확인. `grep -h '^appId:' e2e/flows/*.yaml | sort -u` = 단일 값 `com.wrtn.zzem.dev` (34개 flow 전체 canonical 통일).
- **New issues**: none
- **Regression**: ✓ — `user-follow-app.service.ts` 변경 범위는 cursor 인코딩 블록 (line 107-115) 에 국한, 그 외 `toStateDto` / `followUser` / `unfollowUser` / `getFollowState` / `listMyFollowers` / `listMyFollowing` / profile lookup / item mapping loop (line 85-105) / fallback handling 모두 불변. e2e yaml diff 는 line 1 appId 교체만 (steps/assertions/env 불변, commit `a1ae7ca18` `2 insertions(+), 2 deletions(-)`).
- **Final status**: ACCEPTED
