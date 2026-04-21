# be-001 · Content 가시성 스키마 + 기본값 마이그레이션

- **Group**: 001
- **Owner**: be-engineer
- **Depends on**: —

## Target

`backend/apps/meme-api/src/persistence/content/` 및 관련 도메인.

## Context

현재 `Content` 스키마에는 가시성 필드가 없다. Phase 1은 UGC Platform을 위한 공개/비공개 구분의 시작점이며, 앞으로의 MY 탭 3분할(공개/비공개/좋아요)과 타 유저 프로필 공개 피드의 기반이다. 기존 콘텐츠는 전부 "비공개"로 취급해야 한다(PRD — 기존 밈 마이그레이션 규칙).

레포 CLAUDE.md에 정의된 필수 스킬 (`nestjs-architecture`, `backend-ground-rule`, `mongodb-mongoose`)을 준수한다.

## Objective

`Content`에 `isPublished: boolean` 필드를 도입하고, 해당 필드가 없는 기존 문서는 `false`로 간주되게 한다 (스키마 default, 백필 배치 없음 — PRD 지정 "No Batch").

## Specification

### Data
- `Content` 스키마에 `isPublished: boolean` 필드 추가. default=`false`.
- 쿼리 성능 인덱스: `{ userId: 1, isPublished: 1, createdAt: -1 }` 복합 인덱스 신설. 기존 인덱스 구성은 그대로 두고 추가만 한다.

### Behavior
- 필드 부재 문서를 읽을 때 Mongoose가 default(`false`)를 적용함을 단위 테스트로 증명.
- Controller/Service 레이어 변경 최소화. 본 태스크는 스키마와 인덱스만 담당.
- 기존 `status`/`deletedAt` 필드와 독립적으로 동작.

### Out of Scope
- 공개/비공개 토글 API (Phase 2 범위).
- `isPublished=true`를 설정하는 경로 — 본 Phase에서 사용자 토글 경로는 없다.

## Acceptance Criteria

- [ ] `Content` 스키마에 `isPublished` 필드가 존재하고 default=`false`.
- [ ] 필드가 없는 기존 문서 로드 시 `doc.isPublished === false`임을 테스트로 증명.
- [ ] 복합 인덱스 `{ userId, isPublished, createdAt }` 가 MongoDB에 생성됨 (통합 테스트 `db.collection("contents").indexes()` 검증).
- [ ] `schema.spec.ts` 또는 유사 이름의 유닛 테스트에서 default 동작 검증 케이스 포함.
- [ ] `npm run lint` / `npm run typecheck` 에 신규 에러 0.

## Implementation Hints

- 참조: `backend/apps/meme-api/src/persistence/content/content.schema.ts`.
- 참조: `.claude/skills/mongodb-mongoose/SKILL.md` — 스키마 컨벤션 및 인덱스 패턴.
- KB 패턴 correctness-002 주의: API 응답 DTO에서 get 키워드 getter 금지 — 본 태스크는 스키마만 다루지만 후속 태스크의 전제 조건.
