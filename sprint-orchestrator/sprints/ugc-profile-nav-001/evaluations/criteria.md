# Evaluation Criteria: ugc-profile-nav-001

## 공통 평가 기준

1. **API Contract 준수**: 응답 스키마가 `api-contract.yaml`과 일치하는가
2. **레이어 경계**: Backend는 Controller→Application→Domain→Persistence, App은 presentation→domain←data 경계를 준수하는가
3. **에러 처리**: 400/403/404 등 에러 응답이 AC에 명시된 대로 동작하는가
4. **인증**: 인증 필요 API에 Guard가 적용되었는가

## Group 1: Navigation + Profile Core

### Backend (Tasks 001, 002)
- 프로필 조회 API가 `MyProfileResponse` / `UserProfileResponse` 스키마 정확히 반환하는지 검증
- `isPublished` 필드의 default=false 동작과 기존 데이터 호환성 검증
- `visibility=public/private` 필터링 정확성 검증
- 타 유저 private 조회 시 빈 목록 반환 검증
- 커서 페이지네이션 `nextCursor` + `hasNext` 정확성 검증
- 닉네임 검증: 1자 → 400, 21자 → 400, 2자/20자 → 성공

### App (Tasks 001, 002)
- 3탭 네비게이션: 탭 전환, 스크롤 상태 유지
- 비회원 MY 탭 → 로그인 화면 리다이렉트
- 프로필 헤더: 모든 필드 노출 확인 (이미지, 닉네임, 3개 카운트)
- 디폴트 탭 로직: 공개 있음→게시물, 공개 없고 비공개 있음→비공개, 둘 다 없음→게시물
- 숫자 포맷: 999→"999", 8600→"8.6천", 12500→"1.2만"
- 좋아요 탭: 빈 껍데기 확인
- 세로 스와이프 진입: 해당 탭 콘텐츠만 표시

## Group 2: Profile Edit + Settings

### Backend (Task 003)
- 닉네임 생성 포맷: `{형용사}{동물}{4자리숫자}`
- 랜덤성: 2회 호출 시 다른 결과
- 길이: 2~20자 내

### App (Tasks 003, 004)
- 프로필 편집: 이미지 변경 (카메라/앨범), 닉네임 변경 (2~20자 검증)
- 프로필 공유: OS 공유 시트 호출 + 딥링크 URL 포함
- 설정 화면: 7개 메뉴 순서 및 각 메뉴 동작 (준비중 포함)
- 자동 닉네임: 최초 진입 시 자동 생성 확인

## Group 3: Other User Profile + Landing

### App (Task 005)
- 타 유저 프로필: 게시물 탭만, 편집 버튼 미노출, 더보기 메뉴
- 생성 후 랜딩: 필터→게시물탭, 프롬프트→비공개탭
- 생성 중/실패 상태 노출
- 페르소나 계정 처리

## Evaluator 캘리브레이션

### PASS 기준
- 모든 AC가 코드에서 검증 가능
- API 응답이 contract와 일치
- 레이어 경계 위반 없음

### FAIL 기준
- AC 1개 이상 미충족
- API 응답 스키마 불일치
- 레이어 경계 위반 (domain에서 React import 등)
- 인증 Guard 누락

### 경계 케이스 (반드시 확인)
- 콘텐츠 0건일 때 프로필 화면 동작
- 프로필 이미지 미설정 시 디폴트 아바타
- 닉네임 경계값 (2자, 20자)
- 기존 콘텐츠 (isPublished 필드 미존재) 처리
