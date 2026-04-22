# Group 003 Checkpoint — ugc-platform-001 (App Features)

> Phase 5 (PR) 는 본 파일을 우선 참조. 원본 contract/evaluation 은 이슈 재현 시에만 Read.

## Verdict

**PASS** (2026-04-22) — Evaluator Round 1 PASS with follow-ups + FE Fix Round 1 (Major #1 + Minor #2 해소) + Sprint Lead 검증 완료.

## Scope

app-005 ~ app-008: ProfileEdit (이미지+닉네임) + OtherUserProfile (공개 그리드) + useShareMyProfile (OS 공유 시트) + SwipeFeed discriminated union (profile variant).

## Commits on `sprint/ugc-platform-001`

| SHA | Task | 내용 |
|-----|------|------|
| `a0db4babd` | app-007 | `useShareMyProfile` + `buildProfileShareUrl` + handlePressShare 배선 + unit 3 케이스 |
| `a3a1ed60d` | app-008 | SwipeFeed discriminated union (`route.types.ts:150-160`) + `useGetProfileSwipeFeedUseCase` + `/v2/users/:id/contents` 통합 |
| `704c7fd9d` | app-006 | `OtherUserProfileScreen` + deeplink branching (`profile.screen.tsx` → `tabNavigation.replace('OtherUserProfile')`) + URL 복사 단일 메뉴 + tab-bar 없는 그리드 단일 노출 (prototype spec 일치) |
| `71f27cfe8` | app-005 | `ProfileEditScreen` + image picker sheet + presigned upload + nickname-validator 유닛 (1/2/20/21 + empty + constants = 6 케이스 + 기본 3 = 9 pass) |
| `6547c64d7` | app-008 | `profile-to-swipe-feed.yaml` 확장 — AC 2.5 본인 + AC 7.3 타유저 모두 검증 |
| `ce9d346c6` | fix R1 | SwipeFeed queryFn `enabled` gate — legacy/profile variant 별 단일 fire |
| `ada802991` | fix R1 | OtherUserProfile `useGetUserContentsUseCase` `enabled: !!userProfile` 가드 |

7 commits total.

## 주요 결정 / 트랩 해결

| 항목 | 결정 |
|------|------|
| **SwipeFeed param 구조** | Discriminated union. `{ targetId, type, entryPoint, initialIndex? }` (legacy) \| `{ source: ProfileFeedSource, initialContentId? }` (profile). Legacy callsite 2곳 (`filter-list-item:32`, `trending-filter-section-item:31`) touch 금지. `profile-content-item` 만 migrate. `"source" in params` narrowing 으로 분기. |
| **SwipeFeed queryFn 실행 원칙** | Hooks-rule 준수 위해 두 hook 모두 호출하되, `enabled` option 으로 variant 별 fire. 기본값 `true` 로 backward compat 유지. |
| **OtherUserProfile 라우팅** | `home-routes.ts::ProfileTab` 이 `profile/:userId?` 를 소유 — `profile.screen.tsx` effect 에서 `routeUserId !== myProfile.userId` → `tabNavigation.replace('OtherUserProfile', { userId })`. `OtherUserProfile` 은 root stack 별도 screen. `home-routes.ts` 미수정. |
| **OtherUserProfile UI 해석** | Ground Rule 2 "게시물 단일 탭 노출" + Round 2 Patch 6 "OtherUserTabBar 권장" 는 **non-binding**. Prototype `OtherUserProfileScreen.spec.md:289` "NO tab-bar. Grid renders directly" 가 SSOT. → 탭바 생략, 그리드 직접 렌더. Evaluator Non-issue 판정. |
| **useShareMyProfile 편집 위치** | `profile.screen.tsx:handlePressShare` 빈 핸들러 body 에 `useShareMyProfile()` 반환값 호출. 신규 버튼 없음. `useGetMyProfileUseCase` 로 `myProfile.id` 획득. |
| **공유 URL 형태** | `zzem://profile/{userId}`. OG image / file attachment 파라미터 사용 금지 (`useNativeShare` 의 `url`/`message` 경로만). |
| **닉네임 FE 선제 차단** | `maxLength={20}` 하드 제한 + `canSave = length >= 2 && length <= 20`. `n/20` 실시간 카운터. BE `@Length(2,20)` 400 방지. |
| **이미지 업로드 feature name** | `gen_meme_user_input` 재사용 (FileAppService 가 uuid 존재성만 검증). FeatureName 타입 미확장. |
| **Clipboard** | `react-native` 의 Clipboard API 사용. deprecated 경고 있으나 본 스프린트 scope 외 (Minor #3 follow-up). |
| **tab prop threading** | `ProfileContentGrid` + `ProfileContentItem` 에 `tab: 'public' \| 'private'`. `ProfileTabContent` 에서 narrowing 해 전달. `tab === 'liked'` 시 Grid 자체 렌더 차단 (Ground Rule 6). |

## KB Clauses 검증 결과

- **correctness-001** (critical): `new CursorResponseDto(` FE 소비처 0건. `{list, nextCursor}` passthrough 유지. **PASS**.
- **completeness-001** (critical): `ProfileEdit`, `OtherUserProfile` 라우트 등록 + deeplink 랜딩 검증. 데드 route 0. **PASS**.
- **completeness-002** (major): `useUpdateMyProfileUseCase`, `useShareMyProfile`, `useGetUserContentsUseCase`, `useGetProfileSwipeFeedUseCase` 실제 호출 확인. **PASS**.
- **completeness-003** (major): SwipeFeed discriminated union + 모든 callsite 호환 (legacy 2, profile 2 신규). **PASS**.
- **integration-001** (critical): `UpdateProfileRequest` body 필드 (`nickname`, `profileImageFileUuid`, `bio?`, `link?`) + `PublicProfileResponse` field 이름 BE DTO 와 1:1. **PASS**.

## Unit 테스트 & Maestro

| 파일 | 결과 |
|------|------|
| `nickname-validator.test.ts` | 9/9 PASS (1/2/20/21 경계 + empty + constants + 기본 3 케이스) |
| `profile-share-url.test.ts` | 3/3 PASS |
| `profile-edit.yaml` | YAML valid, 진입 버튼 tap + deeplink 재진입 |
| `other-user-profile.yaml` | YAML valid, 프로필 + 공개 그리드 + URL 복사 토스트 assertVisible |
| `profile-to-swipe-feed.yaml` | YAML valid, AC 2.5 본인 공개 + AC 7.3 타유저 SwipeFeed 양쪽 검증 |

## Typecheck

- 신규 에러 0 (`yarn workspace MemeApp typescript` — `@wrtn/*` cascade 면제).
- Fix Round 1 전/후 동일 (264 pre-existing, 0 new).

## Pressure 현황

- Total fix iterations: 1 (FE Round 1 — Major #1 + Minor #2 합병 해소).
- 소진된 fix loop budget: 1/2. Round 2 여유.
- Pressure 레벨: 🟡 Caution (fix 1회 진입) → 해소 후 회복.

## Phase 5 진입 준비

- **블록 해소**: Group 001 (BE) + Group 002 (App Foundation) + Group 003 (App Features) 모두 PASS.
- **브랜치**: `sprint/ugc-platform-001` 에 BE 7 commits + App 13 commits (Group 002/003 통합) 대기.
- **다음 액션**: Phase 5 PR — backend PR + app PR 2개 생성. PRD 3 canonical 과 차이점 (follow 기능 미구현, 차단/신고 미구현, 알림/고객센터 placeholder) 은 PR 본문에 명시.
- **PR 본문 필수 포함**:
  - 각 Group 의 scope + commit 범위
  - 미구현 follow-up (Minor #3 Clipboard migration, Minor #4 initialContentId fallback)
  - Evaluator 검증 경로 (evaluations/ + checkpoints/)
  - Figma 캐노니컬 리비전 참조 (Phase 3 approved 프로토타입)