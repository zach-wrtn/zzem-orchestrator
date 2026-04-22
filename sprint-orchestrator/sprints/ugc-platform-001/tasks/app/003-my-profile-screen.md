# app-003 · MY 프로필 스크린 + 3탭 + 랜딩 규칙

- **Group**: 002
- **Owner**: fe-engineer
- **Depends on**: app-001 (Profile stack), be-002 (/me/profile), be-003 (/me/contents, /me/contents/counts)

## Target

`app/apps/MemeApp/src/presentation/profile/` (신규), `shared/routes/profile-routes.ts` (신규).

## Context

앱의 세 번째 탭(Profile)은 "내가 만든 밈" 화면을 완전히 대체한다. 구조는 상단 프로필 정보 + 3개 탭(공개/비공개/좋아요). 좋아요 탭은 본 Phase에서 "껍데기"만(Phase 2 실기능). 디폴트 랜딩 탭 선택 규칙 및 생성 직후 진입 규칙이 명시되어 있다.

## Objective

MY 프로필 탭 진입 시 프로필 정보와 3탭을 렌더링하고, PRD AC 2.1/2.7의 디폴트 랜딩 규칙을 구현하며, 설정 화면 진입점(톱니바퀴)을 배치한다.

## Specification

### Screens / Components
- **ProfileScreen** (MY): 본인 프로필.
  - 헤더: 우상단 톱니바퀴(설정) 아이콘. 좌측 타이틀 또는 닉네임.
  - 프로필 정보: 프로필 이미지, 닉네임, 팔로워 / 팔로잉 / 재생성된 카운트 3종. 숫자 표기는 천/만 단위 축약 (8,600 → "8.6천"). 축약 유틸은 신설 또는 재사용.
  - 액션 버튼: "프로필 편집" (app-005), "프로필 공유" (app-007). 본 태스크에서는 버튼 배치만 하고 실제 구현은 각 의존 태스크 소관.
  - 3탭: 게시물(공개) / 비공개 / 좋아요. 각 탭은 `/v2/me/contents?visibility=...` 결과를 그리드로 렌더. 좋아요 탭은 Phase 1에서 빈 상태 컴포넌트(“아직 좋아요한 콘텐츠가 없어요” 류).
- **CountTile** 등 프로필 정보 sub-component는 자유 구성.

### Behavior
- **AC 2.1 디폴트 랜딩**:
  - 진입 시 `GET /v2/me/contents/counts`를 호출해 카운트 기반으로 랜딩 탭 결정.
  - 규칙: `public > 0` → 공개 탭, else `private > 0` → 비공개 탭, else 공개 탭(빈 상태).
- **AC 2.7 생성 직후 진입**:
  - 필터 기반 생성 완료 후 네비게이션은 Profile 탭 + 공개 탭.
  - 커스텀 프롬프트 기반 생성 완료 후 Profile 탭 + 비공개 탭.
  - 일반 MY 탭 진입 시에는 AC 2.1 규칙.
  - 랜딩 이유를 route param으로 전달(`landingTab?: 'public' | 'private' | 'liked'`).
- **팔로워/팔로잉/재생성 카운트** 노출: `followerCount`, `followingCount`는 Phase 1에서 0, `regeneratedCount`는 API가 주는 값 표기. 0 표시라도 "8.6천" 포맷 유틸을 통과.
- **설정 진입**: 헤더 우상단 톱니바퀴 → `Settings` 라우트로 이동 (app-004에서 구현; 본 태스크는 navigation 호출만 선행).
- **비회원**: Profile 탭 진입 자체가 로그인 리다이렉트 (app-001 공통 처리).
- **데이터 fetch**: tanstack react-query 기존 컨벤션. 쿼리 키 파일(`data/profile/query-key.ts` 등) 신설. 탭 전환은 별도 쿼리로 lazy-load 가능.

### KB Contract Clauses
- completeness-001 (critical): 설정 진입점(톱니바퀴)을 실제 배치.
- completeness-002 (major, freq 1): 신규 훅(useGetMyProfileUseCase 등)은 본 스크린에서 실제 호출되어야 한다. 미사용 export 금지.
- completeness-003 (major, freq 1): `landingTab` 등 신규 navigation param 추가 시, 생성 완료 호출부(필터 생성 완료, 커스텀 프롬프트 생성 완료 지점)에서 정확히 전달.
- code_quality-001 (major, freq 1): react-query 훅은 presentation 계층에서만 사용. domain 레이어에 react-query import 금지.
- integration-001 (critical): API 응답 필드명(`list`, `nextCursor`, `profileImageUrl`, `regeneratedCount`, `isPersona`)을 FE 타입에서 동일 이름으로 사용.

### Tests
- Maestro flow 신규: `my-profile-default-landing.yaml`
  - `zzem://e2e-auth?...` 로그인 → 프로필 탭 openLink → 공개 탭 활성화 확인.
- 시드 플랜: 공개 2건 + 비공개 1건 콘텐츠를 보유한 e2e 계정. `contracts/e2e-seed-plan.md` 참조.
- Unit: 숫자 축약 유틸(`formatKoreanCount`) 테스트.

## Acceptance Criteria

- [ ] Profile 탭 진입 시 프로필 정보(image / nickname / 3 count)가 렌더링된다.
- [ ] 3개 탭(공개/비공개/좋아요)이 렌더링되며 각 탭 전환이 동작한다.
- [ ] 공개 콘텐츠 2건+ 보유 유저가 Profile 탭 진입 시 디폴트 공개 탭이 활성화된다.
- [ ] 공개 0 + 비공개 1건+ 유저 진입 시 디폴트 비공개 탭이 활성화된다.
- [ ] 좋아요 탭 진입 시 빈 상태 컴포넌트 렌더(에러/로딩 아님).
- [ ] 필터 기반 생성 완료 후 Profile 탭 + 공개 탭으로 네비게이션 (route param 확인).
- [ ] 커스텀 프롬프트 기반 생성 완료 후 Profile 탭 + 비공개 탭.
- [ ] 우상단 톱니바퀴 탭 시 Settings 라우트로 이동 (실제 Settings 화면은 app-004).
- [ ] Maestro flow `my-profile-default-landing.yaml` 통과.
- [ ] 숫자 표기 유틸이 8600→"8.6천", 10000→"1만", 12345→"1.2만" 등 케이스를 처리.

## Implementation Hints

- 참조: `presentation/meme/meme-collection.screen.tsx` (기존 3탭 내부 스위칭 패턴이 있다면 재사용 참고).
- 참조: `shared/ui/header/header-bar.tsx`.
- 데이터 레이어: `data/content/` 기존 구조를 따라 `data/profile/`, `data/me-contents/`를 신설.
- 숫자 축약: 별도 `shared/lib/format/korean-count.ts` 유틸로 분리. 100건 이상 경계값(1,000 / 10,000 / 100,000,000) 케이스를 모두 테스트.
