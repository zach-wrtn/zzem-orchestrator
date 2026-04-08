# Sprint Contract: Group 003 — Other User Profile + Post-Generation Landing

## Scope
- **Tasks**: app/005-other-user-profile
- **Endpoints**: (uses existing endpoints from Group 1: GET /user-profile/:profileId, GET /content/user/:profileId)

## Lessons from Group 1 & 2
- Clean Architecture: usecase 훅은 presentation 레이어에만
- 네비게이션 진입점: 모든 화면 간 이동 경로를 빠뜨리지 않을 것
- 훅 생성 시 반드시 호출부도 구현
- Zod nullable 필수

## Done Criteria

### 타 유저 프로필 (AC 7.1)
- [ ] 세로 스와이프 피드의 프로필 영역 탭 시 해당 유저의 프로필 화면으로 이동
- [ ] 타 유저 프로필에 게시물 탭만 노출 (비공개/좋아요 탭 미노출)
- [ ] 타 유저 프로필에 "프로필 편집" / "프로필 공유" 버튼 미노출
- [ ] 더보기(⋯) 메뉴에 "프로필 URL 복사" 노출
- [ ] 프로필 URL 복사 시 클립보드에 딥링크 복사
- [ ] 타 유저 프로필의 콘텐츠 탭 시 세로 스와이프 피드 진입 (해당 유저 콘텐츠만)

### 생성 후 랜딩 (AC 2.7)
- [ ] 필터 기반 밈 생성 완료 후 프로필 화면의 게시물(공개) 탭으로 랜딩
- [ ] 커스텀 프롬프트 기반 생성 완료 후 프로필 화면의 비공개 탭으로 랜딩
- [ ] 생성 중/생성 실패 상태가 해당 탭에서 노출
- [ ] 이 규칙은 생성 직후 진입에만 적용, 일반 진입은 AC 2.1 규칙

### 페르소나 (AC 7.5)
- [ ] isPersona 플래그에 따른 분기 처리 (프로필 진입 시 생성 화면 이동)

## Verification Method
- 네비게이션 흐름 추적: SwipeFeed → OtherUserProfile → SwipeFeed 순환
- ProfileScreen 재사용: isOwnProfile prop으로 MY/Other 분기 검증
- 생성 후 랜딩: navigation params의 initialTab 전달 검증
- Clean Architecture 준수 확인
