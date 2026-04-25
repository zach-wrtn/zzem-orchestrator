# iOS Manual QA Test Plan — qa-2 (23 screens)

> **Purpose**: 본 sprint 머지 후 iOS 시뮬레이터 (또는 실기기) 에서 수동 QA 시 사용할 체크리스트. 23개 task ID 별로 entry path / test steps / expected result / edge cases 정리.
>
> **Pre-conditions**:
> - 본 sprint 의 모든 PR (#579/#580/#581, BE #842 + app #583) 머지된 상태에서 빌드.
> - iOS 시뮬레이터 (iPhone 15 Pro, iOS 17+) 또는 실기기.
> - 테스트 계정 1: 본인 (프로필 편집 가능).
> - 테스트 계정 2: 타유저 (차단 / 알림 trigger 가능). 기기 또는 별 계정 필요.
> - 알림 권한: 1회 granted / 1회 denied 양쪽 시나리오 검증.
>
> **Format**: 각 화면별 4개 섹션 (entry / steps / expected / edge). 체크박스로 PASS/FAIL 마크.

---

## Group 001 — 카메라 / 프로필 사진 편집 (11 screens)

### app-001: 프로필편집_메인

**Entry path**:
- Deep link: `zzem://profile/edit`
- Navigation: MY tab → 프로필 우상단 "편집" 버튼 tap

**Test steps**:
1. [ ] MY 탭 진입 → "편집" tap → 프로필편집 화면 노출 확인
2. [ ] 화면 진입 시 닉네임 input 에 기존 닉네임 prefilled 확인
3. [ ] Avatar 영역에 현재 프로필 사진 (또는 init placeholder) 노출 확인
4. [ ] 화면 진입 시 Save 버튼 disabled 상태 확인 (변경 전)
5. [ ] BackButton tap → 변경 없으므로 즉시 dismiss 확인 (no confirm)

**Expected**:
- AC-1.1 충족 — 진입 + 양 input 노출 가능
- Save 비활성 default + back navigation 변경 없을 때 즉시 dismiss

**Edge cases**:
- [ ] Avatar 가 미설정 사용자 → lucide user 아이콘 + 옅은 보라 배경
- [ ] 닉네임 max length = 20자 (입력 시도 시 21번째 글자 차단)

---

### app-002: 프로필편집_닉네임_저장가능

**Entry path**: app-001 진입 후 닉네임 변경

**Test steps**:
1. [ ] 닉네임 input tap → 키보드 뜸 → 글자 카운터 표시 (현재 글자수 / 20)
2. [ ] 1글자 입력 → "2자 이상 입력해주세요" error 표시 + Save disabled
3. [ ] 21글자 입력 시도 → 차단 또는 "20자 이내로 입력해주세요" error
4. [ ] 유효한 닉네임 (예: "까망콩 V2") 입력 → error 사라짐 + Save enabled
5. [ ] Save tap → loading state → 저장 → app-011 (결과 화면) 또는 toast + MY 화면 rerender

**Expected**:
- AC-1.2 충족 — validation [2,20] + Save 토글 + 결과 navigate

**Edge cases**:
- [ ] 동일 닉네임 (변경 없음) → Save disabled 유지
- [ ] 네트워크 오프라인 시 Save tap → error toast

---

### app-003: 프로필편집_닉네임_바텀시트_나가기확인

**Entry path**: app-002 (dirty 상태) 에서 BackButton tap

**Test steps**:
1. [ ] app-002 에서 닉네임 변경 후 BackButton tap → confirm sheet 노출
2. [ ] sheet title "변경 사항이 저장되지 않습니다" 또는 유사 카피 확인
3. [ ] "계속 편집" tap → sheet dismiss + app-002 유지
4. [ ] BackButton 다시 tap → "나가기" tap → sheet dismiss + 실제 dismiss + MY 화면 복귀

**Expected**:
- AC-1.4 충족 — 저장 안된 변경 보호

**Edge cases**:
- [ ] sheet 외부 (dimmed area) tap → sheet dismiss (= 계속 편집 의미)
- [ ] 시스템 backgesture (iOS swipe-back) 시도 → 동일 confirm 노출

---

### app-004: 프로필편집_닉네임_키보드

**Entry path**: app-001 진입 후 닉네임 input focus

**Test steps**:
1. [ ] input tap → iOS 한글 키보드 (또는 영문) 노출
2. [ ] 입력 시 글자 카운터 실시간 갱신 (n/20)
3. [ ] 키보드 외부 (dismiss-area) tap → 키보드 dismiss + 입력 값 유지
4. [ ] 키보드 dismiss 시 카운터 hidden (focus 해제)

**Expected**:
- AC-1.2a 충족 — 카운터 갱신 + Save 토글 + dismiss 패턴

**Edge cases**:
- [ ] return 키 tap → 키보드 dismiss
- [ ] 키보드 toolbar 의 suggestion bar tap → 자동 입력

---

### app-005: 프로필편집_사진_바텀시트_선택

**Entry path**: app-001 진입 후 Avatar tap

**Test steps**:
1. [ ] Avatar tap → bottom sheet 노출
2. [ ] sheet 옵션 3개 확인: "라이브러리에서 선택" / "기본 이미지로 변경" / "취소"
3. [ ] "기본 이미지로 변경" tap → toast "기본 이미지로 변경됐어요" + Avatar reset + sheet dismiss
4. [ ] "취소" tap → sheet dismiss (no-op)
5. [ ] "라이브러리에서 선택" tap → OS native picker 호출 또는 in-app picker (app-009)

**Expected**:
- modal #3 picker exception 패턴 — primary CTA 0개 + cancel row 분리

**Edge cases**:
- [ ] sheet dimmed area tap → sheet dismiss
- [ ] iOS 사진 권한 denied 상태 → "라이브러리에서 선택" tap 시 권한 요청 또는 안내

---

### app-006: 프로필편집_사진_저장가능

**Entry path**: app-001 → 사진 변경 후

**Test steps**:
1. [ ] Avatar 변경 후 화면 복귀 → Save 버튼 enabled 확인
2. [ ] Avatar 영역에 새 사진 (또는 gradient placeholder) 노출
3. [ ] Save tap → loading → upload → app-010 (결과) 또는 toast + MY rerender
4. [ ] 업로드 실패 시 error toast "사진 업로드에 실패했어요. 다시 시도해주세요"

**Expected**:
- AC-1.3 충족 — 사진 저장 흐름

**Edge cases**:
- [ ] 큰 사진 (10MB+) 선택 → 자동 압축 또는 size limit 안내
- [ ] 네트워크 끊김 → 재시도 가능 안내

---

### app-007: 프로필편집_사진_바텀시트_나가기확인

**Entry path**: app-006 (dirty 상태) 에서 BackButton tap

**Test steps**:
1. [ ] app-006 에서 사진 변경 후 BackButton tap → confirm sheet 노출
2. [ ] sheet 카피 "변경한 프로필 사진이 저장되지 않아요. 정말 나가시겠어요?" 확인
3. [ ] "계속 편집" tap → sheet dismiss + app-006 유지
4. [ ] "나가기" tap → MY 화면 복귀 + 사진 변경 unsaved

**Expected**:
- AC-1.4 충족 — 사진 변경 보호

**Edge cases**:
- [ ] 닉네임 + 사진 동시 변경 후 BackButton → 동일 confirm (둘 다 unsaved)

---

### app-008: 프로필편집_사진_크롭

**Entry path**: app-005 → 라이브러리 선택 → 사진 선택 후

**Test steps**:
1. [ ] 사진 선택 직후 크롭 화면 자동 노출
2. [ ] Header 타이틀 "크기 설정" 확인
3. [ ] 정사각 마스크 + 외곽 dim (opacity 0.50) 확인
4. [ ] 사진 드래그 → 위치 조정 + pinch zoom → 크기 조정 가능 확인
5. [ ] "완료" tap → 크롭 적용 → app-006 복귀 (Save enabled 상태)

**Expected**:
- AC-1.3 충족 — 크롭 흐름

**Edge cases**:
- [ ] 가로 사진 / 세로 사진 / 정사각 사진 모두 정사각 마스크에 fit
- [ ] 매우 작은 사진 (예: 50x50) → max zoom out 제한
- [ ] BackButton tap → 크롭 취소 + app-005 sheet 복귀
- [ ] (Phase 4 divergence 메모) Rule-of-thirds grid overlay 는 production 미적용 — prototype 만의 시각 hint

---

### app-009: 프로필편집_사진_앨범선택

**Entry path**: app-005 → "라이브러리에서 선택" tap (in-app picker 분기)

**Test steps**:
1. [ ] in-app picker 화면 노출 — Header "최근 항목" + 3-col grid
2. [ ] 사진 cell tap → SelectIndicator (체크 마크) 표시 + BottomBar "1장 선택" + submit 활성
3. [ ] 다른 cell tap → 기존 선택 해제 + 새 cell 선택 (single-select replace)
4. [ ] 같은 cell 재 tap → 선택 해제 (toggle) → submit disabled
5. [ ] submit tap → app-008 (크롭) 으로 navigate

**Expected**:
- in-app picker (Figma frame 따름) + single-select + form persona #4 (1 primary)

**Edge cases**:
- [ ] cell 0건 (사진 없음) → empty state 또는 권한 요청
- [ ] Cancel tap → app-005 sheet 복귀
- [ ] Header 우측 chevron (앨범 전환 hint) — visual only, no-op 확인
- [ ] **Phase 4 divergence 메모**: production 은 OS native picker 사용 가능성 — in-app prototype 은 시각 검증 목적

---

### app-010: MY_프로필_사진변경완료

**Entry path**: app-006 또는 app-008 → Save 완료 후 자동 navigate

**Test steps**:
1. [ ] Save 완료 직후 MY 프로필 화면 진입 + 새 Avatar 즉시 반영
2. [ ] 상단 toast "프로필 사진이 변경됐어요" 또는 유사 카피 노출 (3s 후 dismiss)
3. [ ] Tab 라벨 "Free / Recommend" (또는 한글) 노출 확인
4. [ ] "Edit" + "Share" dual CTA 확인
5. [ ] **활동 타임라인에 USER_AVATAR 활동 row 추가 확인** (BE #842 + app #583 머지 효과)

**Expected**:
- AC-1.5 충족 — MY 프로필 즉시 반영 + 활동 타임라인 갱신

**Edge cases**:
- [ ] React Query cache 동기화 → 다른 화면 (홈 / 검색) 의 본인 avatar 도 갱신
- [ ] Toast 위치 (상단) — sibling app-016 (하단) 와 차이 확인

---

### app-011: MY_프로필_닉네임변경완료

**Entry path**: app-002 → Save 완료 후 자동 navigate

**Test steps**:
1. [ ] Save 완료 직후 MY 프로필 진입 + 새 닉네임 즉시 반영
2. [ ] 상단 toast "닉네임이 변경됐어요" 노출
3. [ ] 3개 count tile (게시물 / 팔로워 / 팔로잉 또는 유사) 노출 확인
4. [ ] BottomNav 3-tab (홈/검색/MY) 또는 5-tab 확인 (Figma vs production 결정)

**Expected**:
- AC-1.5 충족 — 닉네임 즉시 반영

**Edge cases**:
- [ ] 댓글 / 게시물 등 본인 닉네임 노출 위치 모두 동기화
- [ ] 닉네임 매우 김 (20자) 시 ellipsis 또는 wrap 처리

---

## Group 002 — 차단 / 차단 관리 (8 screens)

### app-012: 타유저_더보기메뉴

**Entry path**: 타유저 프로필 화면 우상단 "..." (more) 버튼 tap

**Test steps**:
1. [ ] 타유저 프로필 진입 → "..." tap → bottom sheet 노출
2. [ ] sheet 옵션 3개 확인: "URL 복사" / "차단" / "신고"
3. [ ] "URL 복사" tap → toast "링크가 복사되었어요" + sheet dismiss + 클립보드에 URL 복사 확인
4. [ ] "신고" tap → toast "신고 기능은 곧 제공돼요" + sheet dismiss
5. [ ] "차단" tap → app-013 (차단확인 sheet) 으로 modal replace

**Expected**:
- AC-2.1 충족 — 차단 진입

**Edge cases**:
- [ ] sheet dimmed area tap → sheet dismiss
- [ ] 본인 프로필에서 "..." 버튼은 노출 안 됨 확인

---

### app-013: 타유저_차단확인_바텀시트

**Entry path**: app-012 → "차단" tap

**Test steps**:
1. [ ] 차단 confirm sheet 노출
2. [ ] sheet title "&아이디&님을 차단하시겠어요?" 확인 (실 닉네임 인터폴레이션)
3. [ ] info row 2개 확인 (양방향 차단 안내 / 활동 숨김 등)
4. [ ] "취소" tap → sheet dismiss + 차단 안 됨
5. [ ] "차단하기" (destructive 우측) tap → 차단 적용 → toast "차단했어요" + sheet dismiss + 프로필 차단됨 상태 (app-014) 로 전환

**Expected**:
- AC-2.1 충족 — confirm modal → 차단 적용

**Edge cases**:
- [ ] 네트워크 오류 시 error toast + 차단 안 됨
- [ ] 이미 차단된 사용자에 대해 "차단" 진입 차단 (app-015 분기로 이동)

---

### app-014: 타유저_프로필_차단됨

**Entry path**: app-013 → 차단 적용 후, 또는 차단된 사용자 직접 진입

**Test steps**:
1. [ ] 차단된 사용자 프로필 진입
2. [ ] Hero 영역에 "차단됨" badge 또는 indicator 노출
3. [ ] 콘텐츠 영역 (피드 / count tile) 완전 hide 확인
4. [ ] BlockedNotice "차단된 사용자의 콘텐츠는 표시되지 않아요" + subcopy "차단을 해제하면 다시 볼 수 있어요" 확인
5. [ ] **PR #581 lint fix 검증 — `blocked-profile-state.tsx` jsx-no-undef ERROR 없음 확인 (런타임 crash 없음)**

**Expected**:
- AC-2.2 충족 — 콘텐츠 숨김 + 차단됨 상태 표시

**Edge cases**:
- [ ] Persona 강제 룰 #4 면제 — Primary CTA 0개 (해제는 "..." 더보기 통해서만)
- [ ] CountRow 완전 hide 확인 (sibling app-016 와 비교)

---

### app-015: 타유저_차단됨_더보기메뉴

**Entry path**: app-014 의 우상단 "..." tap

**Test steps**:
1. [ ] 차단됨 프로필에서 "..." tap → bottom sheet 노출
2. [ ] sheet 옵션 2개 확인: "차단 해제" / "신고"
3. [ ] "신고" tap → toast "신고 기능은 곧 제공돼요"
4. [ ] "차단 해제" tap → loading (다른 row 비활성) → success toast "차단을 해제했어요" → sheet dismiss → app-016 (해제 후 프로필) navigate

**Expected**:
- AC-2.3 충족 — 차단 해제 진입 → 해제

**Edge cases**:
- [ ] loading 중 backdrop tap → 무효 (race 방지)
- [ ] 네트워크 오류 시 error toast + sheet 유지

---

### app-016: 타유저_프로필_차단해제후

**Entry path**: app-015 → "차단 해제" tap 후

**Test steps**:
1. [ ] 차단 해제 직후 정상 프로필 화면 진입
2. [ ] Hero 영역에 "차단됨" badge 사라짐 확인
3. [ ] 콘텐츠 영역 (피드 / count tile) 정상 노출
4. [ ] "팔로우" 버튼 노출 (기존 팔로우 안 됨 상태)
5. [ ] Bio 한 줄 + Follow toggle 시각 동작 ('팔로우' ↔ '팔로잉')

**Expected**:
- AC-2.3 충족 — 프로필 복원

**Edge cases**:
- [ ] TabPrivate 항목 disabled 처리 (본 프로필 아니므로)
- [ ] 하단 toast (sibling app-019 와 동일 위치) 일관성 확인

---

### app-017: 차단관리_리스트

**Entry path**:
- 설정 (app-023) → "차단 관리" row tap
- Deep link: `zzem://settings/blocked-users`

**Test steps**:
1. [ ] 차단관리 진입 → 차단된 사용자 list 노출
2. [ ] AppHeader 우상단 RefreshButton 노출 + tap → 리스트 reload
3. [ ] BlockCountSummary "차단된 사용자 N명" 행 노출
4. [ ] BlockedUserRow 좌측 avatar (이니셜 fallback 가능) + 닉네임 + "해제" 버튼 표시
5. [ ] pull-to-refresh 동작 확인

**Expected**:
- AC-2.4 충족 — 차단관리 리스트 진입

**Edge cases**:
- [ ] 차단된 사용자 0명 시 empty state 노출
- [ ] feed exemplar drift 확인 — list vs grid 자연 차별 (drift=false 검증)

---

### app-018: 차단관리_바텀시트_해제 확인

**Entry path**: app-017 → "해제" 버튼 tap (단일 또는 일괄)

**Test steps**:
1. [ ] 해제 confirm sheet 노출
2. [ ] sheet title "@handle 의 차단을 해제하시겠어요?" 확인
3. [ ] info row 2개 (콘텐츠 / 활동) 확인 — 알림 row 의도적 제외
4. [ ] "취소" tap → sheet dismiss + 해제 안 됨
5. [ ] "차단 해제" (brand purple primary) tap → 해제 → app-019 (해제완료) navigate

**Expected**:
- AC-2.4 충족 — 일괄 해제 confirm

**Edge cases**:
- [ ] 일괄 해제 시 multi-select 적용 → confirm 카피 "N명의 차단을 해제하시겠어요?" 변형
- [ ] 네트워크 오류 시 error toast + 해제 안 됨

---

### app-019: 차단관리_해제완료

**Entry path**: app-018 → 차단 해제 적용 후

**Test steps**:
1. [ ] 해제 직후 차단관리 리스트 복귀 (해제된 사용자 1명 제외)
2. [ ] Toast auto-show on mount "차단을 해제했어요" 3s 후 dismiss
3. [ ] list_items 갱신 확인 (예: 7명 → 6명)
4. [ ] empty state 시나리오 (모두 해제) → empty view 노출

**Expected**:
- AC-2.4 + AC-2.5 충족 — 해제 완료 결과 + toast

**Edge cases**:
- [ ] toast auto-show 중 다른 화면으로 navigate → toast 유지 또는 dismiss 정책
- [ ] feed archetype 재분류 (detail → feed) 결정 — production 은 detail 일 수도 (확인 필요)

---

## Group 003 — 알림 (3 screens)

### app-020: 알림센터_기본

**Entry path**:
- 홈 우상단 bell icon tap
- Deep link: `zzem://notifications`

**Test steps**:
1. [ ] 알림센터 진입 → 알림 list 노출 (시간순 desc)
2. [ ] 미읽음 알림: dot indicator + 배경 강조 동시 적용 확인
3. [ ] 읽은 알림: dot 사라짐 + 배경 일반
4. [ ] 알림 row tap → 해당 콘텐츠로 navigate (예: 좋아요 알림 → 게시물)
5. [ ] TypeIcon (lucide 4종 — heart/user-plus/bell/megaphone 등) 노출 확인

**Expected**:
- AC-3.1 충족 — 미읽음 강조 + 시간순

**Edge cases**:
- [ ] 행 높이 72px 일관성 확인
- [ ] 알림 100건+ 시 무한 스크롤 또는 페이지네이션
- [ ] feed exemplar drift=false 확인 (list vs grid)

---

### app-021: 알림센터_노데이터

**Entry path**: app-020 진입 시 알림 0건 상태

**Test steps**:
1. [ ] 알림 0건 상태에서 알림센터 진입 → empty state 노출
2. [ ] 시각 앵커 96px 원형 컨테이너 + bell-off SVG 확인
3. [ ] Headline 카피 "아직 도착한 알림이 없어요" (Figma 부정 어조 유지 — PRD copy 변경 금지 룰)
4. [ ] 본문 카피 "친구를 팔로우하면 좋아요·소식·새 팔로워 알림을 받아볼 수 있어요." 확인
5. [ ] Primary CTA "친구 찾기" (또는 "탐색하기" / "홈으로" — production 결정) tap → 해당 탭 navigate

**Expected**:
- AC-3.2 충족 — empty_state + 재진입 유도 CTA

**Edge cases**:
- [ ] NotificationsOffNotice (권한 denied) default 노출 시나리오 — 시스템 설정 navigate 안내
- [ ] 알림 1건 receive 후 empty 사라짐 + list 화면 (app-020) 자동 전환

---

### app-022: 알림설정_토글

**Entry path**:
- 설정 (app-023) → "알림 설정" row tap
- Deep link: `zzem://settings/notifications`

**Test steps**:
1. [ ] 알림 설정 진입 → 4 카테고리 row 노출 (푸시 / 좋아요 / 소식 / 팔로우)
2. [ ] 각 row 우측 토글 + RowDesc (placeholder '~ 알려드려요') 확인
3. [ ] 토글 tap → **즉시 저장** (별도 저장 버튼 없음 확인)
4. [ ] saving silent indicator (4px dot) 또는 완전 silent (production 결정) 확인
5. [ ] 저장 실패 시 RowError + SaveErrorToast 동시 표시 + 토글 rollback

**Expected**:
- AC-3.3 충족 — 4 카테고리 토글
- AC-3.4 충족 — 즉시 저장 (form persona instant_save exception)

**Edge cases**:
- [ ] BE default initial value (push=ON / like=ON / news=OFF / follow=ON) 와 화면 일치 확인
- [ ] 빠른 연속 tap → debounce 또는 latest-wins 패턴 확인
- [ ] 네트워크 끊김 → toggle rollback + error toast

---

## Group 004 — Nav glue (1 screen)

### app-023: 설정 / 설정_메인메뉴

**Entry path**:
- MY 탭 → 우상단 settings (gear) icon tap
- Deep link: `zzem://settings`

**Test steps**:
1. [ ] 설정 진입 → 메뉴 row list 노출
2. [ ] 메뉴 항목 확인: 계정 / 알림 / 차단 / 개인정보 / 도움말 / 로그아웃
3. [ ] 각 row lucide icon (user/bell/shield/lock/help-circle/log-out) 매핑 확인
4. [ ] section grouping (primary 4 + help 1 + logout 1) 확인
5. [ ] "차단 관리" tap → app-017 navigate
6. [ ] "알림 설정" tap → app-022 navigate
7. [ ] "로그아웃" (destructive row) tap → confirm modal → 로그아웃 처리

**Expected**:
- 정합성 검증 — 차단관리 / 알림설정 entry 정상 연결
- archetype: nav_list (form 미스피트로 v2.2 plan #2 으로 enum 확장)

**Edge cases**:
- [ ] destructive row chevron 표시 vs 생략 (production 결정 확인)
- [ ] 다른 row tap → 각각 미구현 안내 또는 정상 navigate

---

## Cross-cutting QA

### React Query 캐시 일관성

- [ ] 프로필 변경 (app-006/010) 후 홈 / 검색 탭의 본인 avatar 즉시 갱신
- [ ] 차단 적용 (app-013) 후 다른 곳의 해당 사용자 콘텐츠 hidden
- [ ] 알림 read 처리 후 다른 진입 시 unread badge count 동기화

### 알림 / 권한

- [ ] 알림 권한 granted 시: 알림 row tap → deep link 동작
- [ ] 알림 권한 denied 시: app-021 NotificationsOffNotice 노출

### USER_AVATAR enum (BE #842 + app #583 wire)

- [ ] 사진 변경 (app-010) 후 활동 타임라인에 USER_AVATAR 활동 row 추가 확인 (실 BE response payload 확인)

### Lint fix (PR #581) 검증

- [ ] app-014 (차단됨 프로필) 진입 시 jsx-no-undef ERROR 없음 (이전 sprint 의 누락 import 수정 확인)

---

## Summary

| Group | Screens | Test Steps | Edge Cases |
|-------|--------:|-----------:|-----------:|
| 001 카메라 | 11 | 53 | 22 |
| 002 차단 | 8 | 40 | 17 |
| 003 알림 | 3 | 15 | 7 |
| 004 nav | 1 | 7 | 2 |
| Cross-cutting | — | 8 | — |
| **Total** | **23** | **123** | **48** |

**Acceptance**: 본 sprint 의 manual QA pass 기준 = 123 test steps 중 PASS ≥ 95% (= 117+) + 0 critical bug + Cross-cutting 8 모두 PASS.

**테스터 사용법**:
1. 각 화면 섹션을 sequential 로 진행 (Group 001 → 002 → 003 → 004)
2. 체크박스 [ ] 를 [x] 로 마크 후 PASS / FAIL 코멘트 추가
3. FAIL 발견 시 issue 등록 (severity: critical / major / minor)
4. Cross-cutting QA 는 마지막 단계로 진행 (전체 머지 후 통합 동작 확인)
