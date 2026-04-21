# app-001 · 3탭 하단 탭바 네비게이션 + 딥링크

- **Group**: 002
- **Owner**: fe-engineer
- **Depends on**: be-002 (프로필 API — 탭 초기 데이터 소스)

## Target

`app/apps/MemeApp/src/app/navigation/`, `shared/routes/`.

## Context

현재 앱은 단일 stack 기반이며 Home은 root 레벨 스크린에서 내부 state로 Recommend/Free 서브탭을 스위칭한다. PRD는 이를 전면 리팩토링하여 **하단 탭 바 3탭**(홈 / 탐색(돋보기) / 프로필)으로 재구성하라고 지정한다. "점진적 얹기 아님"이 PRD에 명시됨.

MemeApp 기존 패턴:
- React Navigation v6 `createNativeStackNavigator` 루트 사용.
- Deep link: `zzem://` + `https://` prefix. `useNavigationLinking.ts`에서 라우트 매핑.
- E2E Maestro는 `openLink: "zzem://..."` 방식을 표준으로 사용.

## Objective

앱의 네비게이션 루트를 **하단 탭 바 기반 3탭**으로 전환하고, 각 탭이 자체 stack을 갖도록 구성하며, 프로필 탭의 딥링크(`zzem://profile`, `zzem://profile/:userId`)를 등록한다.

## Specification

### Screens / Components
- **RootTabNavigator** (신규): `createBottomTabNavigator`.
  - Tab 1: Home stack (기존 Home 진입점 재배치).
  - Tab 2: Explore stack (app-002 구현).
  - Tab 3: Profile stack (app-003 구현; 본 태스크에서는 placeholder route만 등록).
- **route.types.ts** 업데이트: `RootTabParamList` 신설 및 기존 `RootStackParamList`와의 관계 정립 (스택은 탭 내부로 이동).
- **Deep link 경로** 추가: `zzem://home`, `zzem://explore`, `zzem://profile`, `zzem://profile/:userId` (타유저).

### Behavior
- 각 탭 아이콘·라벨은 `@wrtn/app-design-guide` 아이콘 세트 사용 (존재하는 아이콘 재사용; 없으면 기존 custom 아이콘 패턴 따라 추가).
- 탭 전환 시 각 stack의 첫 화면으로 스크롤/상태 초기화는 기본 React Navigation 동작에 위임.
- 비회원이 Profile 탭을 탭하면 로그인 화면으로 랜딩 (기존 `useNavigationLinking`의 auth-required 로직 재사용; Profile 경로를 해당 목록에 추가).
- 헤더: Home 탭은 좌측 ZZEM 로고 + 우측 크레딧·알림 아이콘을 기존 `HomeHeader`로 유지. 다른 탭의 헤더는 해당 탭 내부 화면이 자체 렌더.

### KB Contract Clauses
- completeness-001 (critical): 신규 Profile 탭 라우트에 대한 진입점(탭바 버튼) 배치 확인.
- completeness-003 (major, freq 1): `route.types.ts`에 param 추가 시 모든 `navigation.navigate` 호출부에서 해당 param 전달하고 useCallback deps에 포함해야 한다. Deep link 경로(params 없는 진입)에서도 fallback 동작 보장.
- code_quality-001 (major, freq 1): Navigation 훅/useQuery는 presentation 레이어에서만 사용. domain 레이어에 import 금지. **참고: 현재 `src/domain/user/user.usecase.ts`에 기존 위반이 존재한다. 본 태스크에서는 위반을 확대하지 않는 선에서 유지하고, 신규 코드는 규칙 준수.**

### Tests
- E2E (Maestro) 신규 flow: `bottom-tab-nav.yaml` — 앱 부팅 → 3탭 visible → 각 탭 `assertVisible(testID)` 순환 탭 확인. Tap 대신 `tapOn` 회피를 위해 `launchApp` + `assertVisible`만으로도 OK.
- Unit: route.types 변경이 TypeScript 빌드 통과.

## Acceptance Criteria

- [ ] 앱 부팅 시 하단에 3개 탭(홈/탐색/프로필) 아이콘·라벨이 노출된다.
- [ ] 각 탭 탭 시 해당 stack의 루트 화면으로 이동한다.
- [ ] `zzem://profile` 딥링크 실행 시 로그인 유저는 프로필 탭으로, 비회원은 로그인 화면으로 랜딩.
- [ ] `zzem://profile/{userId}` 딥링크 실행 시 해당 유저의 프로필 화면으로 랜딩 (app-006 미완성 시 placeholder도 허용 — placeholder에도 `userId`가 표시되도록).
- [ ] `route.types.ts`에 `RootTabParamList` 타입이 정의되고, 기존 navigate 호출부의 타입 에러 0.
- [ ] Maestro flow `bottom-tab-nav.yaml`이 통과.
- [ ] `npm run typecheck` 신규 에러 0.

## Implementation Hints

- 참조: `app/apps/MemeApp/src/app/navigation/root-navigator.tsx`, `useNavigationLinking.ts`, `shared/routes/*-routes.ts`.
- 참조: `shared/constants/test-ids.ts` — 신규 `home`, `explore`, `profile` 탭 testID 추가.
- 테마/아이콘: `@wrtn/app-design-guide` 공통 컴포넌트 사용.
- 기존 홈 스크린의 Recommend/Free 내부 서브탭은 그대로 유지. 본 태스크 범위는 **루트 레벨** 탭 바 추가.
