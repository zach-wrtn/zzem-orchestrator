# Group 003 Sprint Contract — App Features

> Sprint: `ugc-platform-001` · Group: 003 · Owner: FE Engineer · Evaluator: Evaluator teammate
> 선행 PASS: Group 001 (Backend), Group 002 (App Foundation). 본 그룹은 Group 002 위에 프로필 편집 / 타유저 프로필 / 프로필 공유 / 프로필 → SwipeFeed 네 기능을 쌓는다.

## Scope

| Task | 파일 | 요약 |
|------|------|------|
| app-005 | `tasks/app/005-profile-edit.md` | ProfileEditScreen (이미지 + 닉네임), `zzem://profile/edit` |
| app-006 | `tasks/app/006-other-user-profile.md` | OtherUserProfileScreen, `zzem://profile/:userId`, 게시물(공개) 단일 탭 |
| app-007 | `tasks/app/007-profile-share.md` | 프로필 공유 (OS 공유 시트 + `buildProfileShareUrl`) |
| app-008 | `tasks/app/008-profile-to-swipe-feed.md` | SwipeFeed `source` param 도입 (me/public, me/private, user/:id) |

## Ground Rules — 캐노니컬 (태스크 파일보다 우선)

1. **DRIFT-02 카운트 라벨** — `팔로워 / 팔로잉 / 재생성된`. app-006 타유저 프로필 카운트 라벨도 동일 3종. 다른 라벨 금지. 본인/타인 화면 모두 `profile-count-row.tsx` 재사용 (Group 002 `profile-count-row.tsx:21-44` 참조).
2. **타유저 단일 탭** — app-006 은 "게시물" 단일 탭만 노출. 비공개 / 좋아요 탭 **금지**. Group 002 의 `profile-tab-bar.tsx` 는 3 탭 전용이면 재사용 불가 — 구조 재사용 시 `tabs` prop 로 파라미터화하거나 별도 `OtherUserTabBar` 신설 중 택일 (FE Engineer 판단). 라벨은 "게시물".
3. **타유저 더보기 메뉴** — "프로필 URL 복사" **단일 항목**. 차단 / 신고 항목 금지 (PRD 3 소관). Clipboard 값은 `zzem://profile/{userId}`.
4. **프로필 공유 URL** — 본인 프로필 공유는 `zzem://profile/{myUserId}` 딥링크 문자열만 사용. OG image / image attachment 파라미터 **금지**. 웹 브릿지 URL 존재 시 `useNativeShare` 의 `url`/`message` 경로만 사용.
5. **SwipeFeed params — discriminated union (Round 2 REVISED)**. 현재 `SwipeFeed` 라우트는 `{ targetId, type, entryPoint, initialIndex? }` **3 필수 + 1 옵션** 구조이며 "추천 풀" queryFn 은 존재하지 않음 (`route.types.ts:130-135`, `meme.usecase.ts:452-492` — 실제 피드는 targetId+type 기반). 따라서 `source` 를 **추가적 대체 param set** 으로 도입하되, 기존 triple 을 잃지 않도록 **discriminated union** 으로 정의:
   ```ts
   type SwipeFeedParams =
     | { targetId: string; type: MemeDTO.FeedContentType; initialIndex?: number; entryPoint: ... } // legacy (필수)
     | { source: ProfileFeedSource; initialContentId?: string };                                 // new profile 경로
   type ProfileFeedSource =
     | { kind: 'me'; visibility: 'public' | 'private' }
     | { kind: 'user'; userId: string };
   ```
   `filter-list-item.tsx:32`, `trending-filter-section-item.tsx:31` legacy callsite 2곳은 **건드리지 않음** — 기존 payload 그대로 호환. `profile-content-item.tsx` **만** 새 variant 로 migrate. `swipe-feed.yaml` 기존 flow (`targetId + entryPoint`) 는 legacy variant 를 타므로 회귀 없음. SwipeFeed 스크린 내부에서 `"source" in params` narrowing 으로 분기.
6. **좋아요 탭 진입 금지** — Phase 1 에서 좋아요 탭은 빈 상태 → SwipeFeed 진입 엔트리 없음 (app-008 AC 에 명시). 그리드 아이템 onPress 는 공개 / 비공개 탭에서만 활성.
7. **닉네임 경계** — FE 검증 `2 ≤ length ≤ 20`. BE 400 방지 위해 FE 가 선제 차단. 글자수 카운터 (`n/20`) 필수.
8. **비밀번호 / 탈퇴 Settings** — app-005 scope 외. Settings 화면 `계정 → 프로필 편집` 진입점은 본 그룹 app-005 에서 **신규 배선 금지** — 본인 프로필 화면 "프로필 편집" 버튼만 진입점. (Settings 계정 섹션의 프로필 편집 진입은 별도 후속 스프린트 대상.)

## Done Criteria (task-wise)

### §app-005 · ProfileEditScreen

- [ ] `app/apps/MemeApp/src/presentation/profile/edit/` 하위에 `profile-edit.screen.tsx` + 관련 컴포넌트. 라우트 이름 `ProfileEdit` (RootStack 또는 Profile stack — 기존 관례 준수). Deep link: `zzem://profile/edit`.
- [ ] 진입점: `profile.screen.tsx` 의 "프로필 편집" 버튼 onPress → `navigation.navigate("ProfileEdit")`. 중복 진입점 금지.
- [ ] 헤더: 타이틀 "프로필 편집" + 좌측 back + 우측 "저장" 버튼. 닉네임 `< 2` 또는 `> 20` 시 저장 버튼 비활성 + 인라인 에러.
- [ ] 이미지 영역: 현재 `profileImageUrl` 표시 + "변경" 액션 → ActionSheet (카메라 / 앨범). `image-library.ts::takePhoto` / `pickImageFromLibrary` 재사용. 필요 시 `image-cropper.screen.tsx` 크롭 경유.
- [ ] Presigned URL 업로드 → `fileUuid` 획득. 업로드 진행 중 저장 버튼 비활성 + 스피너. 실패 시 에러 토스트 + 버튼 복귀.
- [ ] 닉네임 인풋: `TextInput` + 실시간 글자 카운트 (`n/20`). maxLength 하드 제한 20.
- [ ] 저장: `PATCH /v2/me/profile` body `{ nickname?, profileImageFileUuid? }`. 변경되지 않은 필드는 body 에서 제외 (partial update). 성공 시 `invalidateQueries(profile.query-key.my())` + back navigation + "프로필이 업데이트 되었어요" 토스트.
- [ ] 취소 / back → 변경사항 무시. confirm dialog 불필요 (PRD 미명시).
- [ ] Maestro `profile-edit.yaml` 신규 — deeplink 진입 + 닉네임 inputText + 저장 assertVisible.
- [ ] Unit: 닉네임 validator 경계 (1/2/20/21 자).

### §app-006 · OtherUserProfileScreen

- [ ] `app/apps/MemeApp/src/presentation/profile/other/` 하위에 `other-user-profile.screen.tsx`. 라우트 이름 `OtherUserProfile`.
- [ ] **Deeplink landing**: `home-routes.ts:26-33` 의 `ProfileTab` 은 현재 `profile/:userId?` 를 MY `ProfileScreen` 으로 랜딩. app-006 은 **MY ProfileScreen 에서 `userId` route param 유무로 분기** 하거나, **별도 screen 등록 + path 재배선** 중 택일:
  - **권장 (최소 변경)**: `profile.screen.tsx` 진입 시 `route.params?.userId` 가 현재 로그인 userId 와 다르면 `navigation.replace('OtherUserProfile', { userId })`. `OtherUserProfile` 을 Profile stack 또는 Root stack 에 신규 등록. `home-routes.ts` 는 수정 불필요.
  - 대안: `home-routes.ts::ProfileTab.parse` 에서 userId 유무 분기하여 초기 screen 결정 (React Navigation linking config 한계 주의).
- [ ] 헤더: 좌측 back + 우측 더보기(…). 더보기 ActionSheet `"프로필 URL 복사"` 단일 항목. Copy 성공 시 "프로필 URL이 복사되었어요" 토스트.
- [ ] 프로필 정보: 이미지 / 닉네임 / 팔로워·팔로잉·재생성된. `profile-header.tsx` / `profile-count-row.tsx` 컴포넌트 재사용 (본인 / 타인 양쪽에서 사용 가능한 구조로 — 기존 구현이 `isPersona` 에 의존하면 옵셔널화 필요).
- [ ] 탭: **게시물 단일 탭**. 비공개 / 좋아요 탭 렌더 금지. `profile-tab-bar.tsx:33-55` 가 `TAB_SPECS` 하드코딩 3-entry 이므로 **Evaluator 권장은 별도 경량 컴포넌트 (`OtherUserTabBar` 또는 인라인 headerbar) 신설** — 기존 TabBar 의 `TestIds.profile.tabs.*` / `ProfileLandingTab` 타입을 수정하지 않고 blast radius 최소화.
- [ ] 탭 콘텐츠: `GET /v2/users/{userId}/contents` 공개 콘텐츠 그리드. Cursor pagination (FE 커서 재래핑 금지, `{list, nextCursor}` passthrough).
- [ ] 그리드 아이템 onPress → `navigation.navigate('SwipeFeed', { source: { kind: 'user', userId }, initialContentId })` (app-008 연계).
- [ ] 404 (`GET /users/:userId/profile` 응답) → 기존 `ErrorNotFoundScreen` 또는 인라인 에러 컴포넌트 표시. crash 금지.
- [ ] 차단 / 신고 메뉴 금지 (Ground Rule 3).
- [ ] Maestro `other-user-profile.yaml` 신규 — seed userId deeplink → 프로필 + 공개 탭 + 그리드 아이템 assertVisible.

### §app-007 · Profile Share

- [ ] `shared/lib/url/profile-share-url.ts` 신규: `buildProfileShareUrl(userId: string): string` 순수 함수. 반환: `"zzem://profile/{userId}"`.
- [ ] `shared/hooks/useShareMyProfile.ts` 신규: `useNativeShare` 래핑. 반환 시그니처 `() => Promise<void>` (내부에서 myUserId 를 `useGetMyProfileUseCase` 로 획득 후 `buildProfileShareUrl(myProfile.id)` 조립). image / file attachment 파라미터 미사용.
- [ ] **Edit site (pinned)**: Group 002 가 이미 `profile-action-buttons.tsx:31-36` 에 공유 버튼 + `onPressShare` prop + testID 를 배치해둠. `profile.screen.tsx:64-66` 의 `handlePressShare` **빈 핸들러** 가 정확한 편집 포인트. app-007 은 해당 핸들러 body 를 `useShareMyProfile()` 반환값 호출로 치환. **신규 버튼 추가 금지, 두번째 share hook 금지, `onPressShare` prop 인터페이스 미변경.**
- [ ] 공유 시트 취소 시 에러 토스트 미노출 (`useNativeShare` 의 cancel 반환값을 swallow).
- [ ] Unit: `buildProfileShareUrl('abc123')` === `'zzem://profile/abc123'`. 빈 문자열 / 특수문자 (`":"`, `"/"`) 포함 시 동작 확인 (최소 2 케이스).
- [ ] Maestro: **Deferred** (native sheet 자동화 불가). 단 `useShareMyProfile` 이 ProfileScreen 에서 import + onPress 연결됨을 Evaluator 코드 추적으로 검증.

### §app-008 · SwipeFeed source param

- [ ] `shared/routes/route.types.ts::SwipeFeed` 타입을 Ground Rule 5 의 **discriminated union** 으로 교체. `ProfileFeedSource` union 은 `shared/routes/` 에 함께 정의 (기존 route.types 가 같은 위치에 있으므로 import 순환 회피).
- [ ] SwipeFeed screen 내부 분기 (`"source" in params` narrowing):
  - **legacy variant** (`targetId + type + entryPoint`) → **기존 queryFn 유지** (`useGetFeedSwipeUseCase` + 기존 로직 전부 그대로). 회귀 0.
  - `{ source: { kind: 'me', visibility: 'public' } }` → `GET /v2/me/contents?visibility=public`
  - `{ source: { kind: 'me', visibility: 'private' } }` → `GET /v2/me/contents?visibility=private`
  - `{ source: { kind: 'user', userId } }` → `GET /v2/users/{userId}/contents`
  - 신규 variant 전용 queryFn 을 factory 함수로 캡슐화 (`createProfileFeedQuery(source)`) 권장.
- [ ] `initialContentId` 가 응답 list 에 존재하면 해당 인덱스부터 렌더. 기존 SwipeFeed 의 `initialIndex` 패턴 참조해 신규 variant 에서도 동일 UX.
- [ ] 커서 페이지네이션 `nextCursor` passthrough — FE 재래핑 금지 (KB correctness-001 FE 적용).
- [ ] **ProfileContentGrid / ProfileContentItem 에 `tab` prop 추가** — `ProfileTabContent` (`profile.screen.tsx:103-118`) 에서 `tab: 'public' | 'private'` 으로 narrowing 해 하위로 전달. `tab === 'liked'` 일 때 Grid 자체 렌더 안 함 (Group 002 의 empty state 로 이미 guard 되지만 명시적 prop-level 차단). `profile-content-item.tsx:onPress` 은 `tab ∈ {'public','private'}` 때만 `navigate('SwipeFeed', { source: { kind: 'me', visibility: tab }, initialContentId: item.id })` 호출.
- [ ] Navigation callsites (명시):
  - `profile-content-item.tsx` (본인) — 위 prop-gated 방식으로 migrate (Ground Rule 6 준수).
  - `other-user-profile` 그리드 아이템 — `navigate('SwipeFeed', { source: { kind: 'user', userId }, initialContentId })`.
  - **건드리지 않는 legacy callsite** (회귀 금지): `filter-list-item.tsx:32`, `trending-filter-section-item.tsx:31` — 기존 legacy variant payload 유지.
- [ ] Maestro `profile-to-swipe-feed.yaml` 신규 — 공개 탭 첫 아이템 tap → SwipeFeed 첫 아이템 id assertVisible (Group 003 스모크 게이트).

## KB Contract Clauses

| Clause | Scope | 적용 방식 |
|--------|-------|----------|
| correctness-001 (critical) | app-005 / app-006 / app-008 | FE 가 `{list, nextCursor}` 를 재래핑하지 않는지. `new CursorResponse`, `{items: ...}` 등 field rename 금지. |
| completeness-001 (critical) | app-005 / app-006 | `ProfileEdit`, `OtherUserProfile` 라우트가 실제 라우터 등록 + deep link parse 로 랜딩 가능한지. 데드 route 금지. |
| completeness-002 (major) | app-005 / app-007 / app-008 | `useUpdateMyProfileUseCase`, `useShareMyProfile`, source-aware SwipeFeed query 훅이 **실제 호출** 되는지. 미사용 export 금지. |
| completeness-003 (major) | app-008 | `SwipeFeed` param (`source`, `initialContentId`) 추가 시 **모든 navigate 호출부** 에서 param 호환 전달. 기존 홈 경로 payload 는 변경 없이 유지 (backward compat). |
| integration-001 (critical) | app-005 / app-006 | `UpdateProfileRequest` body 필드명 (`nickname`, `profileImageFileUuid`, `bio`, `link`) 와 `PublicProfileResponse` field 이름이 BE DTO 와 1:1. Rename 0. |

## Verification Method

- **V1 (grep)**: 캐노니컬 / KB 위반 탐지
  - V1.1 `rg "\"차단\"|\"신고\"" app/apps/MemeApp/src/presentation/profile/other/` → 0 (Ground Rule 3)
  - V1.2 `rg "new CursorResponseDto\(" app/apps/MemeApp/src/` → 0 (KB correctness-001)
  - V1.3 `rg "팔로워|팔로잉|재생성된" app/apps/MemeApp/src/presentation/profile/` → 본 그룹 callsite 는 canonical 3 라벨만
  - V1.4 `rg "useShareMyProfile" app/apps/MemeApp/src/presentation/profile/` → 최소 1 callsite (ProfileScreen)
- **V2 (routes)**: `home-routes.ts` / `route.types.ts` 에 `ProfileEdit`, `OtherUserProfile`, `SwipeFeed::source?` 등록 여부 확인.
- **V3 (typecheck)**: `yarn workspace MemeApp typescript` — `@wrtn/*` cascade 제외 신규 에러 0. 특히 SwipeFeed source union 도입이 기존 callsite 호환을 깨지 않는지.
- **V4 (unit)**:
  - `yarn jest nickname-validator` → 4 경계 케이스 (1/2/20/21).
  - `yarn jest profile-share-url` → 최소 2 케이스.
- **V5 (Maestro)**: 3 flow 구조 valid + testID 매칭
  - `profile-edit.yaml` (app-005)
  - `other-user-profile.yaml` (app-006) — AC 6.1~6.4 (프로필 정보 + 공개 탭 + 그리드 아이템 assertVisible) + **AC 7.2 URL 복사 토스트 assertVisible 도 포함** (e2e-flow-plan `:56` Extend 지침).
  - `profile-to-swipe-feed.yaml` (app-008, Group 003 스모크 게이트) — **AC 2.5 (본인 공개 → SwipeFeed) + AC 7.3 (타유저 → SwipeFeed) 양쪽 assert** 를 동일 flow 에 포함. 타유저 그리드 → SwipeFeed 진입 시 `{kind:'user'}` source 가 타는지 첫 아이템 content id 일치 검증 (e2e-flow-plan `:57` "`profile-to-swipe-feed.yaml` 확장" 노선 채택).
  - Regression: Group 002 5 flow + 기존 22 flow — selectors 유지 확인. SwipeFeed discriminated union 도입 후 `swipe-feed.yaml` (legacy variant) 가 그대로 타는지 재확인.

## Edge Cases

1. **닉네임 중복** — `PATCH /me/profile` 400 / 409 (be-002 E11000 재현 시) → 에러 토스트 + 인풋 포커스 유지.
2. **업로드 중 back** — 업로드 진행 중 back 버튼 → 업로드 cancel 또는 background 유지 (FE Engineer 판단). Crash 금지.
3. **404 타유저** — `GET /users/:userId/profile` 404 → ErrorNotFound 컴포넌트. `ContentListQuery` 는 profile query 성공 전 disabled (`enabled: !!profile`).
4. **Clipboard 실패** — `Clipboard.setString` 실패 시 에러 토스트 미노출 (iOS 거의 없음). Evaluator 코드 추적으로 try/catch 존재 확인.
5. **SwipeFeed source 미전달** — 기존 홈/추천 경로 그대로 추천 풀 쿼리. 회귀 감시 (`swipe-feed.yaml`).
6. **비로그인 `zzem://profile/:userId`** — Group 002 의 `app/apps/MemeApp/src/app/navigation/useNavigationLinking.ts:25-29` `AUTH_REQUIRED_PATHS` 는 `"profile"` 만 (own) — userId 딥링크는 오픈. 미로그인 상태로 OtherUserProfile 진입 시에도 `GET /users/:userId/*` 가 401 나지 않는 경로 (LibUserGuard 는 `wrtn-user-id` 헤더 — 비회원도 익명 id 주입) 이므로 정상 동작 가정.

## Business Rule Traps

| Trap | 확인 |
|------|------|
| 1. 카운트 라벨 `팔로워 / 팔로잉 / 재생성된` (본인 + 타인 동일) | `profile-count-row.tsx` 재사용 시 자동 충족. 타인 화면에서 별도 하드코딩 금지. |
| 2. 타유저 탭 = 게시물 단일 | Ground Rule 2. `other-user-profile.screen.tsx` 탭 개수 1 확인. |
| 3. 타유저 더보기 = URL 복사 단일 | Ground Rule 3. ActionSheet item 1개 확인. |
| 4. 공유 URL = `zzem://profile/:userId` | `buildProfileShareUrl` 순수 함수 + unit test. OG image / image attachment 미사용. |
| 5. SwipeFeed source union 3 kind | Ground Rule 5. `undefined` 시 기존 추천 쿼리 유지. |
| 6. 좋아요 탭 SwipeFeed 진입 엔트리 없음 | `profile-content-item.tsx` 가 현재 탭이 `liked` 일 때 onPress 비활성 또는 조건 분기. (Group 002 현황: 좋아요 탭 empty state — item render 0 이므로 자연 비활성. 명시적 조건 추가는 옵셔널.) |
| 7. `@Length(2,20)` FE 선제 차단 | 21자 이상 인풋 `maxLength={20}` 로 하드 차단 + 1자 시 저장 비활성. BE 400 도달 방지. |
| 8. 프로필 편집 진입점 중복 금지 | Ground Rule 8. Settings → 계정 → "프로필 편집" 배선은 본 그룹 금지. |

## Regression Guard

- Group 002 5 flow (`bottom-tab-nav`, `explore-tab`, `my-profile-default-landing`, `settings-menu-full`, `home-to-settings`) 로컬 실행 green 유지.
- `swipe-feed.yaml` (`targetId + entryPoint=filter_preview`) — SwipeFeed legacy variant 로 동작. 회귀 0.
- `filter-list-item.tsx:32`, `trending-filter-section-item.tsx:31` — legacy payload 유지, **수정 금지**.
- `profile-content-item.tsx` 는 본 그룹에서 **신규 variant 로 migrate** — 기존 `{ targetId, type, entryPoint: "profile" }` payload 는 제거되고 `{ source, initialContentId }` 로 교체됨. (Group 002 의 해당 callsite 는 legacy 를 썼기에 이 migration 이 곧 Group 002 `profile-content-item` 업데이트이며, 본 그룹 responsibility).

## Round 2 Patches (2026-04-22, applied by Sprint Lead)

대응 — Evaluator Round 1 review `contracts/group-003-review.md` 의 Critical 1 + Major 2/3/4 + Minor 5/6.

1. **Ground Rule 5 재설계** (Critical #1): SwipeFeed 기존 route 가 `{ targetId, type, entryPoint }` 필수 구조이며 "추천 queryFn" 은 부재 — `source?` 단독 추가는 backward compat 을 깸. **Discriminated union** 으로 legacy variant + new profile variant 를 분리. Legacy callsite 2곳 (`filter-list-item`, `trending-filter-section-item`) 은 touch 금지. `profile-content-item` 만 migrate.
2. **app-008 Done Criterion 추가** (Major #2): `ProfileContentGrid` + `ProfileContentItem` 이 `tab: 'public' | 'private'` prop 을 받아 `ProfileTabContent` 로부터 threading. `tab === 'liked'` 는 Grid 자체 렌더 차단. Ground Rule 6 명시 강화.
3. **app-007 Edit site 핀** (Major #3): `profile.screen.tsx:64-66` `handlePressShare` 빈 핸들러가 정확한 편집 위치. `useGetMyProfileUseCase` 로 `myProfile.id` 획득 + `buildProfileShareUrl` 조립. 신규 버튼 금지 / 두번째 share hook 금지 / `onPressShare` prop 미변경.
4. **V5 Maestro 확장** (Major #4): `other-user-profile.yaml` 에 AC 7.2 URL 복사 토스트 assert 포함. `profile-to-swipe-feed.yaml` 에 AC 7.3 타유저 → SwipeFeed 경로 assert 포함 (동일 flow 확장, 4번째 flow 신설 X).
5. **app-006 랜딩 방식** (Major 대응 확장): `home-routes.ts` 는 ProfileTab 이 `profile/:userId?` 를 소유함 — `profile.screen.tsx` 에서 `route.params?.userId !== myUserId` 분기 → `navigation.replace('OtherUserProfile', { userId })`. `OtherUserProfile` 은 별도 screen 으로 등록. home-routes 수정 불필요.
6. **app-006 tab UI** (Minor #5): 기존 `profile-tab-bar.tsx:33-55` 하드코딩 3 tab → **별도 `OtherUserTabBar` 또는 인라인 single-tab headerbar 신설** 권장. blast radius 최소화.
7. **Edge Case 6 cite 정정** (Minor #6): `app/navigation/useNavigationLinking.ts:25-29` 로 path 명시.

## Sign-off

- [x] Evaluator Round 1 review — APPROVE with revisions (2026-04-22).
- [x] Evaluator Round 2 re-review — 7 패치 전부 clean 검증 → APPROVE (2026-04-22).
- [x] FE Engineer 착수 허가 (2026-04-22).
