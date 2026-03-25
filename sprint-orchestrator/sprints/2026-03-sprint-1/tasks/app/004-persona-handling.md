# Task: 004-persona-handling

## Target
- target_app: MemeApp
- target_path: apps/MemeApp/src/

## Context
- Sprint: 2026-03-sprint-1
- PRD Section: US7 타 유저 프로필 및 사회적 기능 (AC 7.5), 비즈니스 룰 - 알림 규칙, 페이백 규칙
- API Contract Reference:
  - GET /profiles/{userId} (getUserProfile) — isPersona 필드
  - Contract 위치: ../sprint-orchestrator/sprints/2026-03-sprint-1/api-contract.yaml
- Dependencies: app/001-profile-screen, app/002-follow-ui, app/003-notification-center
- Parallel With: backend/004-persona-flag

## Objective
페르소나 계정(콘텐츠 팩토리 운영용 데이터 전용 계정)에 대한 앱 UI 처리를 구현한다. 페르소나 프로필은 일반 유저와 동일한 UX를 유지하되, 푸시/알림 수신 제외 등 내부 정책을 반영한다.

## Specification

### Screens / Components
- 기존 `ProfileScreen` 수정 — isPersona 플래그에 따른 분기 처리
- 기존 `FollowButton` — 페르소나 팔로우 허용 (동일 UX)
- 기존 `FeedCtaButton` — 페르소나 콘텐츠 탭 시 생성 화면 진입 (동일 동작)
- 별도 신규 컴포넌트 불필요 (기존 컴포넌트에 조건 분기 추가)

### User Interactions
1. 피드에서 페르소나 콘텐츠 노출 → 일반 콘텐츠와 동일한 UI (시각적 구분 없음)
2. 페르소나 프로필 진입 → 일반 유저 프로필과 동일한 UX
3. 페르소나 팔로우 → 허용 (FollowButton 동일 동작)
4. 페르소나 콘텐츠에서 CTA 탭 → 생성 화면 진입 (타인 콘텐츠와 동일: "템플릿 사용하기")
5. 페르소나 콘텐츠 좋아요 → 허용

### Business Rules
1. 페르소나 계정은 UX상 일반 유저와 시각적 구분 없음
2. 페르소나 팔로우: 가능. 단, 페르소나 측에 팔로우 알림 발송 안 함 (서버 측 처리)
3. 페르소나 콘텐츠 좋아요: 가능
4. 페르소나 콘텐츠 재생성 시 페이백 적립 대상 없음 (서버 측 처리, 클라이언트 분기 불필요)
5. 페르소나 계정은 푸시/알림센터 발송 대상에서 제외 (서버 측 처리)
6. 앱 클라이언트에서 isPersona 플래그 기반으로 별도 UI 분기가 필요한 경우 대비하여 ProfileResponse.isPersona 필드를 저장/전달

## Implementation Hints
- 기존 패턴 참조: ProfileScreen, FollowButton, FeedCtaButton 등 기존 구현
- 대부분의 페르소나 처리는 서버 측에서 수행 (알림 미발송, 페이백 미적립)
- 클라이언트는 isPersona 필드를 Profile 엔티티에 포함시키고, 향후 확장 가능하도록 분기 포인트만 마련
- 현재 스프린트에서는 클라이언트 측 시각적 구분 없음 — isPersona에 따른 UI 숨김/변경 처리 없음
- Domain: Profile 엔티티에 isPersona: boolean 필드 포함 확인
- 필수 스킬 참조:
  - `.claude/skills/rn-architecture/SKILL.md`
  - `.claude/skills/stylev2-rn-tailwind/SKILL.md`

## Acceptance Criteria
- [ ] 페르소나 프로필이 일반 유저와 동일한 UI로 표시된다 (시각적 구분 없음)
- [ ] 페르소나 팔로우가 정상 동작한다
- [ ] 페르소나 콘텐츠 좋아요가 정상 동작한다
- [ ] 페르소나 콘텐츠 CTA 탭 시 생성 화면으로 정상 진입한다
- [ ] Profile 엔티티에 isPersona 필드가 포함되어 있다
- [ ] isPersona 플래그가 ProfileResponse에서 올바르게 매핑된다

## QA Checklist
- [ ] Unit tests 통과
- [ ] Lint/Type check 통과
- [ ] 기존 테스트 regression 없음
- [ ] 수정된 파일이 target_path 범위 내인지 확인
