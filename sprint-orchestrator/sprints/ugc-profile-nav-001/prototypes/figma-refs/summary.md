# Figma Design Reference Summary

File Key: `7hozJ6Pvs09q98BxvChj08`

## Screens

### 1. MY 비공개탭 피드있음 (37160:78484)
- **File**: `figma-37160-78484.png`
- **Key Visual Features**:
  - 상단 헤더: 사용자 아이디 + 설정(톱니바퀴) 아이콘
  - 원형 프로필 이미지 (100x100)
  - 팔로워 / 팔로잉 / 재생성된 카운트 3열 배치
  - "프로필 편집" + "프로필 공유" 버튼 2개 (rounded rectangle, 회색 배경)
  - 3탭 메뉴: 미디어(격자) / 비공개(자물쇠, 활성) / 좋아요(하트)
  - 비공개탭 활성: 하단 강조선(2px, 검정)
  - 2열 그리드 피드: 각 카드에 자물쇠 아이콘 + 재생성 카운트 표시
  - 하단 네비게이션 바: 홈 / 검색 / MY(활성, 점 표시)

### 2. MY 비공개탭 노데이터 (37160:78480)
- **File**: `figma-37160-78480.png`
- **Key Visual Features**:
  - 동일한 프로필 헤더 구조 (아이디, 프로필 이미지, 카운트)
  - 동일한 버튼 레이아웃 (프로필 편집 + 프로필 공유)
  - 3탭 메뉴: 비공개탭 활성
  - 빈 상태(Empty State): 중앙 "아직 비공개한 게시물이 없어요" 텍스트
  - 하단 네비게이션 바

### 3. MY 좋아요탭 피드있음 (37160:78478)
- **File**: `figma-37160-78478.png`
- **Key Visual Features**:
  - 동일한 프로필 헤더 구조
  - 3탭 메뉴: 좋아요탭(하트) 활성
  - 2열 그리드 피드: 각 카드에 템플릿 이름, 작성자 정보, 재생성 카운트
  - "인기" 태그가 있는 카드 존재 (빨간 배지)
  - 하단 네비게이션 바

### 4. MY 좋아요탭 노데이터 (37160:78482)
- **File**: `figma-37160-78482.png`
- **Key Visual Features**:
  - 동일한 프로필 헤더 구조
  - 3탭 메뉴: 좋아요탭(하트) 활성
  - 빈 상태(Empty State): 중앙 "아직 좋아요한 게시물이 없어요" 텍스트
  - 하단 네비게이션 바

### 5. 프로필편집 메인 (37160:79939)
- **File**: `figma-37160-79939.png`
- **Key Visual Features**:
  - 상단: 뒤로가기(chevron) + "프로필 편집" 타이틀
  - 중앙 상단: 기본 프로필 이미지 (회색 실루엣) + 카메라 아이콘 오버레이
  - "닉네임" 레이블 + 텍스트 입력 필드 ("김쨈쨈" 예시)
  - 하단 고정: "저장" 버튼 (비활성 상태, 회색)
  - 깔끔하고 미니멀한 레이아웃

### 6. 프로필편집 사진 바텀시트 (37160:80034)
- **File**: `figma-37160-80034.png`
- **Key Visual Features**:
  - 프로필 편집 화면 위에 바텀시트 오버레이
  - 바텀시트 핸들 바 (회색 라인)
  - 두 가지 옵션:
    - "카메라/앨범" (이미지 아이콘 + 텍스트)
    - "사진 삭제" (휴지통 아이콘 + 빨간색 텍스트)
  - 배경 딤 처리

### 7. 타유저 프로필 팔로우전 (37160:78423)
- **File**: `figma-37160-78423.png`
- **Key Visual Features**:
  - 상단: 사용자 아이디 + 인증 뱃지 아이콘 + 더보기(...) 메뉴
  - 원형 프로필 이미지 (다른 사용자 사진)
  - 팔로워 / 팔로잉 / 재생성된 카운트
  - "프로필 편집" / "프로필 공유" 버튼 없음 (자기 프로필이 아니므로)
  - 바로 피드 그리드 시작: 2열 레이아웃
  - 각 카드에 재생성 카운트 표시
  - 하단 네비게이션 바

### 8. MY 비공개탭 생성중 (37172:28468)
- **File**: `figma-37172-28468.png`
- **Key Visual Features**:
  - 동일한 프로필 헤더 구조 (설정 아이콘 포함)
  - 3탭 메뉴: 비공개탭 활성
  - 첫 번째 카드: "생성중..." 텍스트 + 로딩 스피너/아이콘 (눈 모양)
  - 반투명 오버레이가 있는 생성 중 상태 카드
  - 두 번째 카드: 완성된 이미지 + 재생성 카운트
  - 하단 네비게이션 바

## Design System Notes

- **Font**: Pretendard (SemiBold, Medium 등 다양한 weight)
- **Typography Styles**:
  - Subtitle3-18: 18px SemiBold, line-height 1.5
  - Subtitle4-16: 16px SemiBold, line-height 1.5
  - Subtitle6-14: 14px SemiBold, line-height 1.4
  - Body7-12: 12px Medium, line-height 1.5
  - Label5-10: 10px Medium, line-height 1
- **Color Variables**: CSS 변수 기반 (--background_primary, --text_primary, --surface_button 등)
- **Layout**: 375px width, 812px height (iPhone 기준)
- **Border Radius**: 버튼 12px, 프로필 이미지 999px(원형), 카드 4px
- **Bottom Navigation**: 3탭 (홈, 검색, MY)
