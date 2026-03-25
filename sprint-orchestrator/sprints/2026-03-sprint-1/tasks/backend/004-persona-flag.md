# Task: 004-persona-flag

## Target
- target_api: meme-api
- target_path: apps/meme-api/src/

## Context
- Sprint: 2026-03-sprint-1
- PRD Section: 페르소나 계정 플래그
- API Contract Reference: 페르소나 플래그 관리 (admin API)
  - Contract 위치: ../sprint-orchestrator/sprints/2026-03-sprint-1/api-contract.yaml
- Dependencies: 001-profile-api
- Parallel With: 없음 (004 그룹 단독)

## Objective
사용자 프로필에 isPersona 플래그를 추가하여 페르소나 계정을 식별한다. 페르소나 계정은 알림 제외, 페이백 제외, 팔로우 알림 제외 등 여러 비즈니스 로직에서 특별 처리된다. 관리자 API를 통해 페르소나 플래그를 설정할 수 있다.

## Specification

### Input
- **Admin API: PUT /admin/users/{userId}/persona**
  - Path Parameter: `userId` (string, required)
  - Body: `{ "isPersona": boolean }`
  - Auth: Admin 인증 (기존 admin guard 사용)

### Output
- **PUT /admin/users/{userId}/persona**
  - 200 OK: `{ "userId": string, "isPersona": boolean, "updatedAt": string }`
  - 404 Not Found: 사용자가 존재하지 않는 경우

### Business Rules
1. 사용자 프로필에 `isPersona: boolean` 필드를 추가한다 (default: false).
2. 페르소나 식별은 계정 수준에서 이루어진다.
3. 페르소나 플래그 설정은 관리자만 가능하다.
4. 페르소나 계정 영향 범위:
   - 알림 시스템: 페르소나 계정은 모든 알림에서 제외 (발신/수신).
   - 크레딧 페이백: 페르소나 콘텐츠는 페이백 대상에서 제외.
   - 팔로우: 페르소나를 팔로우할 수 있지만 페르소나에게 알림을 보내지 않음.
5. isPersona 필드는 프로필 조회 API 응답에 포함한다.
6. 기존 사용자는 모두 `isPersona: false`로 간주한다 (default).

## Implementation Hints
- 기존 패턴 참조: user-profile 도메인의 스키마 확장, 기존 admin API 패턴
- 페르소나 체크는 공통 유틸리티/서비스로 분리하여 여러 도메인에서 재사용
- 필수 스킬 참조:
  - `.claude/skills/nestjs-architecture/SKILL.md` — 레이어 구조
  - `.claude/skills/backend-ground-rule/SKILL.md` — 네이밍, DTO, DB 규칙

## Acceptance Criteria
- [ ] 사용자 프로필에 isPersona 필드가 추가되었다
- [ ] Admin API로 페르소나 플래그를 설정/해제할 수 있다
- [ ] 프로필 조회 API 응답에 isPersona가 포함된다
- [ ] 관리자가 아닌 사용자가 플래그 변경 시도 시 권한 에러가 반환된다
- [ ] 존재하지 않는 사용자에 대해 404가 반환된다
- [ ] isPersona 체크 로직이 공통 서비스로 분리되어 있다

## QA Checklist
- [ ] Unit tests 통과
- [ ] Lint/Type check 통과
- [ ] 기존 테스트 regression 없음
- [ ] 수정된 파일이 target_path 범위 내인지 확인
