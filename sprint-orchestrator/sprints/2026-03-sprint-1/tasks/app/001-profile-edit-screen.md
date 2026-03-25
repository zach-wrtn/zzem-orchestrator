# Task: 001-profile-edit-screen

## Target
- target_app: MemeApp
- target_path: apps/MemeApp/src/

## Context
- Sprint: 2026-03-sprint-1
- PRD Section: US2 프로필 (AC 2.4, AC 2.6), 비즈니스 룰 - 프로필 규칙
- API Contract Reference:
  - PUT /profiles/me/edit (updateMyProfile) — multipart/form-data
  - Contract 위치: ../sprint-orchestrator/sprints/2026-03-sprint-1/api-contract.yaml
- Dependencies: 없음
- Parallel With: backend/001-profile-api, backend/001-nickname-auto-generation, app/001-profile-screen

## Objective
프로필 편집 화면을 구현한다. 사용자가 닉네임과 프로필 이미지를 자유롭게 변경할 수 있으며, 이미지 선택 시 크롭 기능을 제공하고 multipart/form-data로 서버에 업로드한다.

## Specification

### Screens / Components
- `ProfileEditScreen` — 프로필 편집 화면
- `ProfileImagePicker` — 프로필 이미지 선택 + 크롭 컴포넌트
- `NicknameInput` — 닉네임 입력 필드

### User Interactions
1. ProfileScreen에서 "프로필 편집" 버튼 탭 → ProfileEditScreen 진입
2. 현재 프로필 이미지와 닉네임이 pre-fill된 상태로 표시
3. 프로필 이미지 영역 탭 → 이미지 피커 (갤러리 선택) → 크롭 UI → 미리보기 반영
4. 닉네임 입력 필드에서 자유롭게 수정 (제한 없음, maxLength: 20)
5. "저장" 버튼 탭 → PUT /profiles/me/edit (multipart/form-data: nickname, profileImage) 호출
6. 성공 → ProfileScreen으로 navigate back, 프로필 데이터 리프레시
7. 실패 → 에러 토스트 노출

### Business Rules
1. 닉네임 변경은 제한 없이 자유롭게 가능 (7일 제한 없음)
2. 닉네임 최대 길이: 20자
3. 프로필 이미지는 갤러리에서 선택 후 크롭하여 업로드
4. multipart/form-data 형식으로 닉네임과 이미지를 함께 전송
5. 닉네임만 변경 시 profileImage 필드 생략 가능
6. 이미지만 변경 시 nickname 필드 생략 가능

## Interaction States

### ProfileEditScreen
- **저장 중**: "저장" 버튼 로딩 상태 (스피너) + 입력 필드 disabled
- **저장 성공**: navigate back + 프로필 리프레시 (토스트 없음, 즉시 반영)
- **저장 실패**: 에러 토스트 "저장에 실패했어요. 다시 시도해 주세요" + 입력 상태 유지
- **이미지 업로드 실패**: 에러 토스트 "이미지 업로드에 실패했어요" + 이전 이미지 유지
- **갤러리 권한 거부**: 설정 이동 안내 alert

### NicknameInput
- **빈 입력**: "저장" 버튼 disabled (닉네임 필수)
- **20자 초과 입력 방지**: maxLength 적용, 초과 입력 자동 차단

## Implementation Hints
- 기존 패턴 참조: 기존 이미지 업로드 패턴 (콘텐츠 생성 플로우의 이미지 선택 로직)
- 이미지 크롭: react-native-image-crop-picker 또는 기존 프로젝트에 설치된 이미지 라이브러리 활용
- Domain: useUpdateMyProfile mutation 훅, ProfileRepository.updateProfile 인터페이스
- Data: multipart/form-data FormData 빌드 로직, profileRepositoryImpl.updateProfile
- Presentation: ProfileEditScreen, useProfileEditViewModel
- 저장 성공 후 profileQueryKeys 무효화하여 ProfileScreen 리프레시
- 키보드 회피: KeyboardAvoidingView 또는 기존 프로젝트의 키보드 핸들링 패턴 적용
- 접근성: 프로필 이미지 영역 accessibilityLabel="프로필 이미지 변경", 저장 버튼 accessibilityRole="button"
- 필수 스킬 참조:
  - `.claude/skills/rn-architecture/SKILL.md`
  - `.claude/skills/stylev2-rn-tailwind/SKILL.md`

## Acceptance Criteria
- [ ] 프로필 편집 화면이 현재 닉네임/이미지로 pre-fill되어 표시된다
- [ ] 닉네임을 자유롭게 수정할 수 있다 (20자 제한)
- [ ] 프로필 이미지를 갤러리에서 선택 후 크롭할 수 있다
- [ ] 저장 버튼 탭 시 PUT /profiles/me/edit API가 multipart/form-data로 호출된다
- [ ] 저장 성공 시 ProfileScreen으로 돌아가고 프로필이 갱신된다
- [ ] 저장 실패 시 에러 토스트가 노출된다
- [ ] 닉네임만 또는 이미지만 변경해도 정상 동작한다

## QA Checklist
- [ ] Unit tests 통과
- [ ] Lint/Type check 통과
- [ ] 기존 테스트 regression 없음
- [ ] 수정된 파일이 target_path 범위 내인지 확인
