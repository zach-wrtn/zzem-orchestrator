# PRD Amendment — ugc-platform-002

> Phase 3.4 산출물. Prototype revision 피드백에서 역추출한 PRD 갭.
> 본 스프린트 revision: 1건 (app-001, major).

## Summary

- Revised screens: 1 (app-001/SwipeFeedActionBar)
- Amendments generated: 2
  - clarify_ac: 1 (AC 3.3 thousand separator)
  - add_ui_spec: 1 (SwipeFeed footer CTA consistency)
- Applied: 2, Deferred: 0, Dismissed: 0

---

## DRIFT-01 — AC 3.3 `실제 숫자` 표기 구체화 (clarify_ac)

**원본 PRD**:
> AC 3.3: 좋아요 수 표시: 그리드 카드 + 세로 스와이프 상세 모두에서 **실제 숫자 그대로 노출** (축약 없음, 0일 때도 노출)

**갭**: "실제 숫자 그대로" 의 표기 형식이 모호. 4자리 이상 (1,000+) 에서 천단위 콤마 사용 여부가 미명시. app-001 초안에서 `8600` 로 렌더되어 인지성 이슈.

**Amendment**:
- **좋아요 수 포맷**: 축약 없는 **ko-KR thousand separator** 적용.
  - `< 1000`: 그대로 (`0`, `42`, `999`).
  - `>= 1000`: `toLocaleString('ko-KR')` — `1,000`, `8,600`, `12,345`.
- **`0` 표시 유지** (축약 대상 아님).
- **재생성 카운트와 명확히 구분**: 재생성은 korean-count 축약 (`8.6천`), 좋아요는 천단위 콤마 (`8,600`). 두 카운트가 같은 화면에 노출되므로 시각적 차별 필수.

**영향받는 태스크**:
- `tasks/app/005-like-count-display.md` AC 섹션 보강 (thousand separator 명시).
- `tasks/app/001-swipe-feed-action-bar.md` Specification 섹션 보강.
- `tasks/app/006-liked-tab-activation.md` ProfileGridCard 의 LikeBadge 포맷 일치.

**결정**: **apply** (Sprint Lead)

---

## DRIFT-02 — SwipeFeed Footer CTA Canonical 참조 (add_ui_spec)

**원본 PRD**:
> AC 1.5 / 1.6: CTA 분기 (템플릿 사용하기 / 다시 생성하기) + 재생성 플로우

**갭**: SwipeFeed 의 footer 영역 (creator info row + filter title + CTA button) 의 레이아웃/정렬 규격이 PRD 에 미명시. 복수 프로토타입 (app-001 in-context frame, app-003 canonical) 에서 각자 해석하여 시각 불일치 발생.

**Amendment** (UI Spec 추가):
- **SwipeFeed Footer Canonical**: app-003 의 `.sf-creator` + `.sf-footer` + `.cta-button` 패턴을 canonical 로 삼는다.
  - **Creator row**: avatar 36×36 (circular) + nickname (bold 14px) + verified icon (있을 시) + caption "방금 전" / timestamp.
  - **Filter title / subtitle**: canonical 구조 없음 — app-003 패턴에서는 creator-info 만 유지하고 filter title / subtitle 은 별도 프리뷰 레이어 (in-context only).
  - **CTA button**: full-width `56h`, `radius 16px`, brand-primary fill `#8752FA`, 크레딧 뱃지 (coin + 숫자 / 무료) 우측 정렬.
  - **Footer padding**: `left: 16px / right: 16px` 대칭. action bar 는 CTA 위에 별도 레이어로 `right: 12px; bottom: 240px`.
- **Action bar 위치 규칙**: action bar 는 footer 위 240px bottom offset. CTA 와 시각적으로 분리된 레이어.

**영향받는 태스크**:
- `tasks/app/001-swipe-feed-action-bar.md` — Screens/Components 섹션의 레이아웃 힌트에 footer canonical 참조 명시.
- `tasks/app/003-cta-and-regeneration-flow.md` — 이미 canonical. 본 태스크에서 Screen Spec 을 footer SSOT 로 선언.
- `tasks/app/004-publish-toggle.md` — PublishToggle 위치도 sf-footer 내부 (CTA 좌측 or 상단).

**결정**: **apply** (Sprint Lead)

---

## Applied Changes Summary

### Task spec updates (auto-apply)

1. **tasks/app/005-like-count-display.md — AC 보강**:
   - AC 3.3 표기: "likeCount 는 ko-KR thousand separator 적용 (1,000+ 는 `,` 구분). 0 포함 축약 없음."

2. **tasks/app/001-swipe-feed-action-bar.md — Screens/Components 보강**:
   - footer canonical 참조: "SwipeFeed footer layout 은 app-003 canonical (.sf-creator + .sf-footer + .cta-button) 을 SSOT 로 한다. action bar 는 footer 위 레이어 (bottom 240px)."

3. **tasks/app/003-cta-and-regeneration-flow.md — Specification 보강**:
   - "본 태스크의 `.sf-creator` + `.sf-footer` + `.cta-button` 구조가 SwipeFeed footer 전체 레이아웃의 SSOT. app-001 / app-004 / 기타 SwipeFeed 를 참조하는 태스크들은 본 spec 을 따른다."

### API contract 변경
- 없음. UI 스펙/표기 수준만 영향.

### 변경된 태스크 목록
- `tasks/app/001-swipe-feed-action-bar.md`
- `tasks/app/003-cta-and-regeneration-flow.md`
- `tasks/app/005-like-count-display.md`

---

## Phase 6 참조

본 amendment 는 Phase 6 Retrospective 의 "Amendments Applied" 섹션에서 재참조된다.
KB pattern 으로 승격 후보: **design_proto: SwipeFeed footer canonical split** (프로토타입 agent 간 canonical 레퍼런스 명시 누락 시 구조적 해석 불일치 발생).
