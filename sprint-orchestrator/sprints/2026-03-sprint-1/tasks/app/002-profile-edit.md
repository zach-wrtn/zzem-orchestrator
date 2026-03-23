# Task: 002 - 프로필 편집 화면

## Target
- target_app: MemeApp
- target_path: apps/MemeApp/src/presentation/profile/

## Context
- Sprint: 2026-03-sprint-1
- PRD Section: US2 AC 2.4
- API Contract Reference: PUT /profiles/me
- Dependencies: app/001 (프로필 화면 기반), backend/003
- Parallel With: backend/003

## Objective
프로필 편집 화면을 구현한다. 프로필 이미지와 닉네임을 수정할 수 있다.

## Specification

### Input
- 프로필 화면 → "프로필 편집" 버튼 탭

### Output
- 프로필 이미지 변경 (갤러리 선택)
- 닉네임 입력 필드 (1~20자)
- 저장 버튼

### Business Rules
1. 닉네임 변경 제한 없음 (7일 제한 삭제됨)
2. 닉네임 1~20자
3. 저장 성공 시 프로필 화면으로 돌아가며 갱신된 정보 표시

## Implementation Hints
- 기존 패턴 참조: `src/domain/user/user.usecase.ts` (유저 정보 관련)
- 이미지 선택: 기존 이미지 피커 활용 또는 react-native-image-picker
- useMutation으로 PUT /profiles/me 호출
- 성공 시 profileQueryKey 캐시 무효화

### 클린 아키텍처 구현 순서
1. Domain: useUpdateProfileUseCase (useMutation 래핑)
2. Data: profileRepository.updateProfile()
3. Presentation: ProfileEditScreen (이미지 선택 + 닉네임 입력 + 저장)
4. Navigation: RootStackParamList에 ProfileEdit 화면 추가

## Acceptance Criteria
- [ ] 프로필 편집 화면 진입 가능
- [ ] 닉네임 수정 후 저장 가능
- [ ] 프로필 이미지 변경 후 저장 가능
- [ ] 저장 성공 시 프로필 화면에 갱신된 정보 반영
- [ ] 닉네임 1~20자 유효성 검증

## QA Checklist
- [ ] TypeScript 컴파일 에러 없음
- [ ] Lint 통과
- [ ] 기존 테스트 regression 없음
