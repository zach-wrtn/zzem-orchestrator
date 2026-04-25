# Intent Gate Decisions — qa-2 (23 prototypes)

> **Purpose**: v2 pipeline 의 Assumption Preview Gate (§3.2.5) 는 Sprint Lead 가 각 prototype 의 `gate_questions` 에 명시적으로 **proceed / adjust / stop** 결정을 보내도록 설계됐다. 본 sprint (qa-2) 는 첫 라이브 dogfood 였고, 23 화면 모두에 대한 결정이 *암묵적으로* (= 후속 phase 진행을 막지 않은 형태로) 내려졌다. 본 문서는 그 암묵 결정들을 **사후 명문화** 하여 (a) 향후 sprint 가 동일 패턴 학습할 수 있도록, (b) Phase 4 build 의 divergence (prototype vs production code) 를 추적할 수 있도록 한다.
>
> **Sprint Lead**: 본 sprint 동안 23개 화면 어느 것도 stop / adjust 가 발생하지 않았다 — 모두 proceed (default — production code matched 또는 DE 권고 수용). Phase 4 build 단계에서 일부 prototype 이 production code 와 diverge 했지만 그 또한 production code 우선 결정으로 흡수.

---

## Decision Table (23 prototypes)

| Task ID | Screen (Korean) | Archetype | Gate Q count | Decision | Notes |
|---------|----------------|-----------|:------------:|----------|-------|
| app-001 | 프로필편집_메인 | form | 4 | **proceed** | DE 의 CharCounter absolute / max=20 / lucide user avatar / 즉시 validation 모두 수용. 기존 ProfileEditScreen 과 일치. |
| app-002 | 프로필편집_닉네임_저장가능 | form | 5 | **proceed** | 닉네임 valid range [2,20] 수용 (production validation 일치). error 카피 2종 채택. |
| app-003 | 프로필편집_닉네임_바텀시트_나가기확인 | modal | 5 | **proceed** | confirm modal 패턴 — '계속 편집' / '나가기' 카피 채택. ParentSurface 미러 유지. |
| app-004 | 프로필편집_닉네임_키보드 | form | 4 | **proceed** | iOS 17 키보드 inline mock 수용 (외부 자산 0). dismiss-area 인터랙션 포함. |
| app-005 | 프로필편집_사진_바텀시트_선택 | modal | 4 | **proceed** | iOS Action Sheet 식 (cancel 분리) + toast '기본 이미지로 변경됐어요' 수용. modal #3 picker exception 인정 → v2.2 plan #4 으로 별도 명문화. |
| app-006 | 프로필편집_사진_저장가능 | form | 4 | **proceed** | Avatar gradient placeholder + '김잼잼' prefill + UploadError 카피 모두 수용. |
| app-007 | 프로필편집_사진_바텀시트_나가기확인 | modal | 4 | **proceed** | app-003 와 동일 confirm 패턴 — neutral dark Exit + iOS HIG 좌/우 채택. |
| app-008 | 프로필편집_사진_크롭 | form | 7 | **proceed** | Figma 카피 우선 ('크기 설정' / '완료') + grid + hint + gradient placeholder + 0.50 scrim. **Phase 4 divergence**: ImageCropper 컴포넌트 wiring 시 grid overlay 는 prod 에서 미적용 (PR #580 에서 카피만 채택). |
| app-009 | 프로필편집_사진_앨범선택 | form | 6 | **proceed** | in-app picker (= Figma frame 따름) + single-select + 4-gradient thumbs + 한국어 카피. fabrication_risk: medium 였지만 3-way variants 트리거 안 함. |
| app-010 | MY_프로필_사진변경완료 | detail | 3 | **proceed** | NEW gradient (보라-핑크) + 영문 tab 라벨 + Edit/Share dual CTA. |
| app-011 | MY_프로필_닉네임변경완료 | detail | 4 | **proceed** | 'maezzi' mock 닉네임 + 3rd count tile '재생성받' 추정 + 3-tab BottomNav (Figma 충실) + 상단 Toast. |
| app-012 | 타유저_더보기메뉴 | modal | 4 | **proceed** | 옵션 3개 (URL 복사 / 차단 / 신고) 채택 + 2 토스트 카피 그대로 + 차단 row → modal replace 패턴. modal #3 picker exception 인정. |
| app-013 | 타유저_차단확인_바텀시트 | modal | 4 | **proceed** | info row 2개 (양방향 차단 안내) + '해제 가능' 안내 row 포함 + 카피 '차단하시겠어요?' + destructive 우측 채택. **Phase 4 confirmed**: production confirm UX 와 일치 (useUnblockUser 가 inverse 패턴 그대로 유지). |
| app-014 | 타유저_프로필_차단됨 | detail | 3 | **proceed** | Persona 강제 룰 #4 면제 (Primary CTA 0개, blocked variant) — v2.2 plan #6 별 PR 으로 명문화. CountRow 완전 hide. BlockedNotice subcopy 유지. |
| app-015 | 타유저_차단됨_더보기메뉴 | modal | 4 | **proceed** | "차단 해제 / 신고" 2 옵션 + 토스트 '차단을 해제했어요' + loading 시 다른 row 비활성 + 즉시 navigate(app-016). |
| app-016 | 타유저_프로필_차단해제후 | detail | 3 | **proceed** | Bio 한 줄 + Follow toggle 시각 동작 데모 + TabPrivate disabled 유지. **Phase 4 divergence**: BE reconciliation 에서 useUnblockUser hook 이 production 에 이미 존재함 발견 → polish 만 적용. |
| app-017 | 차단관리_리스트 | feed | 3 | **proceed** | avatar 이니셜 fallback + RefreshButton 노출 + BlockCountSummary 행 유지. **Curated Exemplar 자동 인라인 첫 성공 사례** (drift=false). |
| app-018 | 차단관리_바텀시트_해제 확인 | modal | 5 | **proceed** | brand purple primary + info row 2개 (콘텐츠 / 활동) + 알림 row 의도적 제외 + "@handle" + "해제하시겠어요?". |
| app-019 | 차단관리_해제완료 | feed (detail→reclassified) | 4 | **proceed** | DE 자가 archetype 재분류 (detail → feed) 수용 — v2.2 plan #5 으로 룰 명문화. Toast auto-show on mount + 6명 list (app-017 7명에서 1건 제외) + control-panel 으로 empty 시나리오 demo. |
| app-020 | 알림센터_기본 | feed | 4 | **proceed** | 행 높이 72px + dot+배경 동시 미읽음 강조 + lucide TypeIcon 4종 + EmptyView reference state 포함. **Curated Exemplar 자동 인라인 두 번째 성공** (drift=false, list vs grid 자연 차별). 기존 NotificationCenterScreen 와 layout 일치. |
| app-021 | 알림센터_노데이터 | empty_state | 5 | **adjust → proceed** | Q1 '아직 도착한 알림이 없어요' (Figma 부정 어조) ↔ DE 제안 '조용한 하루네요' (persona 통과) 충돌. **PRD copy 변경 금지 룰 우선 → Figma 카피 유지** 결정. v2.2 plan #3 으로 conflict resolution 룰 명문화. Q2-Q5 는 proceed (DE 제안 카피 + 친구찾기 CTA + SVG icon + 권한 denied default). |
| app-022 | 알림설정_토글 | form | 5 | **proceed (with formal rule waiver)** | form persona 강제 룰 #2 (submit button) / #4 (1 primary action) **거절** 승인 — 즉시 저장 패턴은 form persona 와 본질적으로 충돌. v2.2 plan #1 으로 instant_save exception clause 명문화. RowDesc 카피 / saving silent indicator / RowError + Toast 동시 / default initial value 모두 수용. |
| app-023 | 설정 / 설정_메인메뉴 | form (→ nav_list reclassified) | 5 | **proceed (with archetype enum extension)** | form persona 4/4 **모두 거절** 승인 → archetype enum 6→7 확장 결정 (`nav_list` 신규). v2.2 plan #2 (PR #41) 머지로 공식 archetype 으로 등재. lucide icon 매핑 / section grouping / chevron 모두 수용. |

---

## Summary

| Decision | Count | % |
|----------|------:|---:|
| **proceed** | 22 | 95.7% |
| **adjust → proceed** (Q-level adjust) | 1 | 4.3% (app-021 Q1 만) |
| **stop** | 0 | 0% |

- **총 gate questions 처리**: 99건 (avg 4.3 / 화면)
- **archetype enum extension** 트리거: 1건 (app-023, nav_list 추가)
- **persona 강제 룰 waiver** 인정: 4 화면 (app-005/009/012/015 modal #3 picker exception, app-014 detail #4 blocked variant, app-022/023 form #2/#4 instant-save)
- **Phase 4 divergence 발견**: 3건 (app-008 grid overlay, app-016 unblock hook, app-021 카피 충돌) — 모두 production code / PRD 우선으로 흡수, prototype 폐기 0건

## Lessons

1. **23/23 stop 0건** — v2 pipeline 의 DE 추론 정확도가 sprint Lead 가 명시 stop 을 보낼 만큼 어긋나지 않음. fabrication_risk: low 가 표준 트리거인 점과 일치.
2. **proceed default 의 위험**: app-021 같은 conflict 는 'adjust' 로 처리해도 명확한 분기였지만 stop 까지는 가지 않음. 향후에는 conflict 가 명확한 경우에는 adjust 결정을 명시 issue 로 트래킹할 것.
3. **Persona waiver 가 plan trigger** — 4 화면 (modal picker / detail blocked / form instant-save) 의 persona waiver 가 모두 후속 v2.2 plan PR 로 정식 clause 화 → "waiver 인정 → 룰 진화" 패턴 작동.
4. **archetype enum 확장이 가장 큰 sprint 산출** — app-023 1건이 enum 6→7 (nav_list) 으로 확장됨 → settings 화면 family 가 향후 sprint 에서 자동 처리 가능.
