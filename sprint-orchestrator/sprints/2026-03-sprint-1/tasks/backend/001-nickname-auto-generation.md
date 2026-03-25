# Task: 001-nickname-auto-generation

## Target
- target_api: meme-api
- target_path: apps/meme-api/src/

## Context
- Sprint: 2026-03-sprint-1
- PRD Section: 닉네임 자동 생성
- API Contract Reference: 닉네임 자동 생성 로직 (사용자 생성 시 내부 호출)
  - Contract 위치: ../sprint-orchestrator/sprints/2026-03-sprint-1/api-contract.yaml
- Dependencies: 없음
- Parallel With: 001-content-publish-status, 001-profile-api

## Objective
사용자가 처음 생성될 때 자동으로 닉네임을 부여한다. 형식은 "형용사 + 랜덤숫자" (예: "빛나는별1234")이며, 닉네임 변경은 횟수 제한 없이 자유롭게 가능하다.

## Specification

### Input
- 내부 호출: 사용자 최초 생성 시 자동 트리거
- 닉네임 변경은 기존 프로필 수정 API를 통해 처리

### Output
- 자동 생성된 닉네임이 사용자 프로필에 저장됨
- 형식: `{형용사}{랜덤숫자 4자리}` (예: "빛나는별1234")

### Business Rules
1. 사용자 최초 생성 시 닉네임이 자동으로 생성된다.
2. 닉네임 형식: 한글 형용사 + 랜덤 숫자 4자리 (예: "빛나는별1234", "즐거운하늘5678").
3. 형용사 풀은 코드 내에 상수로 관리한다 (최소 20개 이상).
4. 닉네임 중복 검사는 하지 않는다 (랜덤 숫자로 충분한 분산).
5. 닉네임 변경은 무제한, 제한 없음.
6. 닉네임 변경 시 별도의 유효성 검사는 빈 문자열 체크만 수행한다.

## Implementation Hints
- 기존 패턴 참조: user-profile 도메인의 사용자 생성 로직
- 형용사 풀은 상수 파일(constants)로 분리하여 관리
- 필수 스킬 참조:
  - `.claude/skills/nestjs-architecture/SKILL.md` — 레이어 구조
  - `.claude/skills/backend-ground-rule/SKILL.md` — 네이밍, DTO, DB 규칙

## Acceptance Criteria
- [ ] 사용자 최초 생성 시 닉네임이 자동으로 부여된다
- [ ] 닉네임 형식이 "형용사 + 4자리 숫자" 패턴을 따른다
- [ ] 형용사 풀이 20개 이상 정의되어 있다
- [ ] 닉네임 변경이 횟수 제한 없이 가능하다
- [ ] 빈 닉네임으로 변경 시도 시 에러가 반환된다

## QA Checklist
- [ ] Unit tests 통과
- [ ] Lint/Type check 통과
- [ ] 기존 테스트 regression 없음
- [ ] 수정된 파일이 target_path 범위 내인지 확인
