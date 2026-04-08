# Phase 2 Checkpoint: ugc-profile-nav-001

## Tasks

| ID | Type | Target | Group |
|----|------|--------|-------|
| backend/001 | backend | 프로필 조회·수정 API (내 프로필, 타유저, 공유, 편집) | 1 |
| backend/002 | backend | 콘텐츠 공개/비공개 시스템 (isPublished + 목록 조회 + 전환) | 1 |
| backend/003 | backend | 닉네임 자동 생성 API (형용사+동물+숫자) | 2 |
| app/001 | app | 3탭 네비게이션 구조 (홈/탐색/MY 탭바) | 1 |
| app/002 | app | 프로필 화면 (헤더+3탭+그리드) | 1 |
| app/003 | app | 프로필 편집 + 공유 + 자동 닉네임 | 2 |
| app/004 | app | 설정 화면 재구성 (7개 메뉴) | 2 |
| app/005 | app | 타 유저 프로필 + 생성 후 랜딩 | 3 |

## API Endpoints

| Method | Path | Related Tasks |
|--------|------|---------------|
| GET | /api/v1/user-profile/me | backend/001, app/002 |
| PATCH | /api/v1/user-profile/me | backend/001, app/003 |
| GET | /api/v1/user-profile/:profileId | backend/001, app/005 |
| GET | /api/v1/user-profile/share/:profileId | backend/001, app/003 |
| GET | /api/v1/content/user/:profileId | backend/002, app/002, app/005 |
| PATCH | /api/v1/content/:contentId/publish | backend/002 |
| GET | /api/v1/nickname/generate | backend/003, app/003 |

## Key Decisions

1. **팔로워/팔로잉 카운트**: PRD 1 단계에서 항상 0 반환 (서버 하드코딩). PRD 3에서 실제 구현
2. **isPublished 마이그레이션**: No Batch. `default: false` + 쿼리에서 `{ $ne: true }` 사용으로 기존 데이터 호환
3. **좋아요 탭**: 빈 껍데기만 구현. PRD 2에서 실제 기능 연결
4. **탐색 탭**: 홈과 동일한 콘텐츠 풀/추천 로직. 초기에는 HomeScreen 컴포넌트 재사용 가능
5. **타 유저 프로필**: ProfileScreen 재사용, `isOwnProfile` 분기로 탭/버튼 차이 처리
6. **생성 후 랜딩**: 네비게이션 파라미터 `initialTab`으로 탭 결정 (필터→게시물, 프롬프트→비공개)

## Group Plan

- **Group 1**: backend/001, backend/002, app/001, app/002 — 네비게이션 골격 + 프로필 코어 + 콘텐츠 목록
- **Group 2**: backend/003, app/003, app/004 — 프로필 편집 + 닉네임 생성 + 설정 화면
- **Group 3**: app/005 — 타 유저 프로필 + 생성 후 랜딩 로직
