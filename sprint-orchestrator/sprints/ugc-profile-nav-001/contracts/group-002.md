# Sprint Contract: Group 002 — Profile Edit + Nickname + Settings

## Scope
- **Tasks**: backend/003-nickname-generator, app/003-profile-edit, app/004-settings-screen
- **Endpoints**: `GET /api/v1/nickname/generate`

## Lessons from Group 1
- 커서 페이지네이션: controller에서 재래핑 금지
- DTO 필드명: API contract 필드명 BE/FE 동일 사용
- Clean Architecture: usecase 훅은 presentation 레이어에 배치
- Zod nullable: null 가능 필드에 `.nullable()` 필수

## Done Criteria

### Backend
- [ ] `GET /api/v1/nickname/generate` 호출 시 `{ nickname: string }` 반환
- [ ] 닉네임 포맷: `{형용사}{동물}{4자리숫자}` (예: 빛나는고양이1234)
- [ ] 형용사 목록 최소 20개, 동물 목록 최소 20개 (한국어)
- [ ] 닉네임 길이 2~20자 이내
- [ ] 동일 요청 2회 호출 시 다른 닉네임 반환 (랜덤성)
- [ ] 불쾌한 단어 미포함 (사전 검수된 목록)
- [ ] 인증 불필요 (Guard 미적용)

### App — 프로필 편집 (app/003)
- [ ] "프로필 편집" 버튼 탭 시 편집 화면으로 이동
- [ ] 프로필 이미지 영역 탭 시 카메라/앨범 바텀시트 노출 (+ "사진 삭제" 옵션)
- [ ] 이미지 선택 후 크롭 화면 거쳐 프로필 이미지 변경
- [ ] 닉네임 2자 미만 시 저장 버튼 비활성화
- [ ] 닉네임 20자 초과 입력 불가 (maxLength)
- [ ] 변경사항 저장 시 프로필 화면에 즉시 반영 (React Query invalidation)
- [ ] "프로필 공유" 버튼 → OS 공유 시트 호출 + 딥링크 URL 포함
- [ ] 최초 프로필 생성 시 `GET /api/v1/nickname/generate` 호출하여 자동 닉네임 설정

### App — 설정 화면 (app/004)
- [ ] 프로필 화면 우상단 ⚙️ 아이콘 탭 시 설정 화면 이동
- [ ] 메뉴 구성 (Figma+PRD Merge): 계정 / 비밀번호 / 알림 설정 / 차단 관리 / 서비스 이용약관 / 개인정보 처리방침 / 고객센터 / 탈퇴하기 / 앱 버전 / 로그아웃(하단 버튼)
- [ ] "알림 설정" 탭 시 "준비 중" 표시
- [ ] "차단 관리" 탭 시 "준비 중" 표시
- [ ] "서비스 이용약관" / "개인정보 처리방침" 탭 시 WebView 이동
- [ ] "로그아웃" 탭 시 확인 다이얼로그 후 로그아웃 실행
- [ ] "탈퇴" 탭 시 기존 UnregisterScreen 이동

## Verification Method
- **Backend**: 닉네임 생성 로직 코드 추적. 단어 목록 크기, 포맷 검증, 랜덤성 확인.
- **App**: Clean Architecture 경계 (presentation에만 useQuery), 네비게이션 흐름 추적, 기존 화면(ImageCropper, WebView, Unregister) 재사용 확인.
- **Edge Cases**: 닉네임 경계값(2자/20자), 프로필 이미지 미설정 상태에서 편집, 비회원 접근
