# app-005 · 프로필 편집 (이미지 + 닉네임)

- **Group**: 003
- **Owner**: fe-engineer
- **Depends on**: app-003 (진입점), be-002 (PATCH /me/profile)

## Target

`app/apps/MemeApp/src/presentation/profile/edit/` (신규).

## Context

AC 2.4: 프로필 페이지 "프로필 편집" 버튼 → 이미지·닉네임 수정. 이미지는 카메라 촬영 또는 앨범 선택. 닉네임 2~20자, 제한 없이 자유 변경.

MemeApp 기존 자산:
- `shared/lib/image/image-library.ts` — `takePhoto()`, `pickImageFromLibrary()`.
- `presentation/image/image-cropper.screen.tsx` — 크롭 플로우.
- FileAppService 기반 presigned URL 업로드는 BE에 존재.

## Objective

유저가 프로필 이미지와 닉네임을 수정하고 저장할 수 있는 화면을 제공한다.

## Specification

### Screens / Components
- **ProfileEditScreen** (신규):
  - 헤더: "프로필 편집" 타이틀 + 좌측 back + 우측 "저장" 버튼.
  - 프로필 이미지 영역: 현재 이미지 + "변경" 액션 → ActionSheet (카메라 / 앨범).
  - 닉네임 인풋: TextInput + 글자 카운트(`n/20`). 2자 미만이면 저장 비활성 + 인라인 에러.
  - 선택 필드(bio/link)는 본 태스크에서 **렌더만 옵션**. PRD에 명시되지 않으면 skip 가능.

### Behavior
- 이미지 변경:
  1. 카메라/앨범 선택 → `PickedImage` → (옵션) 크롭 → presigned URL 업로드 → `fileUuid` 획득.
  2. 저장 버튼 탭 시 `PATCH /v2/me/profile` with `{ nickname, profileImageFileUuid }`.
- 닉네임 검증(FE): 2~20자. 초과·미달 시 저장 비활성.
- 저장 성공 시:
  - 프로필 화면으로 이동(back) + react-query `invalidateQueries`로 MY 프로필 재조회.
  - 토스트 "프로필이 업데이트 되었어요" 표기 (기존 토스트 패턴 사용).
- 저장 실패 시: 에러 토스트 + 버튼 enable 복귀.

### KB Contract Clauses
- completeness-001 (critical): 진입점은 app-003의 "프로필 편집" 버튼이 담당하므로, 본 태스크에서 ProfileEditScreen으로의 navigation 호출이 해당 버튼 핸들러와 연결돼 있는지 확인.
- completeness-002 (major, freq 1): 업로드 훅(`useUploadProfileImage` 류)과 mutation 훅이 실제 호출됨을 확인. 데드 훅 금지.
- integration-001 (critical): PATCH 요청 body 필드명이 api-contract.yaml의 `UpdateProfileRequest`와 정확히 일치.

### Tests
- Maestro flow 신규: `profile-edit.yaml`
  - `zzem://e2e-auth?...` → 프로필 탭 → 편집 진입(openLink `zzem://profile/edit`).
  - 닉네임 인풋 `inputText`(iOS Fabric TextInput 래핑 필요 — shared/constants/test-ids 참고) + 저장 `assertVisible`.
  - CTA 검증 타협: 실제 저장 결과는 Evaluator 코드 추적.
- Unit: 닉네임 validator 경계(1자/2자/20자/21자).

## Acceptance Criteria

- [ ] 프로필 편집 화면이 라우트 등록되고 `zzem://profile/edit` 딥링크로 진입 가능.
- [ ] 카메라 / 앨범 선택 → presigned URL 업로드 → fileUuid PATCH 흐름 전 구간 동작.
- [ ] 닉네임 1자·21자에서 저장 버튼 비활성.
- [ ] 저장 성공 시 MY 프로필 react-query 캐시 invalidate.
- [ ] Maestro `profile-edit.yaml` 통과.
- [ ] `npm run typecheck` 신규 에러 0.

## Implementation Hints

- 참조: `shared/lib/image/image-library.ts`, `presentation/image/image-cropper.screen.tsx`.
- 참조: BE `FileAppService.generatePutPresignedUrl` 응답 구조 (putPresignedUrl/getPresignedUrl/fileUuid/signedHeaders).
- ActionSheet: MemeApp 기존 bottom sheet 패턴 사용 (검색).
- iOS Fabric TextInput testID: `shared/constants/test-ids.ts` README 주석 확인.
