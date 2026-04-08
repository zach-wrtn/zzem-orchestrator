# Task 003: 프로필 편집

- **Group**: 2
- **AC**: 2.3, 2.4, 2.6

## Target

프로필 편집 화면(닉네임 변경 + 이미지 변경)과 프로필 공유 기능을 구현한다.

## Context

- 프로필 화면(Task 002)에서 "프로필 편집" 버튼과 "프로필 공유" 버튼 진입
- API: `PATCH /api/v1/user-profile/me`, `GET /api/v1/user-profile/share/:profileId`
- 닉네임 자동 생성: 최초 프로필 생성 시 `GET /api/v1/nickname/generate` 호출
- 프로필 이미지 변경: 카메라 촬영 또는 앨범 선택
- 기존 `ImageCropperScreen` 존재

## Objective

프로필 편집 화면과 프로필 공유 기능을 구현한다.

## Specification

### 프로필 편집 화면
- 프로필 이미지 변경: 카메라 촬영 / 앨범 선택 선택지 노출 → 이미지 선택 → 크롭 → 업로드
- 닉네임 변경: 텍스트 입력, 2~20자 실시간 검증
- 저장 버튼: 변경사항 있을 때만 활성화

### 프로필 공유
- OS 기본 공유 시트 호출
- 프로필 딥링크 URL 포함 (OG Image 미포함)

### 닉네임 자동 생성
- 최초 프로필 생성 시 (프로필이 없는 유저가 처음 앱에 진입할 때) 자동으로 닉네임 생성 API 호출하여 설정
- 유저는 이후 프로필 편집에서 자유롭게 변경 가능

### Screens / Components
- `ProfileEditScreen` — 프로필 편집 화면
- 프로필 공유: Share API 호출 (React Native Share)

## Acceptance Criteria

1. "프로필 편집" 버튼 탭 시 프로필 편집 화면으로 이동한다
2. 프로필 이미지 영역 탭 시 카메라/앨범 선택지가 노출된다
3. 이미지 선택 후 크롭 화면을 거쳐 프로필 이미지가 변경된다
4. 닉네임 입력 시 2자 미만이면 저장 버튼이 비활성화된다
5. 닉네임 입력 시 20자 초과 입력이 불가능하다
6. 변경사항 저장 시 프로필 화면에 즉시 반영된다
7. "프로필 공유" 버튼 탭 시 OS 공유 시트가 호출되며 딥링크 URL이 포함된다
8. 최초 프로필 생성 시 자동으로 "형용사+동물+숫자" 포맷의 닉네임이 설정된다

### Implementation Hints

- React Native Share API 참조
- 기존 `ImageCropperScreen` 재사용 (`~/presentation/image/`)
- `useMutation` 패턴 참조 (`~/domain/`)
