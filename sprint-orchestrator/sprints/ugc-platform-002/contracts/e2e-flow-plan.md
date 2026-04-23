# E2E Flow Plan — ugc-platform-002

> Phase 2 (Spec) 산출물. AC ↔ Maestro e2e flow 매핑.
> Maestro 제약: Fabric+RNGH tap 미발화 → 네비게이션은 **딥링크 우선**.
> CTA 검증 타협: 탭→결과 중요 CTA 는 `assertVisible` 까지만. 실제 탭 후 결과는 Evaluator 코드 추적.

## Existing Flows (31개, Phase 1 기준)

```
bottom-tab-nav.yaml          credit-history.yaml           credit-paywall.yaml
custom-prompt-preview.yaml   deeplink-smoke.yaml           explore-tab.yaml
feedback-form.yaml           filter-preview.yaml           guest-credit-redirect.yaml
home-header-elements.yaml    home-tabs.yaml                home-to-settings.yaml
login-entry-point.yaml       meme-collection-empty.yaml    meme-collection.yaml
meme-viewer-actions.yaml     meme-viewer-direct.yaml       meme-viewer.yaml
my-profile-default-landing.yaml  other-user-profile.yaml   profile-edit.yaml
profile-to-swipe-feed.yaml   settings-app-version.yaml     settings-authenticated.yaml
settings-menu-full.yaml      settings-menu.yaml            smoke-test.yaml
swipe-feed.yaml              webview-routes.yaml
```

## AC Coverage Matrix

| AC | 설명 | Classification | Flow 이름 / 추가 내용 | Task |
|----|------|---------------|----------------------|------|
| **AC 1.1** | 공개 기본 정책 (자동 공개, legacy 유지, 워터마크 없음) | **Extend** | `profile-to-swipe-feed.yaml` 확장 — 생성 직후 isPublished=true assert | app-004, be-001 |
| **AC 1.2** | 페이백 조건 (1%, sourceContentId, 직전 1단계) | **Deferred — BE-only** | BE unit + e2e. FE 는 sourceContentId 전달 검증만 Evaluator 추적. | be-002, be-003 |
| **AC 1.3** | 비공개 전환 확인 바텀시트 | **New** | `swipe-feed-publish-toggle.yaml` — 게시 토글 UI + BottomConfirmSheet assertVisible. 확정 탭 후 결과는 Evaluator 추적. | app-004 |
| **AC 1.4** | 커스텀 프롬프트 결과물 공개 불가 | **New** | `swipe-feed-custom-prompt-block.yaml` — 세로 스와이프 (custom-prompt seed) 진입 → 게시 토글 탭 → 토스트 assertVisible. | app-004 |
| **AC 1.5** | CTA 분기 (템플릿 사용하기 / 다시 생성하기) | **Extend** | `profile-to-swipe-feed.yaml` 확장 — 내 콘텐츠 진입 시 "다시 생성하기" assertVisible, 타 콘텐츠 진입 시 "템플릿 사용하기" assertVisible. | app-003 |
| **AC 1.6** | 재생성 플로우 (MIXED 프리뷰, 삭제된 필터 에러 모달) | **Partial: Extend + Deferred** | `profile-to-swipe-feed.yaml` 확장 — CTA 탭 후 이미지 선택 진입 assertVisible. 삭제된 필터 모달은 seed 주입 불가 → Deferred (BE unit + Evaluator 추적). | app-003 |
| **AC 1.7** | 액션 바 + 더보기 메뉴 | **Extend + New** | (a) `swipe-feed.yaml` 확장 — 4 버튼 assertVisible + 카운트 렌더. (b) `swipe-feed-more-sheet.yaml` 신규 — 더보기 탭 → 시트 assertVisible (내 소유 / 타 소유 seed 각각). | app-001, app-002 |
| **AC 1.8** | 게시 토글 노출 규칙 (내 콘텐츠만) | **New** | `swipe-feed-publish-toggle.yaml` 확장 — 내 콘텐츠 toggle 노출 / 타 유저 콘텐츠 toggle 부재 assertVisible. | app-004 |
| **AC 3.1** | 셀프 좋아요 허용 | **Deferred — Evaluator 추적** | Maestro 탭 미발화로 토글 검증 불가. Evaluator 코드 추적 + BE e2e. | app-005, be-004 |
| **AC 3.2** | 좋아요 탭 (최신순, 경로 통합) | **Extend** | `my-profile-default-landing.yaml` 확장 — 좋아요 탭 진입 + assertVisible (seed 기반 좋아요 콘텐츠 1건 렌더). | app-006, be-004 |
| **AC 3.3** | 좋아요 표시 (실제 숫자, 축약 없음) | **Extend** | `swipe-feed.yaml` 확장 — 특정 testID 의 likeCount 텍스트가 expected string 과 일치 assertVisible. (seed 에 specific count 주입) | app-005 |
| **AC 4.1** | 페이백 조건 (Phase 1 MVP 1%, 페르소나 제외) | **Deferred — BE-only** | BE unit + e2e. FE 관여 없음. | be-003 |
| **AC 4.2** | 크레딧 히스토리 페이백 row (썸네일 + 타이틀) | **Extend** | `credit-history.yaml` 확장 — seed 기반 PAYBACK 엔트리 렌더 + "크레딧 페이백" text assertVisible. | app-008, be-003 |
| **AC 4.3** | 크레딧 페이백 세부 정책 (promotion, 올림, config) | **Deferred — BE-only** | BE unit. 수식 검증. | be-003 |
| **AC 4.4** | 최초 진입 UX (1회성 안내 모달) | **New** | `payback-intro-modal.yaml` 신규 — 최초 공개 트리거 (seed 기반) → 모달 assertVisible → 확인 탭 후 dismiss. 2회차 진입은 Evaluator 추적. | app-007 |

## Flow 분류 요약

| Classification | 개수 |
|---------------|------|
| **Covered**   | 0 |
| **Extend**    | 8 (AC 1.1, 1.5, 1.6 부분, 1.7a, 3.2, 3.3, 4.2) — 기존 flow 에 step 추가 |
| **New**       | 4 (AC 1.3, 1.4, 1.7b, 1.8 bundle / AC 4.4) |
| **Deferred**  | 5 (AC 1.2 BE-only, AC 1.6 부분 server-injection-required, AC 3.1 탭 미발화, AC 4.1 BE-only, AC 4.3 BE-only) |

## 신규 Flow 요구 명세

### `swipe-feed-publish-toggle.yaml` (AC 1.3, 1.8 bundle)
- Seed: 내 소유 일반 콘텐츠 1건 (isPublished=true).
- Step:
  1. `zzem://swipe-feed/{E2E_SEED_MY_CONTENT_ID}` 딥링크 진입.
  2. `assertVisible: testID="swipe-feed.publish-toggle"` (내 소유 토글 존재).
  3. toggle ON→OFF 타겟 assertVisible `testID="publish-toggle.confirm-sheet"`.
- Deferred 부분: 실제 OFF 확정 탭 → PATCH 호출 → 피드 invalidate 는 Evaluator 코드 추적.
- TestID 신설: `swipe-feed.publish-toggle`, `publish-toggle.confirm-sheet`.
- 환경: `LibUserAuth` 필수.

### `swipe-feed-custom-prompt-block.yaml` (AC 1.4)
- Seed: 내 소유 **custom-prompt** 콘텐츠 1건.
- Step:
  1. `zzem://swipe-feed/{E2E_SEED_MY_CUSTOM_PROMPT_CONTENT_ID}?visibility=private` 진입 (비공개 탭 경유).
  2. `assertVisible: testID="swipe-feed.publish-toggle"` (disabled 상태 OR 일반 토글).
  3. `assertVisible: text="커스텀 프롬프트 결과물 게시 기능도 곧 지원될 예정이니"` (탭 후 토스트 — assertVisible 만).
- Deferred 부분: Toast 애니메이션 완료 후 자동 dismiss 는 Maestro 제약.
- TestID 신설: 위와 공유.

### `swipe-feed-more-sheet.yaml` (AC 1.7 bottom sheet)
- Seed 1: 내 소유 콘텐츠.
- Seed 2: 타 유저 공개 콘텐츠.
- Step:
  1. 내 콘텐츠 딥링크 진입.
  2. `assertVisible: testID="swipe-feed.more-button"`.
  3. 더보기 탭 후 `assertVisible: testID="more-sheet.menu-delete"` (내 소유 케이스에 삭제 항목).
  4. 뒤로가기 후 타 유저 콘텐츠 딥링크 진입.
  5. `assertVisible: testID="more-sheet.menu-report"` (타 소유 케이스에 신고 항목).
- Deferred: 실제 삭제 확정 탭 후 cache invalidate 는 Evaluator 코드 추적.

### `payback-intro-modal.yaml` (AC 4.4)
- Seed: 신규 유저 (PaybackIntro flag 미set) + 공개 콘텐츠 1건 (최초 공개 트리거).
- Step:
  1. 딥링크로 최초 공개 트리거 경로 진입.
  2. `assertVisible: testID="payback-intro-modal"`.
  3. `assertVisible: text="쨈 런칭 기념 프로모션 크레딧 1% 페이백"`.
- Deferred: 확인 탭 후 flag set 검증은 Evaluator 추적.
- Env: `PAYBACK_INTRO_SHOWN` flag 초기화된 signed-in 상태 필요.

## Regression Guard Flows (Phase 1 회귀 검증)

다음 Phase 1 flow 는 Phase 2 작업 후에도 green 이어야 한다:

- `home-tabs.yaml` (AC 1.x Phase 1)
- `home-header-elements.yaml`
- `my-profile-default-landing.yaml` (AC 2.1 우선순위)
- `profile-edit.yaml` (AC 2.4 편집)
- `profile-to-swipe-feed.yaml` (AC 2.5, 7.3 스와이프)
- `other-user-profile.yaml` (AC 7.1, 7.2)
- `settings-menu-full.yaml` (AC 2.8)
- `credit-history.yaml` (기존 타입 row 회귀 없음)

Phase 4 Group Smoke Gate 에서 그룹 내 신규 flow + 위 Regression 핵심 flow 실행 후 PASS 확인.

## Deferred 검증 대체 수단

| AC | Deferred 사유 | 대체 검증 |
|----|--------------|----------|
| AC 1.2 | BE-only, FE 는 sourceContentId 전달만 관여 | BE e2e + app-003 Evaluator 코드 추적 (navigate payload trace) |
| AC 1.6 (삭제 모달) | server-injection-required (원본 필터 삭제 seed 불가) | BE unit (deleted filter → 400) + app-003 Evaluator 추적 |
| AC 3.1 | Maestro tap 미발화 | app-005 Evaluator 코드 추적 + BE e2e (POST /likes self 허용) |
| AC 4.1 | BE-only (내부 이벤트 리스너) | be-003 e2e + unit |
| AC 4.3 | BE-only (수식) | be-003 unit (ceil, env override) |

## Env / TestID 추가 요구

### Env Vars (e2e runtime)
- `E2E_SEED_MY_CONTENT_ID` — 일반 콘텐츠
- `E2E_SEED_MY_CUSTOM_PROMPT_CONTENT_ID` — custom-prompt 콘텐츠
- `E2E_SEED_OTHER_USER_CONTENT_ID` — 타 유저 공개 콘텐츠
- `E2E_SEED_LIKED_CONTENT_ID` — 이미 좋아요 누른 상태 콘텐츠
- `E2E_SEED_PAYBACK_HISTORY_ID` — credit history 에 PAYBACK 엔트리 1건

### TestID 신설
- `swipe-feed.like-button`, `swipe-feed.regenerate-count`, `swipe-feed.share-button`, `swipe-feed.more-button`
- `swipe-feed.publish-toggle`, `publish-toggle.confirm-sheet`
- `more-sheet.menu-delete`, `more-sheet.menu-report`, `more-sheet.menu-download`, `more-sheet.menu-feedback`
- `cta-button.regenerate` (내 소유) / `cta-button.use-template` (타 소유)
- `liked-tab.content-grid`
- `payback-intro-modal`
- `credit-history.row.payback`

각 testID 는 해당 task 의 Specification 에 E2E 인증 요구로 명시됨.
