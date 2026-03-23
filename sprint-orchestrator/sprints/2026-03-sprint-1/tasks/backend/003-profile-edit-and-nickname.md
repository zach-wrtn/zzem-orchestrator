# Task: 003 - 프로필 편집 + 닉네임 자동 생성

## Target
- target_api: meme-api
- target_path: apps/meme-api/src/

## Context
- Sprint: 2026-03-sprint-1
- PRD Section: US2 AC 2.4, AC 2.6
- API Contract Reference: PUT /profiles/me
- Dependencies: 002 (프로필 API 기반)
- Parallel With: app/002

## Objective
프로필 편집 API (닉네임, 프로필 이미지 변경)와 최초 가입 시 닉네임 자동 생성 로직을 구현한다.

## Specification

### Input
- PUT /profiles/me: `{ nickname?: string, profileImageUrl?: string | null }`

### Output
- ProfileResponse (002 태스크와 동일 스키마)

### Business Rules
1. 닉네임 변경은 제한 없이 자유롭게 가능 (7일 제한 없음)
2. 닉네임: 1~20자, 빈 문자열 불가
3. 최초 가입 시 시스템이 닉네임 자동 생성 (예: "형용사+동물+랜덤숫자4자리")
4. 프로필 이미지: URL 또는 null (기본 이미지 사용)
5. 닉네임 중복 허용 (고유성 체크 불필요)

## Implementation Hints
- 기존 패턴 참조: `apps/meme-api/src/admin/user-profile/` (CRUD 패턴)
- 닉네임 자동 생성: 형용사 배열 + 동물 배열 + 4자리 랜덤 숫자 조합
- 자동 생성 로직은 Domain 레이어에 NicknameGeneratorService로 분리
- **필수 스킬 참조:**
  - `.claude/skills/nestjs-architecture/SKILL.md`
  - `.claude/skills/backend-ground-rule/SKILL.md`

## Acceptance Criteria
- [ ] PUT /profiles/me 로 닉네임 변경 가능
- [ ] PUT /profiles/me 로 프로필 이미지 변경 가능
- [ ] 닉네임 1~20자 유효성 검증
- [ ] 최초 유저 생성 시 닉네임 자동 생성 로직 동작
- [ ] 자동 생성 닉네임 포맷: 한글 형용사 + 한글 동물 + 4자리 숫자

## QA Checklist
- [ ] Unit tests 통과 (유효성 검증, 자동 생성 로직)
- [ ] TypeScript 컴파일 에러 없음
- [ ] Lint 통과
- [ ] 기존 테스트 regression 없음
