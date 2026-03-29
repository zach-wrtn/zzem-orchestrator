# Task: 006-social-ui

## Target
app-core-packages/apps/MemeApp

## Context
- PRD US7: 타유저 프로필 및 사회적 기능 (AC 7.1~7.5)
- 타유저 프로필: 게시물 탭만, 더보기 메뉴 (프로필 URL 복사, 차단, 신고)
- API Contract: GET /profiles/{userId}, POST/DELETE /blocks, POST /reports, POST /feedbacks

## Objective
타유저 프로필 화면, 차단/차단해제 UI, 신고 시트, 의견 보내기 화면을 구현한다.

## Specification

### Screens / Components
- **OtherProfileScreen**: 타유저 프로필
  - 프로필 이미지, 닉네임, 팔로워/팔로잉/재생성된 카운트
  - 게시물 탭만 노출 (비공개/좋아요 탭 미노출)
  - FollowButton (Group 004), 의견 보내기 버튼 (말풍선 아이콘)
  - 더보기 메뉴: 프로필 URL 복사, 차단하기, 신고하기
- **BlockConfirmSheet**: 차단 확인 바텀시트
- **BlockedProfileView**: 차단된 프로필 진입 시 "이 계정을 차단했어요" + 차단 해제 버튼
- **ReportSheet**: 신고 사유 선택 + 자유 입력 (100자)
- **FeedbackScreen**: 의견 보내기 (300자 텍스트 + contentId 자동 첨부)
- **세로 스와이프 진입**: 타유저 프로필의 게시물 탭에서 콘텐츠 탭 시 세로 스와이프

### Data Flow
- Domain: `useBlockUserUseCase()`, `useUnblockUserUseCase()`, `useReportUserUseCase()`, `useSendFeedbackUseCase()`, `useGetUserProfileUseCase(userId)`
- Data: BlockRepository, ReportRepository, FeedbackRepository
- 타유저 콘텐츠: GET /contents/{userId}/published

### Implementation Hints
- 기존 BottomSheet, Modal 컴포넌트 활용
- 기존 feedback 화면 패턴 참조 (presentation/feedback/)
- OtherProfileScreen → RootStackParamList에 추가 (params: { userId: string })

## Acceptance Criteria
- [ ] 타유저 프로필에 프로필 이미지, 닉네임, 카운터가 표시된다
- [ ] 타유저 프로필에 게시물 탭만 노출된다
- [ ] 게시물 탭에 해당 유저의 공개 콘텐츠가 그리드로 표시된다
- [ ] 더보기 메뉴에서 "차단하기" 탭 시 확인 바텀시트가 표시된다
- [ ] 차단 확인 후 차단 처리되고 프로필이 BlockedProfileView로 전환된다
- [ ] BlockedProfileView에서 차단 해제 버튼이 동작한다
- [ ] 더보기 메뉴에서 "신고하기" 탭 시 신고 사유 선택 시트가 표시된다
- [ ] 신고 시 사유 선택 + 자유 입력(100자 이내) 후 제출된다
- [ ] 의견 보내기 버튼 탭 시 FeedbackScreen으로 이동한다
- [ ] FeedbackScreen에서 300자 이내 텍스트 입력 후 전송된다
- [ ] 더보기 메뉴에서 "프로필 URL 복사" 탭 시 클립보드에 복사된다
