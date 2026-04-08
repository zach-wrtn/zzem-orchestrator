# Task 002: 콘텐츠 공개/비공개 시스템

- **Group**: 1
- **AC**: 2.2, 2.7

## Target

Content 스키마에 `isPublished` 필드를 추가하고, 유저별 콘텐츠 목록 조회 API와 공개/비공개 전환 API를 구현한다.

## Context

- 기존 `Content` 스키마: `userId`, `filterId`, `status`, `filterType`, `thumbnail` 등 존재. `isPublished` 필드 없음.
- PRD 마이그레이션 정책: `isPublished` 필드를 `default=false`로 추가. 기존 콘텐츠는 필드 미존재 = 비공개로 간주 (No Batch).
- 기존 `ContentDomainService` 존재 (`wrtn-backend/apps/meme-api/src/domain/content/`)
- 생성 후 랜딩: 필터 기반 생성 → `isPublished=true`, 커스텀 프롬프트 기반 생성 → `isPublished=false`

## Objective

1. Content 스키마에 `isPublished` 필드 추가 (`default: false`)
2. `GET /api/v1/content/user/:profileId?visibility=public|private` — 유저 콘텐츠 목록 (커서 페이지네이션)
3. `PATCH /api/v1/content/:contentId/publish` — 공개/비공개 전환

## Specification

### isPublished 필드
- `Boolean`, `default: false`
- 기존 데이터: 필드 미존재 시 `false`로 간주 (쿼리: `{ $ne: true }` 사용)
- 필터 기반 생성 시: `isPublished=true` 설정
- 커스텀 프롬프트 기반 생성 시: `isPublished=false` 설정

### 콘텐츠 목록 조회
- `visibility=public`: `isPublished=true` && `status=COMPLETED` && `deletedAt=null`
- `visibility=private`: `isPublished` 미설정 또는 `false` && `status=COMPLETED` && `deletedAt=null`
- 타 유저의 `private` 조회 시 빈 목록 반환 (403 아님)
- 정렬: `createdAt` 최신순
- 커서 페이지네이션: `nextCursor` + `hasNext`

### 공개/비공개 전환
- 본인 콘텐츠만 전환 가능 (타인 콘텐츠 시 403)
- `status=COMPLETED`인 콘텐츠만 전환 가능

### 생성 시 isPublished 자동 설정
- 생성 요청의 filterType이 필터 기반(`FILTER_TYPE` 중 커스텀 프롬프트 외)이면 `isPublished=true`
- 커스텀 프롬프트 기반이면 `isPublished=false`

## Acceptance Criteria

1. Content 스키마에 `isPublished` 필드가 `default: false`로 추가된다
2. 기존 콘텐츠(필드 미존재)는 비공개로 간주된다
3. `GET /api/v1/content/user/:profileId?visibility=public` 호출 시 `isPublished=true`인 완료 콘텐츠만 반환된다
4. `GET /api/v1/content/user/:profileId?visibility=private` 호출 시 `isPublished`가 `false` 또는 미설정인 완료 콘텐츠만 반환된다
5. 타 유저의 private 콘텐츠 조회 시 빈 목록을 반환한다
6. 응답에 `nextCursor`와 `hasNext`가 포함된다
7. `PATCH /api/v1/content/:contentId/publish`로 본인 콘텐츠의 공개/비공개를 전환할 수 있다
8. 타인 콘텐츠 전환 시도 시 403을 반환한다
9. 필터 기반 생성 시 `isPublished=true`로 설정된다
10. 커스텀 프롬프트 기반 생성 시 `isPublished=false`로 설정된다

### Implementation Hints

- 커서 페이지네이션: 프로젝트 커서 페이지네이션 스킬 참조
- Content 스키마: `wrtn-backend/apps/meme-api/src/persistence/content/content.schema.ts`
- 마이그레이션 없이 스키마 default + 쿼리 조건으로 처리
