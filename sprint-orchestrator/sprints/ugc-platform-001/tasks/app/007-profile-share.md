# app-007 · 프로필 공유 (OS 공유 시트 + 딥링크)

- **Group**: 003
- **Owner**: fe-engineer
- **Depends on**: app-003 (진입점 — "프로필 공유" 버튼)

## Target

`app/apps/MemeApp/src/presentation/profile/share/` 또는 기존 profile 디렉토리 내 유틸.

## Context

AC 2.3: 프로필 페이지 "프로필 공유" 버튼 탭 → OS 기본 공유 시트가 호출되며 프로필 URL(딥링크) 포함. 앱 설치 유저는 앱 내 프로필로, 미설치 유저는 브릿지 웹 경유. **OG Image 미포함, 단순 딥링크로만 동작.**

MemeApp 기존 자산:
- `shared/hooks/useNativeShare.ts` — `react-native-share` 래퍼. `shareApp(contents, options?)`.

## Objective

본인 프로필 화면의 "프로필 공유" 버튼이 OS 공유 시트를 호출하여 딥링크를 전달하도록 한다.

## Specification

### Screens / Components
- 별도 스크린 신설 없음. app-003의 "프로필 공유" 버튼 onPress 핸들러에서 호출하는 훅 `useShareMyProfile` 신설.

### Behavior
- 공유 메시지: `zzem://profile/{myUserId}` 포함 간단한 문구. 웹 브릿지 URL이 확립되어 있으면 `https://...` 대체 가능(기존 Linking 패턴 준수).
- OG Image 미포함 요구: `useNativeShare`의 `url`/`message` 계열만 사용하고 image/file 파라미터 미사용.
- 공유 시트 닫힘(취소) 시 에러 미노출.

### KB Contract Clauses
- completeness-002 (major, freq 1): `useShareMyProfile` 훅이 ProfileScreen에서 실제 호출됨을 검증.

### Tests
- Manual QA로 네이티브 공유 시트 확인 (Maestro로 OS 시트 자동화 불가 → `contracts/e2e-flow-plan.md`의 `Deferred: native-dialog` 분류).
- Unit: 공유 URL 생성 함수(`buildProfileShareUrl(userId)`) 결과가 `zzem://profile/{userId}` 형태인지.

## Acceptance Criteria

- [ ] "프로필 공유" 버튼 탭 → OS 공유 시트가 호출되고, 공유 내용에 `zzem://profile/{myUserId}` 가 포함.
- [ ] OG Image / image attachment 파라미터 미사용 (소스 코드 검사).
- [ ] 시트 취소 시 에러/크래시 없음.
- [ ] `useShareMyProfile` 훅이 app-003 ProfileScreen에서 실제 import+호출됨.

## Implementation Hints

- 참조: `shared/hooks/useNativeShare.ts`.
- URL 빌더는 `shared/lib/url/profile-share-url.ts`로 분리.
