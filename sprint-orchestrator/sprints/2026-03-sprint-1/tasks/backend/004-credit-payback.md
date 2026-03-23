# Task: 004 - 크레딧 페이백 로직

## Target
- target_api: meme-api
- target_path: apps/meme-api/src/

## Context
- Sprint: 2026-03-sprint-1
- PRD Section: US4 (크레딧 페이백), AC 4.1~4.4
- API Contract Reference: GET /payback/config (조회만, 페이백 실행은 내부 로직)
- Dependencies: 001 (콘텐츠 공개 상태 필요)
- Parallel With: app/003

## Objective
타 유저의 공개 콘텐츠를 재생성할 때 원본 소유자에게 생성 비용의 1% 크레딧을 페이백하는 로직을 구현한다.
기존 크레딧 시스템 API를 활용하여 적립한다.

## Specification

### Input
- 내부 호출: 재생성(generation) 완료 시 트리거
- GET /payback/config: 인증 토큰

### Output
- 내부: 크레딧 적립 결과 (성공/실패/스킵)
- GET /payback/config: `{ paybackRatePercent, creditType }`

### Business Rules
1. 페이백 비율 = 생성 비용의 1% (Config 환경변수로 변경 가능)
2. 페이백 전 마진 체크 수행 — 적자 방지
3. 크레딧 타입 = 프로모션 크레딧 (유료 크레딧과 구분)
4. 소수점 처리 = 올림 후 점수 단위 (예: 1.2 → 2크레딧)
5. 마진에서 차감하지 않고 마진에 포함하여 계산
6. 마진 압박 시 최저 0.1% 하한까지 축소 가능
7. 페르소나 계정 콘텐츠 재생성 시 페이백 적립 대상 없음
8. 셀프 재생성 시 페이백 미적립
9. 비공개 콘텐츠 재생성 시 페이백 미적립

## Implementation Hints
- 기존 크레딧 시스템 API 확인 (infrastructure/credit 또는 유사 모듈)
- 재생성 완료 이벤트를 감지하는 위치 확인 (generation flow에 hook)
- 페이백 비율은 Config/환경변수로 관리 — `PAYBACK_RATE_PERCENT=1.0`
- 마진 체크 로직: `margin = revenue - cost - payback >= 0`
- **필수 스킬 참조:**
  - `.claude/skills/nestjs-architecture/SKILL.md`
  - `.claude/skills/backend-ground-rule/SKILL.md`

### 레이어 구현 순서
1. Domain: PaybackDomainService (비율 계산, 마진 체크, 페르소나 체크)
2. Persistence: PaybackHistory 스키마 (페이백 이력 기록)
3. Application: PaybackAppService (재생성 이벤트 → 페이백 실행)
4. Application: PaybackConfigAppController (설정 조회 API)

## Acceptance Criteria
- [ ] 타 유저 공개 콘텐츠 재생성 시 1% 크레딧 페이백 적립
- [ ] 마진 체크 통과 시에만 페이백 실행
- [ ] 소수점 올림 처리 (1.2 → 2)
- [ ] 페르소나 계정 콘텐츠 재생성 시 페이백 스킵
- [ ] 셀프 재생성 시 페이백 스킵
- [ ] 비공개 콘텐츠 재생성 시 페이백 스킵
- [ ] 페이백 이력이 DB에 기록됨
- [ ] GET /payback/config 로 현재 설정 조회 가능

## QA Checklist
- [ ] Unit tests 통과 (마진 체크, 올림 계산, 스킵 조건들)
- [ ] TypeScript 컴파일 에러 없음
- [ ] Lint 통과
- [ ] 기존 테스트 regression 없음
