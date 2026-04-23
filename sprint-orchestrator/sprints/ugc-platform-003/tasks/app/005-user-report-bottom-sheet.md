# app-005 · 콘텐츠 신고 BottomSheet + 자유 텍스트 (100자)

- **Group**: 002
- **Owner**: fe-engineer
- **Depends on**: be-003 (POST /v2/contents/{contentId}/reports)

## Target

`app/apps/MemeApp/src/` 내:
- 신규 `presentation/content-report/components/content-report-bottom-sheet.tsx`
- 신규 `presentation/content-report/hooks/use-report-content.ts`
- 기존 `presentation/swipe-feed/components/swipe-feed-more-sheet.tsx` — non-owner "신고" 액션: 기존 `ReportFilterScreen` 네비를 **콘텐츠 신고 대상** 인 경우 본 BottomSheet 로 교체 (filter 신고는 유지).
- 기존 `presentation/profile/components/profile-more-sheet.tsx` — 타 유저 프로필 more-sheet 의 "신고" 액션 유사 교체 (해당 프로필 내 콘텐츠가 아닌 프로필 자체 신고 scope 는 **out of scope** — 본 태스크는 콘텐츠 신고만)
- 관련 Maestro E2E

## Context

AC 7.3: 콘텐츠 신고 사유는 자유 텍스트 100자, 필수. 사유 드롭다운 없음. 상대방 미통지. AC 7.4: 신고 후 caller 의 피드에서 해당 콘텐츠 ~1h 내 미노출 — 본 태스크는 mutation 성공 직후 React Query invalidation 으로 즉시 반영 (BE read-path 가 ContentReport 레코드를 filter signal 로 사용).

기존 `ReportFilterScreen` 은 **필터 신고** 용 screen (reason enum + 이유 선택 UI). 본 태스크의 **콘텐츠 신고** 는 reason enum 없음 (자유 텍스트) — 완전 분리.

## Objective

콘텐츠 신고 BottomSheet 완결. 기존 필터 신고 flow 미변경.

## Specification

### ContentReportBottomSheet

- 구현 기반: gorhom bottom sheet. full-screen 까지 확장 가능한 키보드 대응 (입력 시 키보드 올라와도 버튼 가시).
- Props: `{ contentId: string, onReported?: () => void }`.
- Layout:
  - 상단 타이틀: `"신고"` (Typo, bold).
  - 서브텍스트: `"신고 사유를 자세히 적어주세요. 100자까지 입력할 수 있어요."` (가이드 문구 — PRD 미명시지만 UX 전제, 프로토타입 단계에서 확정 가능).
  - TextInput: multi-line, maxLength=100, placeholder `"신고 사유를 입력하세요"`.
  - 하단 보조 텍스트: `"{current}/100"` (남은 글자수 카운터).
  - Primary button: `"신고하기"` (full-width, 하단 고정).
  - Secondary (close X icon): 상단 우측.
- Validation:
  - TextInput.length === 0 → Primary button disabled (opacity 0.4 + onPress noop).
  - TextInput.length > 100 → maxLength prop 으로 입력 자체 차단 (BE validation 이 방어선, FE 는 UX).
  - 신고 버튼 탭 → POST mutation.

### Mutation + 후처리

- React Query mutation: `POST /v2/contents/{contentId}/reports` body `{reason: string}`.
- Success (201 또는 200 idempotent):
  - BottomSheet close.
  - 하단 Toast "신고가 접수되었어요" (AC 7.3 — 상대방 미통지 이므로 즉시 confirmation).
  - React Query invalidate: `['feed']`, `['user-contents', ownerUserId]` (해당 콘텐츠가 다른 리스트에 있으면 갱신), `['me-likes']` (liked 탭에서도 제외).
  - 현재 콘텐츠 뷰어가 세로 스와이프라면 즉시 다음 콘텐츠로 이동 (이미 신고 대상은 invalidate 로 제거됨). 단일 콘텐츠 뷰어라면 screen pop.
- Error (400 VALIDATION, 404 CONTENT_NOT_FOUND):
  - Sheet 유지 + error Toast "신고 처리 중 오류가 발생했어요. 다시 시도해주세요.".
  - 400 VALIDATION 은 FE 사전 검증으로 거의 발생 안 함.
- 400 SELF_REPORT_FORBIDDEN 은 FE 가 신고 진입점을 본인 콘텐츠에서 숨김 (non-owner path 에서만 노출) 으로 방어 — 이중 방어.

### more-sheet wire-up

- swipe-feed-more-sheet: non-owner 분기에서 "신고" 탭 → 기존 `navigate('ReportFilter', ...)` 를 `openContentReportSheet(contentId)` 로 교체. 기존 "다운로드", "의견 보내기" 등 기타 액션 미변경.
- profile-more-sheet: 타 유저 프로필 그리드에서 특정 콘텐츠 long-press 시 나오는 more-sheet (있는 경우) — 동일 적용. 프로필 자체 신고 scope 아님.

### Out of Scope

- 프로필 신고 (user 단위 신고) — PRD AC 7.3 은 콘텐츠 신고만 명시.
- 신고 사유 수정 / 취소.
- ReportFilterScreen (필터 신고) — 건드리지 않음.

## Acceptance Criteria

- [ ] ContentReportBottomSheet 렌더: 타이틀 `"신고"`, TextInput maxLength=100, 카운터 표시, 신고하기 button.
- [ ] Empty 입력 시 신고하기 disabled (onPress noop + 시각 opacity).
- [ ] 100자 초과 입력 불가 (maxLength 로 차단).
- [ ] 신고 성공 시 sheet close + Toast "신고가 접수되었어요" + 해당 콘텐츠 피드/프로필/likes 에서 즉시 사라짐 (React Query invalidation 동작 검증).
- [ ] Swipe-feed more-sheet non-owner 분기에서 "신고" 탭 → 본 sheet open. Owner 분기에는 "신고" 액션 노출 없음 (AC — 본인 콘텐츠 신고 금지).
- [ ] 400 VALIDATION / 404 핸들링: sheet 유지 + error Toast.
- [ ] Mapper fallback 금지 grep: `rg '\?\?\s*""|\?\?\s*0|\|\|\s*""' app/apps/MemeApp/src/presentation/content-report → 0 hit`.
- [ ] Dead hook 금지 grep: `rg 'useReportContent\(' app/apps/MemeApp/src → ≥ 2 hit`.
- [ ] 기존 ReportFilterScreen 미변경 (git diff 로 검증).
- [ ] Cross-component 영향 전수 나열: swipe-feed-more-sheet.tsx (non-owner 분기만), profile-more-sheet.tsx (있는 경우), 그 외 파일 수정 금지.
- [ ] E2E flow 생성: `apps/MemeApp/e2e/flows/swipe-feed-content-report.yaml` — appId + zzem://contents/{seedContentId} deeplink → swipe-feed more button tap → "신고" tap → sheet assertVisible → TextInput input → "신고하기" tap → Toast assertVisible.
- [ ] E2E seed 필요: non-owner 본인이 신고 가능한 public content 1개 — e2e-seed-plan.md 에 명시.
- [ ] lint / typecheck / tsc --noEmit 신규 에러 0.

## Implementation Hints

- Keyboard 대응: `KeyboardAvoidingView` 또는 gorhom-sheet 의 `keyboardBehavior="interactive"` 활용. 기존 bottom-sheet 사용처 grep 으로 패턴 파악.
- Character counter: 단순 `<Typo>{`${text.length}/100`}</Typo>` 로 충분.
- Toast: 기존 Toast 컴포넌트 재사용. neutral / error variant 분기.
- 신고 후 invalidate 는 기존 Phase 2 unpublish/visibility toggle 시의 invalidation 전략 참조 — swipe-feed 데이터 갱신 패턴.
- 본 sheet 는 모달처럼 full-screen 사용 권장 (100자 TextInput + 버튼).

## Regression Guard

- Swipe-feed more-sheet: owner 분기 (다운/의견/삭제) + non-owner 기타 액션 (다운/의견/차단-app-003) 미변경.
- Profile more-sheet (타 유저): 기타 액션 미변경.
- ReportFilterScreen (필터 신고) 완전 미변경 — git diff 로 검증.
- Phase 2 feed/like/payback/unpublish flow 회귀 없음.
- Cross-component 영향 범위: content-report/ 신규 디렉토리 + swipe-feed-more-sheet.tsx + profile-more-sheet.tsx (있는 경우). 외 파일 수정 금지.
