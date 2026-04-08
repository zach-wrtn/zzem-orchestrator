# Evaluation Report: Group 002

## Verdict: FAIL

2 issues found: 1 CRITICAL (missing feature), 1 MEDIUM (unused hook = missing feature).

## Done Criteria Verification

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| B1 | `GET /api/v1/nickname/generate` returns `{ nickname: string }` | ✅ | `nickname.controller.ts:13-18` — `@Get("generate")` returns `GenerateNicknameResponseDto` with `nickname: string` field. `nickname-app.service.ts:9` delegates to domain. |
| B2 | 닉네임 포맷: `{형용사}{동물}{4자리숫자}` | ✅ | `nickname-domain.service.ts:16` — `` `${adjective}${animal}${number}` `` where `adjective` from `NICKNAME_ADJECTIVES`, `animal` from `NICKNAME_ANIMALS`, `number` from `generateFourDigitNumber()`. Example: `빛나는고양이1234`. |
| B3 | 형용사 목록 >=20개, 동물 목록 >=20개 | ✅ | `nickname-word.constant.ts:6-27` — `NICKNAME_ADJECTIVES` has exactly 20 items. Lines 29-50 — `NICKNAME_ANIMALS` has exactly 20 items. All Korean. |
| B4 | 닉네임 길이 2~20자 이내 | ✅ | All combinations verified: shortest = `멋진곰0000` (7 chars), longest = `사랑스러운고양이0000` (12 chars). All within 2-20 range. Overflow trimming code at `nickname-domain.service.ts:19-23` is a safety net but never triggered. |
| B5 | 동일 요청 2회 호출 시 다른 닉네임 반환 (랜덤성) | ✅ | `nickname-domain.service.ts:28-29` uses `Math.floor(Math.random() * list.length)` for word selection, `Math.floor(Math.random() * 10000)` for number. 20x20x10000 = 4,000,000 combinations. Probability of collision is negligible. |
| B6 | 불쾌한 단어 미포함 | ✅ | Word lists contain only positive adjectives (빛나는, 즐거운, 행복한, etc.) and common animals (고양이, 강아지, 토끼, etc.). File header states "불쾌한 조합이 될 수 있는 단어는 사전 검수 후 제외됨". No offensive words found. |
| B7 | 인증 불필요 (Guard 미적용) | ✅ | `nickname.controller.ts:14` — `@SkipAuth()` decorator applied. No `@UseGuards()` or `@ApiLibUserAuth()` at class or method level. |
| A1 | "프로필 편집" 버튼 탭 시 편집 화면 이동 | ✅ | `profile-header.tsx:24-26` — `handleEditProfile` calls `navigation.navigate("ProfileEdit")`. `root-navigator.tsx:101` registers `<Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />`. `route.types.ts:98` declares `ProfileEdit: undefined`. |
| A2 | 프로필 이미지 탭 시 카메라/앨범 바텀시트 + "사진 삭제" 옵션 | ✅ | `profile-edit-screen.tsx:85-118` — `handleImagePress` calls `showSheet()` with "앨범에서 선택" (confirm), "카메라로 촬영" (cancel), and conditional "사진 삭제" `CenterElement` shown only when `hasImage` is true. |
| A3 | 이미지 선택 후 크롭 화면 거쳐 프로필 이미지 변경 | ✅ | `profile-edit-screen.tsx:59-67,70-79` — Both `handlePickFromLibrary` and `handleTakePhoto` navigate to `ImageCropper` with `crop: { enabled: true, aspectRatios: ["1:1"] }`. Lines 121-129 — `imageCropEventManager.subscribe("crop-complete")` updates `profileImageUrl` state. Existing `ImageCropper` component reused. |
| A4 | 닉네임 2자 미만 시 저장 버튼 비활성화 | ✅ | `profile-edit-screen.tsx:52` — `isNicknameValid = nickname.length >= NICKNAME_MIN_LENGTH` (2). Line 57 — `canSave = hasChanges && isNicknameValid && !isSaving`. Line 170 — `disabled={!canSave}`. Error message shown at line 231: "닉네임은 2자 이상 입력해주세요". |
| A5 | 닉네임 20자 초과 입력 불가 (maxLength) | ✅ | `profile-edit-screen.tsx:227` — `<Input.Solid maxLength={NICKNAME_MAX_LENGTH}>` where `NICKNAME_MAX_LENGTH = 20` (line 31). |
| A6 | 변경사항 저장 시 프로필 화면에 즉시 반영 (React Query invalidation) | ✅ | `use-profile-edit.ts:11-17` — `useMutation` with `onSuccess: () => { invalidateMyProfile() }`. `use-profile-invalidate-cache.ts:9-11` — calls `queryClient.invalidateQueries({ queryKey: profileQueryKey.getMyProfile().queryKey })`. Profile screen uses `useMyProfile` which depends on same query key → auto-refetch. |
| A7 | "프로필 공유" 버튼 → OS 공유 시트 호출 + 딥링크 URL | ✅ | `profile-header.tsx:28-30` — `handleShareProfile` calls `shareProfile(profile.id)`. `use-profile-share.ts:7-17` — calls `profileRepository.getShareUrl(profileId)` then `Share.share({ message: data.shareUrl })`. Uses React Native's `Share` API. |
| A8 | 최초 프로필 생성 시 자동 닉네임 설정 | ❌ | **NOT IMPLEMENTED**. `useGenerateNickname` hook exists at `use-generate-nickname.ts` and is exported from `hooks/index.ts`, but is **never called** anywhere. `ProfileEditScreen` does not import or use it. No logic checks for "first-time profile" to trigger auto-nickname. |
| A9 | 프로필 화면 우상단 ⚙️ 아이콘 탭 시 설정 화면 이동 | ❌ | **NOT IMPLEMENTED**. No settings icon exists in `profile-header.tsx` or `profile-screen.tsx`. `Settings` navigation is only accessible from `home-header.tsx:66` (`navigation.navigate("Settings")`). The profile screen has no route to Settings. |
| A10 | 설정 메뉴 구성 (계정/비밀번호/알림 설정/차단 관리/이용약관/개인정보/고객센터/탈퇴하기/앱버전/로그아웃) | ✅ | `auth-setting-section.tsx` — 계정 (line 29), 비밀번호 (line 33). `preparation-setting-section.tsx` — 알림 설정 (line 29), 차단 관리 (line 30). `terms-setting-section.tsx` — 서비스 이용약관 (line 44), 개인정보 처리방침 (line 48), 고객센터 (line 52). `app-info-setting-section.tsx` — 탈퇴하기 (line 21), 앱 버전 (line 26). `settings-footer.tsx` — 로그아웃 (line 54). All 10 items present. |
| A11 | "알림 설정" 탭 시 "준비 중" 표시 | ✅ | `preparation-setting-section.tsx:16-25` — `handleShowPreparation` shows bottom sheet with title "준비 중" and description "해당 기능은 현재 준비 중입니다." Applied to both 알림 설정 and 차단 관리. |
| A12 | "차단 관리" 탭 시 "준비 중" 표시 | ✅ | Same as A11 — `preparation-setting-section.tsx:30`. |
| A13 | "서비스 이용약관" / "개인정보 처리방침" 탭 시 WebView 이동 | ✅ | `terms-setting-section.tsx:21-33` — Both navigate to `"WebView"` with `POLICY_LINKS.SERVICE_TERMS` and `POLICY_LINKS.PRIVACY_POLICY` respectively. Reuses existing `WebView` screen. |
| A14 | "로그아웃" 탭 시 확인 다이얼로그 후 로그아웃 실행 | ✅ | `settings-footer.tsx:30-44` — `handleLogout` calls `show()` with title "로그아웃", description "정말 로그아웃 하시겠습니까?", confirm button "로그아웃" (preset: "warn"), cancel button "취소". On confirm calls `onUnauthenticate()`. |
| A15 | "탈퇴" 탭 시 기존 UnregisterScreen 이동 | ✅ | `app-info-setting-section.tsx:13-14` — `handlePressUnregister` calls `navigation.navigate("AuthUnregister")`. Reuses existing `AuthUnregister` screen. |

## Issues Found

| # | Severity | Description | File:Line | Suggested Fix |
|---|----------|-------------|-----------|---------------|
| 1 | **CRITICAL** | Settings navigation missing from profile screen. Contract requires "프로필 화면 우상단 ⚙️ 아이콘 탭 시 설정 화면 이동" but no settings icon exists in `ProfileHeader` or `ProfileScreen`. Settings is only accessible from HomeHeader. | `profile-header.tsx` (missing), `profile-screen.tsx` (missing) | Add a gear icon button to `ProfileHeader` (or as a `HeaderBar` right action in `ProfileScreen`) that calls `navigation.navigate("Settings")`. |
| 2 | **MEDIUM** | Auto nickname generation not implemented. `useGenerateNickname` hook is defined and exported but never called. Contract A8 says "최초 프로필 생성 시 `GET /api/v1/nickname/generate` 호출하여 자동 닉네임 설정" — the feature is wired at the data layer but not connected to any UI flow. | `profile-edit-screen.tsx` (missing usage), `use-generate-nickname.ts` (unused) | In `ProfileEditScreen`, detect first-time profile (e.g., empty name) and call `generateNickname()` to pre-fill the nickname field. Import and call `useGenerateNickname` in the screen or create a dedicated onboarding flow. |

## Edge Cases Tested

- **Nickname length boundaries**: Backend generates 7-12 char nicknames (all within 2-20). Overflow trimming at `nickname-domain.service.ts:19-23` correctly handles edge case where combination exceeds 20 chars (clips number digits), though this never occurs with current word lists.
- **Nickname number padding**: `generateFourDigitNumber()` uses `padStart(4, "0")` so numbers like 0-9 become "0000"-"0009". Correct.
- **Profile image not set**: `ProfileEditScreen` shows default gray avatar when `profileImageUrl` is empty string. "사진 삭제" option only appears when `hasImage` (length > 0). Correct.
- **Save button state**: `canSave` requires both `hasChanges` AND `isNicknameValid`. Editing nickname to < 2 chars disables save even if image changed. Correct.
- **Crop event cleanup**: `imageCropEventManager.subscribe` returns unsubscribe function used in `useEffect` cleanup. No memory leak. Correct.
- **Settings for unauthenticated user**: `SettingsBody` conditionally renders `AuthSettingSection` and `PreparationSettingSection` only when `isAuthenticated`. `SettingsFooter` shows "로그인" button for unauthenticated users. Correct.

## Architecture Compliance

- **Backend layer boundaries**: Controller → Application → Domain. `NicknameController` → `NicknameAppService` → `NicknameDomainService`. No leakage. Correct.
- **App Clean Architecture**: **COMPLIANT**. Domain layer (`domain/profile/`) contains only pure TS — no React, axios, or react-query imports. Verified by grep: zero matches for `react-query|react-native|react|axios` in `domain/profile/`. UseQuery/useMutation only in `presentation/profile/hooks/`. Group 1 lesson applied.
- **Zod entity parse**: `ProfileMapper.toMyProfileEntity` and `toProfileContentItemEntity` both use `.parse()`. Confirmed at `profile.mapper.ts:12,18`.
- **Zod nullable**: `profileContentItemEntitySchema` uses `.nullable()` for `thumbnail` and `filterTitle` fields (`profile.entity.ts:18-19`). Group 1 lesson applied.
- **DTO field names**: `ProfileDTO.ContentListResponse.items` matches backend `UserContentListResponseDto.items`. Group 1 lesson applied.
- **No double-wrapping**: Not applicable to this group (no new pagination endpoints). Group 1 lesson noted.
- **Existing component reuse**: `ImageCropper` (crop flow), `WebView` (terms/privacy), `AuthUnregister` (unregister), `useBottomConfirmSheet` (sheets) all reused from existing codebase. Compliant.
- **File naming**: All files follow kebab-case. Entity files use `.entity.ts`, models `.model.ts`, etc. Compliant.

## Re-evaluation (Fix Loop 1)

### Verdict: PASS

Both issues from the initial evaluation have been resolved. No new issues introduced.

### Issue 1 — Settings navigation (CRITICAL) → FIXED

`ProfileScreenHeader` component added at `profile-screen.tsx:162-189` with a gear icon (`icons-setting-stroke`) via `Icon.Pressable` in the header's right position. `handleNavigateToSettings` (line 41-43) calls `navigation.navigate("Settings")` and is passed as `onSettingsPress` prop to the header. Header layout uses a left spacer for visual symmetry. Criterion A9 satisfied.

### Issue 2 — Auto nickname generation (MEDIUM) → FIXED

`useEffect` at `profile-screen.tsx:30-39` checks if `myProfile` exists and `name` is empty/missing. On first detection, calls `generateNickname()` then `updateProfile({ name: nickname })`. A `useRef` guard (`hasAttemptedNicknameRef`) prevents multiple invocations across re-renders. Both `useGenerateNickname` and `useProfileEdit` hooks are imported from `./hooks` (line 10-14). Criterion A8 satisfied.

### New Issues Check

- **Architecture compliance**: All hooks (`useGenerateNickname`, `useProfileEdit`, `useMyProfile`) are presentation-layer hooks used within a presentation screen. No domain/data layer violations.
- **Import consistency**: `navigation` from `~/shared/routes`, `Icon` from `~/shared/ui/icon` — both match existing codebase patterns.
- **No missing imports**: All symbols used in the file are properly imported.
- **useEffect correctness**: Dependency array `[myProfile, generateNickname, updateProfile]` is complete. The ref guard prevents infinite loops even if profile re-renders with empty name.
- **No regressions**: `ProfileTabContent` and existing tab logic unchanged.
