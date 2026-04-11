# Maestro E2E Testing 도입 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** MemeApp(React Native Bare)에 Maestro 기반 E2E 테스트 인프라를 구축하고, 핵심 유저 플로우 5개를 자동화하여 스프린트 회귀 방지 체계를 확립한다.

**Architecture:** Maestro YAML flows를 `apps/MemeApp/e2e/` 디렉토리에 배치하고, testID 기반 요소 선택 전략을 사용한다. 로컬 개발은 iOS Simulator + `maestro test`로 실행하고, CI는 Bitrise의 기존 `pr_check` 워크플로우에 E2E 스텝을 추가한다.

**Tech Stack:** Maestro CLI, React Native 0.83 (Bare), iOS Simulator / Android Emulator, Bitrise CI

---

## Phase 구조

| Phase | 목표 | Tasks |
|-------|------|-------|
| **Phase 1: 인프라 셋업** | Maestro 설치 + 프로젝트 구조 + 첫 smoke test | Task 1-3 |
| **Phase 2: testID 계장** | 핵심 화면에 testID 추가 (E2E 안정성 확보) | Task 4-6 |
| **Phase 3: 핵심 플로우 테스트** | 5개 유저 플로우 YAML 작성 | Task 7-11 |
| **Phase 4: CI 통합** | Bitrise pr_check에 E2E 추가 | Task 12-13 |

---

## File Structure

### 신규 파일 (apps/MemeApp/e2e/)

```
apps/MemeApp/e2e/
├── .maestro/                          # Maestro 글로벌 설정
│   └── config.yaml                    # appId, 기본 설정
├── flows/
│   ├── smoke-test.yaml                # Phase 1: 앱 부팅 + 탭 표시 확인
│   ├── tab-navigation.yaml            # 홈/탐색/MY 탭 전환
│   ├── guest-login-redirect.yaml      # 게스트 MY 탭 → 로그인 리다이렉트
│   ├── profile-view.yaml              # 프로필 조회 + 콘텐츠 탭 전환
│   ├── profile-edit.yaml              # 프로필 편집 + 닉네임 검증
│   └── settings-navigation.yaml       # 설정 진입 + 메뉴 확인
├── helpers/
│   └── login.yaml                     # 재사용: 테스트 계정 로그인 서브플로우
└── README.md                          # E2E 실행 가이드
```

### 수정 파일 (testID 추가)

```
apps/MemeApp/src/
├── app/navigation/
│   └── bottom-tab-navigator.tsx       # 탭 바 testID
├── presentation/
│   ├── home/home.screen.tsx           # 홈 화면 testID
│   ├── profile/
│   │   ├── profile-screen.tsx         # 프로필 화면 + 헤더 testID
│   │   ├── profile-edit-screen.tsx    # 편집 화면 testID
│   │   └── components/
│   │       ├── profile-header.tsx     # 프로필 헤더 요소 testID
│   │       └── profile-content-tabs.tsx # 콘텐츠 탭 testID
│   └── settings/
│       └── settings.screen.tsx        # 설정 화면 testID
└── shared/
    └── constants/
        └── test-ids.ts                # [신규] testID 상수 중앙 관리
```

### CI 수정

```
bitrise.yml                            # pr_check에 maestro 스텝 추가
```

---

## Phase 1: 인프라 셋업

### Task 1: Maestro CLI 설치 및 프로젝트 구조 생성

**Files:**
- Create: `apps/MemeApp/e2e/.maestro/config.yaml`
- Create: `apps/MemeApp/e2e/README.md`
- Modify: `apps/MemeApp/package.json` (scripts 추가)

- [ ] **Step 1: Maestro CLI 설치 확인**

```bash
# Maestro가 이미 설치되어 있는지 확인
maestro --version

# 미설치 시:
curl -Ls "https://get.maestro.mobile.dev" | bash
```

Expected: `maestro version X.Y.Z` 출력

- [ ] **Step 2: E2E 디렉토리 구조 생성**

```bash
cd apps/MemeApp
mkdir -p e2e/.maestro e2e/flows e2e/helpers
```

- [ ] **Step 3: Maestro 글로벌 설정 파일 작성**

`apps/MemeApp/e2e/.maestro/config.yaml`:
```yaml
# Maestro global configuration for MemeApp
appId: com.wrtn.zzem.dev
```

- [ ] **Step 4: E2E README 작성**

`apps/MemeApp/e2e/README.md`:
```markdown
# MemeApp E2E Tests (Maestro)

## Prerequisites

- Maestro CLI: `curl -Ls "https://get.maestro.mobile.dev" | bash`
- iOS Simulator 또는 Android Emulator 실행 중
- MemeApp Dev 빌드가 시뮬레이터에 설치됨

## 실행 방법

### 전체 테스트
```bash
yarn workspace MemeApp e2e
```

### 단일 플로우
```bash
maestro test e2e/flows/smoke-test.yaml
```

### Maestro Studio (디버깅)
```bash
maestro studio
```

## testID 컨벤션

- 파일: `src/shared/constants/test-ids.ts`에서 중앙 관리
- 네이밍: `{screen}.{element}.{variant?}` (예: `profile.header.avatar`)
- 모든 testID는 `TestIds` 상수 객체를 통해 참조

## 플로우 구조

| Flow | 설명 | 인증 필요 |
|------|------|----------|
| smoke-test | 앱 부팅 + 탭 표시 | No |
| tab-navigation | 3탭 전환 | No |
| guest-login-redirect | 게스트 MY → 로그인 | No |
| profile-view | 프로필 조회 + 탭 | Yes |
| profile-edit | 닉네임 편집 + 저장 | Yes |
| settings-navigation | 설정 메뉴 확인 | Yes |
```

- [ ] **Step 5: package.json에 E2E 스크립트 추가**

`apps/MemeApp/package.json`의 `scripts` 섹션에 추가:
```json
{
  "e2e": "maestro test e2e/flows/",
  "e2e:ios": "maestro test --platform ios e2e/flows/",
  "e2e:android": "maestro test --platform android e2e/flows/",
  "e2e:studio": "maestro studio"
}
```

- [ ] **Step 6: 루트 package.json에 워크스페이스 스크립트 추가**

루트 `package.json`의 `scripts` 섹션에 추가:
```json
{
  "e2e:meme": "yarn workspace MemeApp e2e"
}
```

- [ ] **Step 7: Commit**

```bash
git add apps/MemeApp/e2e/ apps/MemeApp/package.json package.json
git commit -m "chore(e2e): initialize Maestro E2E infrastructure for MemeApp"
```

---

### Task 2: testID 상수 모듈 생성

**Files:**
- Create: `apps/MemeApp/src/shared/constants/test-ids.ts`
- Modify: `apps/MemeApp/src/shared/constants/index.ts` (export 추가)

- [ ] **Step 1: testID 상수 파일 작성**

`apps/MemeApp/src/shared/constants/test-ids.ts`:
```typescript
/**
 * E2E 테스트용 testID 상수.
 * Maestro에서 `id: "value"` 셀렉터로 참조.
 * 네이밍: {screen}.{element}.{variant?}
 */
export const TestIds = {
  // Bottom Tab Navigator
  tab: {
    home: 'tab.home',
    explore: 'tab.explore',
    profile: 'tab.profile',
  },

  // Home Screen
  home: {
    screen: 'home.screen',
    feedGrid: 'home.feed-grid',
  },

  // Explore Screen
  explore: {
    screen: 'explore.screen',
  },

  // Profile Screen
  profile: {
    screen: 'profile.screen',
    header: {
      avatar: 'profile.header.avatar',
      name: 'profile.header.name',
      followerCount: 'profile.header.follower-count',
      followingCount: 'profile.header.following-count',
      regeneratedCount: 'profile.header.regenerated-count',
      editButton: 'profile.header.edit-button',
      shareButton: 'profile.header.share-button',
    },
    settingsButton: 'profile.settings-button',
    tabs: {
      posts: 'profile.tabs.posts',
      private: 'profile.tabs.private',
      liked: 'profile.tabs.liked',
    },
    contentGrid: 'profile.content-grid',
    emptyMessage: 'profile.empty-message',
  },

  // Profile Edit Screen
  profileEdit: {
    screen: 'profile-edit.screen',
    avatarButton: 'profile-edit.avatar-button',
    nicknameInput: 'profile-edit.nickname-input',
    nicknameError: 'profile-edit.nickname-error',
    saveButton: 'profile-edit.save-button',
    charCount: 'profile-edit.char-count',
  },

  // Settings Screen
  settings: {
    screen: 'settings.screen',
    account: 'settings.account',
    password: 'settings.password',
    notification: 'settings.notification',
    blockManagement: 'settings.block-management',
    serviceTerms: 'settings.service-terms',
    privacyPolicy: 'settings.privacy-policy',
    customerCenter: 'settings.customer-center',
    unregister: 'settings.unregister',
    appVersion: 'settings.app-version',
    logoutButton: 'settings.logout-button',
  },

  // Login Screen
  login: {
    screen: 'login.screen',
  },
} as const;
```

- [ ] **Step 2: constants/index.ts에 export 추가**

`apps/MemeApp/src/shared/constants/index.ts`에 다음 줄 추가:
```typescript
export { TestIds } from './test-ids';
```

- [ ] **Step 3: TypeScript 컴파일 확인**

```bash
cd apps/MemeApp && npx tsc --noEmit --pretty 2>&1 | head -20
```

Expected: 에러 없음 (기존 에러 제외)

- [ ] **Step 4: Commit**

```bash
git add apps/MemeApp/src/shared/constants/test-ids.ts apps/MemeApp/src/shared/constants/index.ts
git commit -m "feat(e2e): add centralized testID constants module"
```

---

### Task 3: Smoke Test 플로우 작성

**Files:**
- Create: `apps/MemeApp/e2e/flows/smoke-test.yaml`

- [ ] **Step 1: Smoke test YAML 작성**

`apps/MemeApp/e2e/flows/smoke-test.yaml`:
```yaml
appId: com.wrtn.zzem.dev
---
# Smoke Test: 앱 부팅 후 기본 UI 요소 표시 확인
# 인증 불필요 — 게스트 상태에서 실행

- launchApp:
    clearState: true

# 앱 부팅 후 홈 탭이 기본 표시되는지 확인
- assertVisible: "홈"
- assertVisible: "탐색"
- assertVisible: "MY"

# 홈 피드 영역이 렌더링되는지 확인
- assertVisible:
    id: "home.screen"
    optional: true
```

- [ ] **Step 2: 시뮬레이터에서 실행 (앱 설치 필요)**

```bash
cd apps/MemeApp && maestro test e2e/flows/smoke-test.yaml
```

Expected: 텍스트 기반 셀렉터("홈", "탐색", "MY")로 PASS (testID는 아직 미부착이므로 optional)

- [ ] **Step 3: Commit**

```bash
git add apps/MemeApp/e2e/flows/smoke-test.yaml
git commit -m "test(e2e): add smoke test flow for app boot verification"
```

---

## Phase 2: testID 계장 (Instrumentation)

### Task 4: Bottom Tab Navigator testID 부착

**Files:**
- Modify: `apps/MemeApp/src/app/navigation/bottom-tab-navigator.tsx`

- [ ] **Step 1: testID import 추가**

`bottom-tab-navigator.tsx` 상단에 import 추가:
```typescript
import { TestIds } from '~/shared/constants';
```

- [ ] **Step 2: 각 탭 스크린에 testID 부착**

`bottom-tab-navigator.tsx`에서 `Tab.Screen` 컴포넌트들의 `options`에 `tabBarTestID` 추가:

HomeTab:
```typescript
<Tab.Screen
  name="HomeTab"
  component={HomeTabStack}
  options={{
    tabBarLabel: '홈',
    tabBarTestID: TestIds.tab.home,
    // ... 기존 options 유지
  }}
/>
```

ExploreTab:
```typescript
<Tab.Screen
  name="ExploreTab"
  component={ExploreTabStack}
  options={{
    tabBarLabel: '탐색',
    tabBarTestID: TestIds.tab.explore,
    // ... 기존 options 유지
  }}
/>
```

ProfileTab:
```typescript
<Tab.Screen
  name="ProfileTab"
  component={ProfileTabStack}
  options={{
    tabBarLabel: 'MY',
    tabBarTestID: TestIds.tab.profile,
    // ... 기존 options 유지
  }}
/>
```

- [ ] **Step 3: TypeScript 컴파일 확인**

```bash
cd apps/MemeApp && npx tsc --noEmit --pretty 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add apps/MemeApp/src/app/navigation/bottom-tab-navigator.tsx
git commit -m "feat(e2e): add testIDs to bottom tab navigator"
```

---

### Task 5: Profile 화면 testID 부착

**Files:**
- Modify: `apps/MemeApp/src/presentation/profile/profile-screen.tsx`
- Modify: `apps/MemeApp/src/presentation/profile/components/profile-header.tsx`
- Modify: `apps/MemeApp/src/presentation/profile/components/profile-content-tabs.tsx`

- [ ] **Step 1: profile-screen.tsx에 testID 추가**

import 추가:
```typescript
import { TestIds } from '~/shared/constants';
```

루트 View에 testID 추가:
```typescript
<View testID={TestIds.profile.screen} style={styles.container}>
```

설정 버튼에 testID 추가 (ProfileScreenHeader 내부):
```typescript
<Icon.Pressable
  testID={TestIds.profile.settingsButton}
  name="icons-setting-stroke"
  onPress={handleNavigateToSettings}
/>
```

- [ ] **Step 2: profile-header.tsx에 testID 추가**

import 추가:
```typescript
import { TestIds } from '~/shared/constants';
```

각 요소에 testID 부착:
```typescript
// 아바타 영역
<View testID={TestIds.profile.header.avatar}>

// 이름
<Text testID={TestIds.profile.header.name}>{profile.name}</Text>

// 팔로워 카운트 StatItem
<View testID={TestIds.profile.header.followerCount}>

// 팔로잉 카운트 StatItem
<View testID={TestIds.profile.header.followingCount}>

// 재생성 카운트 StatItem
<View testID={TestIds.profile.header.regeneratedCount}>

// 편집 버튼
<Pressable testID={TestIds.profile.header.editButton} onPress={handleEditProfile}>

// 공유 버튼
<Pressable testID={TestIds.profile.header.shareButton} onPress={handleShareProfile}>
```

- [ ] **Step 3: profile-content-tabs.tsx에 testID 추가**

import 추가:
```typescript
import { TestIds } from '~/shared/constants';
```

각 탭에 testID 부착:
```typescript
// 게시물 탭
<Pressable testID={TestIds.profile.tabs.posts}>

// 비공개 탭
<Pressable testID={TestIds.profile.tabs.private}>

// 좋아요 탭
<Pressable testID={TestIds.profile.tabs.liked}>
```

- [ ] **Step 4: TypeScript 컴파일 확인**

```bash
cd apps/MemeApp && npx tsc --noEmit --pretty 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add apps/MemeApp/src/presentation/profile/
git commit -m "feat(e2e): add testIDs to profile screen, header, and content tabs"
```

---

### Task 6: Profile Edit + Settings 화면 testID 부착

**Files:**
- Modify: `apps/MemeApp/src/presentation/profile/profile-edit-screen.tsx`
- Modify: `apps/MemeApp/src/presentation/settings/settings.screen.tsx`
- Modify: `apps/MemeApp/src/presentation/settings/components/auth-setting-section.tsx`
- Modify: `apps/MemeApp/src/presentation/settings/components/preparation-setting-section.tsx`
- Modify: `apps/MemeApp/src/presentation/settings/components/terms-setting-section.tsx`
- Modify: `apps/MemeApp/src/presentation/settings/components/app-info-setting-section.tsx`
- Modify: `apps/MemeApp/src/presentation/settings/components/settings-footer.tsx`

- [ ] **Step 1: profile-edit-screen.tsx에 testID 추가**

import 추가:
```typescript
import { TestIds } from '~/shared/constants';
```

각 요소에 testID 부착:
```typescript
// 루트
<View testID={TestIds.profileEdit.screen}>

// 아바타 탭 영역
<Pressable testID={TestIds.profileEdit.avatarButton} onPress={handleImagePress}>

// 닉네임 인풋
<Input.Solid
  testID={TestIds.profileEdit.nicknameInput}
  maxLength={NICKNAME_MAX_LENGTH}
  ...
/>

// 에러 메시지
<Text testID={TestIds.profileEdit.nicknameError}>

// 글자 수 카운터
<Text testID={TestIds.profileEdit.charCount}>

// 저장 버튼
<Pressable testID={TestIds.profileEdit.saveButton} disabled={!canSave}>
```

- [ ] **Step 2: settings.screen.tsx에 testID 추가**

import 추가:
```typescript
import { TestIds } from '~/shared/constants';
```

루트에 testID 부착:
```typescript
<View testID={TestIds.settings.screen}>
```

- [ ] **Step 3: 설정 하위 섹션 컴포넌트에 testID 추가**

`auth-setting-section.tsx`:
```typescript
import { TestIds } from '~/shared/constants';
// 계정 항목
<Pressable testID={TestIds.settings.account}>
// 비밀번호 항목
<Pressable testID={TestIds.settings.password}>
```

`preparation-setting-section.tsx`:
```typescript
import { TestIds } from '~/shared/constants';
// 알림 설정
<Pressable testID={TestIds.settings.notification}>
// 차단 관리
<Pressable testID={TestIds.settings.blockManagement}>
```

`terms-setting-section.tsx`:
```typescript
import { TestIds } from '~/shared/constants';
// 서비스 이용약관
<Pressable testID={TestIds.settings.serviceTerms}>
// 개인정보 처리방침
<Pressable testID={TestIds.settings.privacyPolicy}>
// 고객센터
<Pressable testID={TestIds.settings.customerCenter}>
```

`app-info-setting-section.tsx`:
```typescript
import { TestIds } from '~/shared/constants';
// 탈퇴하기
<Pressable testID={TestIds.settings.unregister}>
// 앱 버전
<View testID={TestIds.settings.appVersion}>
```

`settings-footer.tsx`:
```typescript
import { TestIds } from '~/shared/constants';
// 로그아웃 버튼
<Pressable testID={TestIds.settings.logoutButton}>
```

- [ ] **Step 4: TypeScript 컴파일 확인**

```bash
cd apps/MemeApp && npx tsc --noEmit --pretty 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add apps/MemeApp/src/presentation/profile/profile-edit-screen.tsx \
      apps/MemeApp/src/presentation/settings/
git commit -m "feat(e2e): add testIDs to profile edit and settings screens"
```

---

## Phase 3: 핵심 플로우 테스트 작성

### Task 7: 탭 네비게이션 플로우

**Files:**
- Create: `apps/MemeApp/e2e/flows/tab-navigation.yaml`

- [ ] **Step 1: YAML 작성**

`apps/MemeApp/e2e/flows/tab-navigation.yaml`:
```yaml
appId: com.wrtn.zzem.dev
---
# Tab Navigation: 홈 → 탐색 → MY 탭 전환 검증
# 게스트 상태에서 실행 (MY 탭은 로그인 리다이렉트 발생)

- launchApp:
    clearState: true

# 1. 홈 탭 (기본 선택 상태)
- assertVisible:
    id: "tab.home"
- assertVisible: "홈"

# 2. 탐색 탭으로 전환
- tapOn:
    id: "tab.explore"
- assertVisible:
    id: "explore.screen"
    optional: true

# 3. 다시 홈 탭으로 전환
- tapOn:
    id: "tab.home"

# 4. MY 탭 탭 (게스트이므로 로그인으로 리다이렉트)
- tapOn:
    id: "tab.profile"

# 게스트일 경우 로그인 화면이 표시됨
- assertVisible:
    id: "login.screen"
    optional: true
```

- [ ] **Step 2: 실행 확인**

```bash
cd apps/MemeApp && maestro test e2e/flows/tab-navigation.yaml
```

- [ ] **Step 3: Commit**

```bash
git add apps/MemeApp/e2e/flows/tab-navigation.yaml
git commit -m "test(e2e): add tab navigation flow"
```

---

### Task 8: 게스트 로그인 리다이렉트 플로우

**Files:**
- Create: `apps/MemeApp/e2e/flows/guest-login-redirect.yaml`

- [ ] **Step 1: YAML 작성**

`apps/MemeApp/e2e/flows/guest-login-redirect.yaml`:
```yaml
appId: com.wrtn.zzem.dev
---
# Guest Login Redirect: 미인증 유저가 MY 탭 진입 시 로그인 화면으로 리다이렉트
# clearState로 항상 게스트 상태 보장

- launchApp:
    clearState: true

# 홈 탭에서 시작
- assertVisible: "홈"

# MY 탭 탭
- tapOn:
    id: "tab.profile"

# 로그인 화면으로 리다이렉트됨
- assertVisible:
    id: "login.screen"
    optional: true

# 로그인 화면 텍스트 확인 (정확한 텍스트는 실제 화면에서 확인 후 조정)
- assertVisible:
    text: "로그인"
    optional: true
```

- [ ] **Step 2: Commit**

```bash
git add apps/MemeApp/e2e/flows/guest-login-redirect.yaml
git commit -m "test(e2e): add guest login redirect flow"
```

---

### Task 9: 로그인 헬퍼 + 프로필 조회 플로우

**Files:**
- Create: `apps/MemeApp/e2e/helpers/login.yaml`
- Create: `apps/MemeApp/e2e/flows/profile-view.yaml`

- [ ] **Step 1: 로그인 헬퍼 서브플로우 작성**

`apps/MemeApp/e2e/helpers/login.yaml`:
```yaml
appId: com.wrtn.zzem.dev
---
# Login Helper: 테스트 계정으로 SSO 로그인 수행
# 환경변수: TEST_EMAIL, TEST_PASSWORD (maestro env로 주입)
#
# NOTE: SSO WebView 기반 로그인이므로 WebView 내부 요소 접근 필요.
# 실제 SSO 페이지 구조에 맞게 셀렉터를 조정해야 함.
# 초기 구현은 placeholder — Maestro Studio로 실제 요소를 캡처하여 업데이트.

- launchApp:
    clearState: true

# MY 탭 → 로그인 화면 진입
- tapOn:
    id: "tab.profile"

# SSO 로그인 WebView 진입 대기
- waitForAnimationToEnd

# TODO: SSO WebView 내부 로그인 플로우
# Maestro Studio에서 실제 WebView 요소를 캡처하여 아래를 완성:
# - inputText: { id: "email-input", text: "${TEST_EMAIL}" }
# - inputText: { id: "password-input", text: "${TEST_PASSWORD}" }
# - tapOn: { text: "로그인" }

# 로그인 완료 후 프로필 화면 도달 확인
- assertVisible:
    id: "profile.screen"
    optional: true
```

- [ ] **Step 2: 프로필 조회 플로우 작성**

`apps/MemeApp/e2e/flows/profile-view.yaml`:
```yaml
appId: com.wrtn.zzem.dev
---
# Profile View: 프로필 화면 조회 + 콘텐츠 탭 전환
# 인증 필요 — login 헬퍼 실행 후 동작
# NOTE: 로그인 헬퍼가 완성될 때까지는 이미 로그인된 상태의 시뮬레이터에서 수동 실행

- launchApp

# MY 탭 진입
- tapOn:
    id: "tab.profile"

# 프로필 화면 표시 확인
- assertVisible:
    id: "profile.screen"

# 프로필 헤더 요소 확인
- assertVisible:
    id: "profile.header.avatar"
- assertVisible:
    id: "profile.header.name"
- assertVisible:
    id: "profile.header.follower-count"
- assertVisible:
    id: "profile.header.following-count"
- assertVisible:
    id: "profile.header.regenerated-count"
- assertVisible:
    id: "profile.header.edit-button"
- assertVisible:
    id: "profile.header.share-button"

# 콘텐츠 탭 전환 검증
# 기본 탭 (게시물)
- assertVisible:
    id: "profile.tabs.posts"
- assertVisible:
    id: "profile.tabs.private"
- assertVisible:
    id: "profile.tabs.liked"

# 비공개 탭 전환
- tapOn:
    id: "profile.tabs.private"
- waitForAnimationToEnd

# 좋아요 탭 전환 → "준비 중" 메시지
- tapOn:
    id: "profile.tabs.liked"
- waitForAnimationToEnd
- assertVisible: "준비 중입니다"

# 게시물 탭으로 복귀
- tapOn:
    id: "profile.tabs.posts"
- waitForAnimationToEnd
```

- [ ] **Step 3: Commit**

```bash
git add apps/MemeApp/e2e/helpers/login.yaml apps/MemeApp/e2e/flows/profile-view.yaml
git commit -m "test(e2e): add login helper and profile view flow"
```

---

### Task 10: 프로필 편집 플로우

**Files:**
- Create: `apps/MemeApp/e2e/flows/profile-edit.yaml`

- [ ] **Step 1: YAML 작성**

`apps/MemeApp/e2e/flows/profile-edit.yaml`:
```yaml
appId: com.wrtn.zzem.dev
---
# Profile Edit: 닉네임 수정 + 검증 + 저장
# 인증 필요 — 로그인된 상태의 시뮬레이터에서 실행

- launchApp

# MY 탭 → 프로필 화면
- tapOn:
    id: "tab.profile"
- assertVisible:
    id: "profile.screen"

# 프로필 편집 진입
- tapOn:
    id: "profile.header.edit-button"
- assertVisible:
    id: "profile-edit.screen"

# 닉네임 인풋 확인
- assertVisible:
    id: "profile-edit.nickname-input"

# 기존 닉네임 지우고 1자 입력 → 저장 버튼 비활성화 확인
- tapOn:
    id: "profile-edit.nickname-input"
- clearText
- inputText: "가"
- assertVisible:
    id: "profile-edit.nickname-error"

# 유효한 닉네임 입력 (2자 이상)
- clearText
- inputText: "테스트닉네임"

# 저장 버튼 활성화 → 탭
- tapOn:
    id: "profile-edit.save-button"

# 프로필 화면으로 복귀 + 변경된 이름 확인
- assertVisible:
    id: "profile.screen"
- assertVisible: "테스트닉네임"

# 원래 닉네임으로 복원 (테스트 정리)
- tapOn:
    id: "profile.header.edit-button"
- tapOn:
    id: "profile-edit.nickname-input"
- clearText
- inputText: "테스트계정"
- tapOn:
    id: "profile-edit.save-button"
- assertVisible:
    id: "profile.screen"
```

- [ ] **Step 2: Commit**

```bash
git add apps/MemeApp/e2e/flows/profile-edit.yaml
git commit -m "test(e2e): add profile edit flow with nickname validation"
```

---

### Task 11: 설정 네비게이션 플로우

**Files:**
- Create: `apps/MemeApp/e2e/flows/settings-navigation.yaml`

- [ ] **Step 1: YAML 작성**

`apps/MemeApp/e2e/flows/settings-navigation.yaml`:
```yaml
appId: com.wrtn.zzem.dev
---
# Settings Navigation: 프로필 → 설정 진입 + 메뉴 항목 확인
# 인증 필요

- launchApp

# MY 탭 → 프로필 화면
- tapOn:
    id: "tab.profile"
- assertVisible:
    id: "profile.screen"

# ⚙️ 아이콘 → 설정 화면
- tapOn:
    id: "profile.settings-button"
- assertVisible:
    id: "settings.screen"

# 설정 메뉴 항목 10개 확인
- assertVisible:
    id: "settings.account"
- assertVisible:
    id: "settings.password"
- assertVisible:
    id: "settings.notification"
- assertVisible:
    id: "settings.block-management"
- assertVisible:
    id: "settings.service-terms"
- assertVisible:
    id: "settings.privacy-policy"
- assertVisible:
    id: "settings.customer-center"
- assertVisible:
    id: "settings.unregister"
- assertVisible:
    id: "settings.app-version"
- assertVisible:
    id: "settings.logout-button"

# "준비 중" 기능 확인 (알림 설정)
- tapOn:
    id: "settings.notification"
- assertVisible: "준비 중"
- waitForAnimationToEnd

# 뒤로가기
- back
```

- [ ] **Step 2: Commit**

```bash
git add apps/MemeApp/e2e/flows/settings-navigation.yaml
git commit -m "test(e2e): add settings navigation flow with menu verification"
```

---

## Phase 4: CI 통합

### Task 12: Bitrise pr_check 워크플로우에 E2E 스텝 추가

**Files:**
- Modify: `bitrise.yml`

- [ ] **Step 1: bitrise.yml에 E2E 워크플로우 추가**

기존 `pr_check` 워크플로우의 steps 끝에 Maestro 스텝 추가. 또는 별도 `e2e_check` 워크플로우로 분리:

```yaml
  e2e_check:
    steps:
    - git-clone@8: {}
    - script@1:
        title: Install Maestro CLI
        inputs:
        - content: |
            #!/bin/bash
            set -e
            curl -Ls "https://get.maestro.mobile.dev" | bash
            export PATH="$PATH":"$HOME/.maestro/bin"
            maestro --version
    - script@1:
        title: Install dependencies
        inputs:
        - content: |
            #!/bin/bash
            set -e
            yarn install --frozen-lockfile
    - script@1:
        title: Build MemeApp (iOS Simulator)
        inputs:
        - content: |
            #!/bin/bash
            set -e
            cd apps/MemeApp/ios
            pod install
            xcodebuild -workspace zzem.xcworkspace \
              -scheme zzem \
              -configuration DevDebug \
              -sdk iphonesimulator \
              -derivedDataPath build \
              -quiet
    - script@1:
        title: Boot iOS Simulator
        inputs:
        - content: |
            #!/bin/bash
            set -e
            xcrun simctl boot "iPhone 16" || true
            xcrun simctl install booted apps/MemeApp/ios/build/Build/Products/DevDebug-iphonesimulator/zzem.app
    - script@1:
        title: Run Maestro E2E Tests
        inputs:
        - content: |
            #!/bin/bash
            set -e
            export PATH="$PATH":"$HOME/.maestro/bin"
            cd apps/MemeApp
            maestro test e2e/flows/smoke-test.yaml
            maestro test e2e/flows/tab-navigation.yaml
            maestro test e2e/flows/guest-login-redirect.yaml
            # 인증 필요 플로우는 CI에서 별도 처리 필요
            # maestro test e2e/flows/profile-view.yaml
            # maestro test e2e/flows/profile-edit.yaml
            # maestro test e2e/flows/settings-navigation.yaml
```

> **NOTE:** 인증이 필요한 플로우(profile-view, profile-edit, settings-navigation)는 CI에서 테스트 계정 토큰 주입 전략이 확보된 후 활성화. Phase 1에서는 게스트 플로우(smoke, tab-navigation, guest-login-redirect)만 CI에서 실행.

- [ ] **Step 2: Commit**

```bash
git add bitrise.yml
git commit -m "ci(e2e): add Maestro E2E workflow to Bitrise"
```

---

### Task 13: Maestro Cloud 대안 검토 및 문서화

**Files:**
- Modify: `apps/MemeApp/e2e/README.md`

- [ ] **Step 1: README에 CI 실행 가이드 추가**

`apps/MemeApp/e2e/README.md` 하단에 CI 섹션 추가:
```markdown
## CI Integration

### 현재 상태
- **게스트 플로우** (smoke, tab-navigation, guest-login-redirect): Bitrise `e2e_check`에서 자동 실행
- **인증 플로우** (profile-view, profile-edit, settings-navigation): 로컬에서만 수동 실행

### Maestro Cloud (향후)
인증 플로우를 CI에서 자동화하려면:
1. Maestro Cloud 계정 설정
2. 테스트 계정 credentials를 Maestro Cloud env로 주입
3. `maestro cloud` 명령으로 실행

```bash
maestro cloud \
  --app-file=path/to/zzem.app \
  --env=TEST_EMAIL=test@wrtn.ai \
  --env=TEST_PASSWORD=*** \
  e2e/flows/
```

### 인증 전략 (TODO)
SSO WebView 기반 로그인을 E2E에서 자동화하려면:
1. **방법 A**: 테스트 전용 API 토큰 주입 (MMKV에 직접 세팅)
2. **방법 B**: Maestro의 `runScript`로 deeplink 기반 로그인 바이패스
3. **방법 C**: SSO WebView 요소를 Maestro Studio로 캡처 후 직접 자동화
```

- [ ] **Step 2: Commit**

```bash
git add apps/MemeApp/e2e/README.md
git commit -m "docs(e2e): add CI integration guide and auth strategy notes"
```

---

## 검증 체크리스트

| # | 검증 항목 | Task |
|---|----------|------|
| 1 | `maestro test e2e/flows/smoke-test.yaml` PASS | Task 3 |
| 2 | `TestIds` 상수가 TSC 통과 | Task 2 |
| 3 | 모든 testID가 `TestIds` 상수 참조 (하드코딩 없음) | Task 4-6 |
| 4 | 게스트 플로우 3개 시뮬레이터에서 PASS | Task 7-8 |
| 5 | 인증 플로우 3개 로그인된 시뮬레이터에서 PASS | Task 9-11 |
| 6 | Bitrise `e2e_check` 워크플로우 green | Task 12 |

---

## 향후 확장 (Out of Scope)

- [ ] 콘텐츠 생성 플로우 (FilterPreview → MemeCollection → MemeViewer)
- [ ] SwipeFeed 플로우 (피드 아이템 탭 → 스와이프 네비게이션)
- [ ] 크레딧/결제 플로우
- [ ] Android Emulator CI 파이프라인
- [ ] 인증 자동화 (SSO WebView → MMKV 토큰 주입)
- [ ] 스프린트별 자동 E2E 생성 (Sprint Contract Done Criteria → Maestro YAML)
