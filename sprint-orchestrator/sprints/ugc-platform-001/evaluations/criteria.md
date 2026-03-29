# Evaluation Criteria: ugc-platform-001

## General Principles (All Groups)

### Active Evaluation Method
- Sprint Contract의 Done Criteria를 코드에서 하나씩 증명
- Logic tracing: 요청 → 컨트롤러 → 서비스 → 리포지토리 → 응답 전체 흐름 추적
- Edge case 능동 탐색: "버그가 있다고 가정하고 찾아라"
- AC 항목별 PASS/FAIL 판정 + 근거 코드 위치 명시

### Severity Levels
- **Critical**: 기능 불가, 데이터 손실, 보안 취약점
- **Major**: AC 미충족, 비즈니스 로직 오류, 경계 조건 누락
- **Minor**: 코드 품질, 성능 우려, 문서화 누락

### Judgment Criteria
- PASS: Critical 0, Major 0
- ISSUES: Critical 0, Major 1+
- FAIL: Critical 1+, 또는 Major 3+

---

## Group 001: Profile

### BE Evaluation Focus
- [ ] 프로필 CRUD가 기존 5-layer 패턴을 따르는지
- [ ] LibUserGuard / OptionalUserGuard 적용이 정확한지
- [ ] 닉네임 validation (empty, 20자 초과) 처리
- [ ] 닉네임 자동 생성의 고유성 보장 메커니즘
- [ ] isPersona 플래그가 데이터 모델에 존재하고 프로필 응답에 포함되는지
- [ ] 타유저 프로필에 followStatus, isBlocked가 정확히 계산되는지

### FE Evaluation Focus
- [ ] Clean Architecture 경계 준수 (domain에 React import 없음)
- [ ] 프로필 3탭 구조가 기존 Tabs<T> 패턴으로 구현되는지
- [ ] MY 버튼 → ProfileScreen 라우팅 정상 동작
- [ ] 비로그인 유저 가드 처리

---

## Group 002: Feed Publish

### BE Evaluation Focus
- [ ] 커스텀 프롬프트 콘텐츠 공개 차단 로직 (400 응답)
- [ ] 소유자 검증 (403 응답)
- [ ] paybackInfo 반환 조건: 최초 공개 시에만 (재공개 시 미반환)
- [ ] 기존 콘텐츠 isPublished=false 기본값 처리
- [ ] Cursor pagination 정확성 (nextCursor, hasMore)
- [ ] 탭별 정렬 순서: published/private = 생성일, liked = 좋아요 시점

### FE Evaluation Focus
- [ ] 프로필 탭별 API 연동 정확성
- [ ] 공개→비공개 전환 시 확인 바텀시트
- [ ] 비공개→공개 전환 시 확인 없이 즉시 처리
- [ ] CTA 버튼 분기: 소유자 ID 비교 로직

---

## Group 003: Likes

### BE Evaluation Focus
- [ ] 좋아요 토글 멱등성 (같은 요청 반복 시 안전)
- [ ] likeCount 정확성 (동시성 고려)
- [ ] 셀프 좋아요 허용 확인
- [ ] 존재하지 않는 contentId 처리
- [ ] 추천 시그널 이벤트 발행
- [ ] 좋아요 목록 정렬: 좋아요 시점 내림차순

### FE Evaluation Focus
- [ ] Optimistic update 구현 + 실패 시 롤백
- [ ] 좋아요 수 표시: 축약 없음, 0 포함
- [ ] 기존 SwipeFeedActions와의 통합
- [ ] DoubleTapLikeOverlay 동작 유지

---

## Group 004: Follow

### BE Evaluation Focus
- [ ] 자기 자신 팔로우 차단 (400)
- [ ] 중복 팔로우 멱등성
- [ ] followStatus 계산 정확성 (none/following/follower/mutual)
- [ ] followerCount/followingCount 카운터 동기화 (@Transactional 또는 이벤트)
- [ ] 가나다순 정렬 (닉네임 기준, 한글/영어 혼합 처리)
- [ ] 추천 시그널 이벤트 발행

### FE Evaluation Focus
- [ ] FollowButton 상태별 UI (none/following/mutual)
- [ ] 팔로워/팔로잉 리스트 네비게이션
- [ ] 타유저 프로필에서 리스트 진입 불가 처리
- [ ] Optimistic update + 카운터 캐시 무효화

---

## Group 005: Credit Payback

### BE Evaluation Focus
- [ ] 페이백 트리거: 재생성 flow 내 정확한 위치
- [ ] 마진 체크 로직 실행 확인
- [ ] 소수점 올림 처리 (ceil)
- [ ] 크레딧 타입 = promotion
- [ ] 페르소나 콘텐츠 재생성 시 스킵 (에러 없이)
- [ ] 비공개 콘텐츠 재생성 시 페이백 미발생
- [ ] CreditHistory 기록 정확성
- [ ] Config 환경변수로 paybackRate 변경 가능

### FE Evaluation Focus
- [ ] PaybackInfoSheet 표시 조건 (paybackInfo 존재 시)
- [ ] 1회성 노출 보장 (서버 응답 기반)
- [ ] 크레딧 히스토리 페이백 항목 표시

---

## Group 006: Social (Block/Report)

### BE Evaluation Focus
- [ ] 차단 시 편방향 팔로우 해제 (A→B만, B→A 유지)
- [ ] 차단 후 피드/좋아요 필터링 동작
- [ ] 차단 해제 시 필터링 해제
- [ ] isBlocked 정확성 (타유저 프로필 응답)
- [ ] 신고 description 길이 제한 (100자)
- [ ] 추천 패널티 시그널 발행
- [ ] feedback message 길이 제한 (300자)
- [ ] 차단/신고 사실 상대방 미통지 (알림 미발송)

### FE Evaluation Focus
- [ ] 타유저 프로필: 게시물 탭만 노출
- [ ] BlockedProfileView 전환 + 차단 해제
- [ ] 신고 시트: 사유 선택 + 자유 입력
- [ ] 더보기 메뉴 동작 (URL 복사, 차단, 신고)

---

## Group 007: Notifications

### BE Evaluation Focus
- [ ] 각 이벤트별 알림 생성 정확성 (like, follow, credit)
- [ ] 페르소나 계정 알림 수신 제외
- [ ] 카테고리 설정 확인 후 발송 (OFF면 미발송)
- [ ] 알림 TTL: 1개월
- [ ] 팔로우 알림 내용 형식 정확
- [ ] unread-count 정확성
- [ ] 크레딧 페이백 알림: 배치 발송

### FE Evaluation Focus
- [ ] 알림 목록 무한 스크롤
- [ ] 미확인 알림 시각적 구분
- [ ] 알림 탭 → 읽음 + deepLink 이동
- [ ] 뱃지 갱신 정확성
- [ ] Settings 내 카테고리 토글

---

## Calibration Guide (from previous sprint: ugc-full)

### Known Ambiguity Patterns
- Auth guard 선택 (LibUserGuard vs OptionalUserGuard): endpoint별 정확히 검증
- Block filtering 범위: Group 006 이전에는 block 필터링 미구현 허용
- Recommendation signal transport: Kafka/EventEmitter 어느 것이든 이벤트 발행 자체만 검증
- paybackInfo 반환: 최초 공개 시에만 (re-publish 시 미반환)
- Toggle ON(공개): 확인 없이 즉시 / Toggle OFF(비공개): 확인 바텀시트 (FE)

### What to Verify vs What to Skip
- VERIFY: 비즈니스 로직 정확성, auth guard 적용, 데이터 모델 일관성
- SKIP: 코드 스타일 (기존 패턴 따르면 OK), 성능 최적화 (기능 우선)
