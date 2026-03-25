# Task: 003-block-report-ui

## Target
- target_app: MemeApp
- target_path: apps/MemeApp/src/

## Context
- Sprint: 2026-03-sprint-1
- PRD Section: US7 타 유저 프로필 및 사회적 기능 (AC 7.1, AC 7.2, AC 7.3, AC 7.4)
- API Contract Reference:
  - POST /blocks/{targetUserId} (blockUser)
  - DELETE /blocks/{targetUserId} (unblockUser)
  - POST /reports (reportContent)
  - POST /opinions (sendOpinion)
  - Contract 위치: ../sprint-orchestrator/sprints/2026-03-sprint-1/api-contract.yaml
- Dependencies: app/001-profile-screen (타 유저 프로필 화면 필요), app/002-follow-ui (팔로우 해제 연동)
- Parallel With: backend/003-block-report-api, backend/003-opinion-api, app/003-notification-center

## Objective
타 유저 프로필의 "더보기" 메뉴에서 차단/신고 기능을 제공하고, 독립 말풍선 아이콘에서 의견 보내기 기능을 구현한다. 차단된 프로필은 차단 상태 UI를 표시하며, 신고는 사유 선택 + 자유 입력으로 구성한다.

## Specification

### Design Tokens
- **ProfileMoreMenu**: bg #FFFFFF, borderRadius 12, shadow elevation 4, item height 48, separator #F5F5F5
- **BlockConfirmBottomSheet "차단" 버튼**: bg #D33717, text white (destructive action)
- **BlockedProfileView**: center layout, text #8E8E8E, "차단 해제" 버튼 outline #8752FA
- **ReportScreen 사유 선택**: radio button active #8752FA
- **OpinionScreen 글자수 카운터**: text #8E8E8E, 300자 초과 시 #D33717

### Screens / Components
- `ProfileMoreMenu` — 타 유저 프로필 "더보기" 메뉴 (프로필 URL 복사, 차단하기, 신고하기)
- `BlockConfirmBottomSheet` — 차단 확인 바텀시트
- `BlockedProfileView` — 차단된 유저 프로필 상태 뷰 ("이 계정을 차단했어요" + 차단 해제 버튼)
- `ReportScreen` — 신고 화면 (사유 선택 + 자유 텍스트 입력)
- `OpinionButton` — 의견 보내기 말풍선 아이콘 버튼
- `OpinionScreen` — 의견 보내기 화면 (텍스트 입력, 300자)

### User Interactions
1. 타 유저 프로필에서 "더보기(...)'' 아이콘 탭 → ProfileMoreMenu 노출
   - "프로필 URL 복사" → 클립보드에 프로필 URL 복사 + 토스트
   - "차단하기" → BlockConfirmBottomSheet 노출
   - "신고하기" → ReportScreen 진입
2. BlockConfirmBottomSheet에서 "차단" 확인 → POST /blocks/{targetUserId} → 차단 상태 반영
3. 차단 후 프로필 → BlockedProfileView 표시 ("이 계정을 차단했어요")
4. BlockedProfileView에서 "차단 해제" 탭 → DELETE /blocks/{targetUserId} → 프로필 정상 표시 복원
5. ReportScreen: 사유 선택 (spam, inappropriate, copyright, other) → 자유 텍스트 입력 (100자 필수) → POST /reports
6. 타 유저 프로필에서 팔로우 버튼 옆 말풍선 아이콘 탭 → OpinionScreen 진입
7. OpinionScreen: 자유 텍스트 입력 (300자) → POST /opinions (targetUserId + message + contentId 자동 첨부)

### Business Rules
1. 차단 시 A→B 팔로우만 해제, B→A 팔로우는 유지
2. 차단 사실은 상대방에게 미통지
3. 차단 시 좋아요 데이터: DB 유지, 노출만 차단. 차단 해제 시 다시 보임
4. 차단된 프로필 진입 시 콘텐츠 미노출, "이 계정을 차단했어요" + 차단 해제 버튼만 표시
5. 차단 해제는 언제든 가능
6. 신고 사유 선택 필수 (enum: spam, inappropriate, copyright, other)
7. 신고 자유 텍스트 필수, 100자 이내
8. 신고 사실은 상대방에게 미통지
9. 의견 보내기: 300자 이내, contentId는 현재 보고 있는 콘텐츠 자동 첨부 (optional)
10. 신고한 유저에게는 해당 콘텐츠 미노출 (서버 측 필터링, ~1시간 지연)

## Interaction States

### BlockConfirmBottomSheet
- **차단 API 호출 중**: "차단" 버튼 로딩 상태
- **차단 실패**: 토스트 "차단에 실패했어요" + 바텀시트 유지

### BlockedProfileView
- **차단 해제 중**: "차단 해제" 버튼 로딩 상태
- **차단 해제 실패**: 토스트 "차단 해제에 실패했어요"

### ReportScreen
- **사유 미선택**: "신고" 버튼 disabled
- **텍스트 미입력 또는 빈 입력**: "신고" 버튼 disabled
- **제출 중**: "신고" 버튼 로딩 상태
- **제출 성공**: 성공 토스트 "신고가 접수되었어요" + 자동 navigate back
- **제출 실패**: 에러 토스트 + 입력 상태 유지

### OpinionScreen
- **빈 입력**: "보내기" 버튼 disabled
- **제출 중**: "보내기" 버튼 로딩 상태
- **제출 성공**: 성공 토스트 "의견이 전달되었어요" + 자동 navigate back
- **제출 실패**: 에러 토스트 + 입력 상태 유지

## Implementation Hints
- 기존 패턴 참조: 기존 바텀시트 컴포넌트, 모달 패턴
- Domain: useBlockUser / useUnblockUser mutation, useReportContent mutation, useSendOpinion mutation
- Data: BlockDto, ReportDto, OpinionDto, 각 Mapper 및 repositoryImpl
- Presentation: ProfileMoreMenu (ActionSheet 또는 BottomSheet), BlockConfirmBottomSheet, BlockedProfileView, ReportScreen, OpinionScreen
- ProfileResponse의 isBlocked 필드로 차단 상태 판별
- 차단 후 프로필 쿼리 무효화하여 UI 갱신
- 클립보드: Clipboard API (react-native-clipboard)
- 키보드 회피: ReportScreen, OpinionScreen에서 KeyboardAvoidingView 적용
- 접근성: ProfileMoreMenu 항목 accessibilityRole="menuitem", 차단 확인 바텀시트 accessibilityLabel 포함
- 필수 스킬 참조:
  - `.claude/skills/rn-architecture/SKILL.md`
  - `.claude/skills/stylev2-rn-tailwind/SKILL.md`

## Acceptance Criteria
- [ ] 타 유저 프로필에 "더보기" 메뉴가 노출된다
- [ ] "프로필 URL 복사" 탭 시 클립보드에 URL이 복사되고 토스트가 표시된다
- [ ] 차단 확인 바텀시트가 노출되고 확인 시 차단 API가 호출된다
- [ ] 차단된 프로필에 "이 계정을 차단했어요" 상태가 표시된다
- [ ] 차단 해제 버튼이 동작하고 프로필이 복원된다
- [ ] 신고 화면에서 사유 선택 + 100자 자유 텍스트 입력 후 신고가 접수된다
- [ ] 의견 보내기 말풍선 아이콘이 타 유저 프로필에 노출된다
- [ ] 의견 보내기 화면에서 300자 텍스트 입력 후 전송이 성공한다
- [ ] 차단 시 팔로우 상태가 올바르게 갱신된다

## QA Checklist
- [ ] Unit tests 통과
- [ ] Lint/Type check 통과
- [ ] 기존 테스트 regression 없음
- [ ] 수정된 파일이 target_path 범위 내인지 확인
