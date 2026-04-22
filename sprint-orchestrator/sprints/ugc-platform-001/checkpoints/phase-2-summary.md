# Phase 2 Checkpoint: ugc-platform-001

> Spec 완료 요약. 이후 Phase (3/4/5)에서는 원본 PRD·전체 태스크 대신 이 파일을 참조.

## Scope

UGC Platform **Phase 1** (profile & navigation). PRD 1 `/docs/prds/01-profile-navigation.md` + KB mirror.

- Navigation 뼈대: 하단 3탭 (홈/탐색/MY) — Phase 3.4 amendment로 canonical 라벨 확정
- MY 프로필 3탭 (공개/비공개/좋아요) + 기본 랜딩 분기
- 프로필 편집 / 공유 / 설정 7메뉴
- 타유저 공개 프로필 + 공개 콘텐츠 피드 진입

PRD 2 (소셜/팔로우), PRD 3 (차단·신고) 는 **scope 외**.

## Tasks

| ID | Type | Target | Group | Depends on |
|----|------|--------|-------|------------|
| be-001 | backend | Content schema에 `isPublished:boolean=false` + 복합 인덱스 | 001 | — |
| be-002 | backend | `/v2/me/profile` GET/PATCH + 자동 닉네임 | 001 | — |
| be-003 | backend | `/v2/me/contents` visibility 필터 + counts | 001 | be-001 |
| be-004 | backend | `/v2/users/:userId/profile`, `/v2/users/:userId/contents` | 001 | be-001, be-002 |
| app-001 | app | Bottom tab navigator (홈/둘러보기/프로필) + 딥링크 | 002 | — |
| app-002 | app | 둘러보기 탭 (Home 추천 그리드 재사용) | 002 | app-001 |
| app-003 | app | MY 프로필 3탭 스크린 + 기본 랜딩 | 002 | be-002, be-003 |
| app-004 | app | 설정 7메뉴 + 진입점 + placeholder | 002 | app-003 |
| app-005 | app | 프로필 편집 (이미지/닉네임) | 003 | app-003, be-002 |
| app-006 | app | 타유저 공개 프로필 스크린 | 003 | app-001, be-004 |
| app-007 | app | 프로필 공유 (OS 시트 + 딥링크) | 003 | app-003 |
| app-008 | app | 프로필 → 세로 스와이프 피드 source 전달 | 003 | app-003, app-006, be-003, be-004 |

## API Endpoints (SSOT: `contracts/api-contract.yaml`)

| Method | Path | Related Tasks |
|--------|------|---------------|
| GET | `/v2/me/profile` | be-002, app-003 |
| PATCH | `/v2/me/profile` | be-002, app-005 |
| GET | `/v2/me/contents?visibility={public\|private\|liked}&cursor&size` | be-003, app-003, app-008 |
| GET | `/v2/me/contents/counts` | be-003, app-003 |
| GET | `/v2/users/{userId}/profile` | be-004, app-006 |
| GET | `/v2/users/{userId}/contents?cursor&size` | be-004, app-006, app-008 |

**Auth**: 전 endpoint `LibUserAuth` (header `wrtn-user-id`).
**Cursor 규약**: raw `{list, nextCursor}` — `CursorResponseDto` **재래핑 금지** (correctness-001).

## Key Decisions

1. **Visibility 구현**: `Content.isPublished: boolean` 단일 플래그로 구현. 기존 visibility-agnostic 조회는 필터 미적용으로 유지.
2. **자동 닉네임**: `UserProfile` 최초 진입 시 adj+animal+4digit 조합 서버 생성. 멱등성 보장(재호출 시 기존 값 유지).
3. **Persona 플래그**: 기존 `UserProfile.type === INTERNAL`을 `isPersona: true`로 매핑. **MyProfileResponse에만 노출**, PublicProfileResponse에는 미포함.
4. **좋아요 탭**: Phase 1에서 `liked`는 빈 리스트 고정. 스키마/엔드포인트는 선도입.
5. **SwipeFeed source union**: `{kind:'me', visibility}` / `{kind:'user', userId}` 두 case. 미전달 시 기존 추천 풀 fallback (회귀 방지 — completeness-003).
6. **알림 설정 / 차단 관리**: ComingSoonScreen placeholder. 진입점만 구축, 기능은 Phase 3 소관.
7. **프로필 공유**: OG image 미포함, 딥링크 문자열만. `useNativeShare` image/file 파라미터 미사용.
8. **타유저 프로필**: 게시물(공개) 단일 탭. 차단·신고 메뉴 없음 (PRD 3 소관).

## KB Contract Clauses (주입됨)

- `correctness-001` (critical): cursor 응답 재래핑 금지
- `integration-001` (critical): BE 응답 `list` 필드명 + FE 타입 동일 유지
- `completeness-001` (critical): 신규 screen은 실제 진입점과 함께 등록
- `completeness-002` (major, freq 1): 신규 훅/mutation은 실제 호출부 존재
- `completeness-003` (major, freq 1): route param 추가 시 모든 navigate 호출부 반영 + fallback 유지

## Group Plan

- **Group 001 (Backend)**: be-001, be-002, be-003, be-004 — 스키마 + 6 endpoints.
- **Group 002 (App Foundation)**: app-001, app-002, app-003, app-004 — 네비게이션 + MY 프로필 + 설정.
- **Group 003 (App Features)**: app-005, app-006, app-007, app-008 — 편집 + 타유저 + 공유 + 피드 진입.

## E2E Flows (`contracts/e2e-flow-plan.md`)

- **신규 7종**: `bottom-tab-nav`, `explore-tab`, `my-profile-default-landing`, `settings-menu-full`, `profile-edit`, `other-user-profile`, `profile-to-swipe-feed`
- **회귀 감시 (Covered)**: 기존 22 flow 전부
- **Deferred 5건**: OS 공유 시트, 콘텐츠 생성 후 리다이렉트, 404 유저, clipboard 실값, presigned 업로드 완료 — 대체 검증 수단 명시
- **Seed 3 fetcher 추가**: public / private content id + other user id (`e2e-seed-plan.md`)

## Gate Check (Phase 2 → Phase 3)

- [x] `api-contract.yaml` 존재 + 6 endpoints 정의
- [x] 12 태스크 전부 필수 섹션(Target, Context, Objective, Specification, AC, Implementation Hints) 보유
- [x] 순환 의존성 없음 (Depends on 그래프 DAG)
- [x] AC testable — 모두 API response 또는 Maestro flow로 검증 가능
- [x] BE/App 태스크가 동일 endpoint 참조 (api-contract.yaml SSOT)
- [x] `contracts/e2e-flow-plan.md` 생성 + 모든 AC가 Covered/Extend/New/Deferred 중 하나로 분류
- [x] `evaluations/criteria.md` 생성
- [x] `contracts/e2e-seed-plan.md` 생성

→ **Phase 3 (Prototype) 진입 가능**. 모든 app 태스크가 `### Screens / Components` 섹션 보유 (신규 스크린 app-001/003/004/005/006 존재).
