# verify-prototype CLICK_SELECTORS Expansion Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task.

**Goal:** PR #29 v2 파이프라인의 `verify-prototype.ts` (commit 8a5e0d7) 가 사용하는 `CLICK_SELECTORS` 가 ZZEM 기존 17개 prototype 의 인터랙티브 패턴을 미커버하는 케이스를 보완하여, **clicked=0** false-pass 를 방지한다.

**Architecture:** 단일 phase, 단일 파일 수정. TDD — fixture 추가 → selector 추가 → fixture pass 확인.

**Tech Stack:** TypeScript (verify-prototype.ts), vitest, HTML fixture.

---

## 현재 상태 (조사 결과)

**파일**: `sprint-gallery/scripts/verify-prototype.ts:31`

```typescript
const CLICK_SELECTORS = ['[onclick]', '.state-toggle', '[data-state-toggle]', '[data-tab]'];
```

**커버 현황** (17개 prototype.html 스캔):
- `[onclick]`: 68개 매치
- `.state-toggle`: 0개
- `[data-state-toggle]`: 0개
- `[data-tab]`: 9개 매치

**미커버 패턴 Top 5** (빈도 순):

| # | 패턴 | 빈도 | 예시 |
|---|------|------|-----|
| 1 | `[data-action]` | 10개 | `ugc-platform-002/app-002` 의 `<button data-action="like">` |
| 2 | `[data-nav]` | 3개 | 네비게이션 표준화 속성 |
| 3 | `[role="menuitem"]` | 4개 | ARIA 메뉴 |
| 4 | `[role="tab"]` | 9개 | ARIA 탭 (대부분 `[data-tab]` 와 중복) |
| 5 | `[data-close-sheet]` | 2개 | 시트/오버레이 닫기 |
| - | `cursor: pointer` (CSS) | 71개 | selector 로 탐지 불가 — out of scope |

`<div onclick="...">` 4개는 `[onclick]` 으로 이미 커버됨.

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `sprint-gallery/scripts/verify-prototype.ts` | Modify | CLICK_SELECTORS 배열 확장 + 중복 제거 로직 (이미 Set 으로 처리됨) |
| `sprint-gallery/tests/fixtures/prototype-data-action.html` | Create | data-action 패턴 fixture |
| `sprint-gallery/tests/fixtures/prototype-aria-roles.html` | Create | role=menuitem/tab fixture |
| `sprint-gallery/tests/verify-prototype.test.ts` | Modify | 신규 fixture 통과 테스트 케이스 추가 |

---

## Task 1: TDD — fixture + 실패 테스트

- [ ] **Step 1: data-action fixture 작성**

`sprint-gallery/tests/fixtures/prototype-data-action.html`:

```html
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><title>data-action fixture</title></head>
<body>
  <button data-action="like">Like</button>
  <button data-action="share">Share</button>
  <div data-nav="home">Home</div>
  <button data-close-sheet>닫기</button>
  <script>
    document.querySelectorAll('[data-action], [data-nav], [data-close-sheet]').forEach(el => {
      el.addEventListener('click', () => { /* no-op */ });
    });
  </script>
</body>
</html>
```

- [ ] **Step 2: aria-roles fixture 작성**

`sprint-gallery/tests/fixtures/prototype-aria-roles.html`:

```html
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><title>aria roles fixture</title></head>
<body>
  <ul role="menu">
    <li role="menuitem" id="m1">Item 1</li>
    <li role="menuitem" id="m2">Item 2</li>
  </ul>
  <div role="tablist">
    <button role="tab" data-tab="public">Public</button>
    <button role="tab" data-tab="private">Private</button>
  </div>
  <script>
    document.querySelectorAll('[role="menuitem"], [role="tab"]').forEach(el => {
      el.addEventListener('click', () => { /* no-op */ });
    });
  </script>
</body>
</html>
```

- [ ] **Step 3: 신규 테스트 케이스 추가 (실패 확인)**

`sprint-gallery/tests/verify-prototype.test.ts` 에 추가:

```typescript
it('clicks data-action / data-nav / data-close-sheet selectors', async () => {
  const result = await verifyPrototype(join(FIXTURES, 'prototype-data-action.html'));
  expect(result.status).toBe('pass');
  expect(result.clickedElements).toBe(4);  // like, share, home, close
}, 30_000);

it('clicks role=menuitem and role=tab selectors', async () => {
  const result = await verifyPrototype(join(FIXTURES, 'prototype-aria-roles.html'));
  expect(result.status).toBe('pass');
  // 2 menuitems + 2 tabs = 4 (data-tab 중복 제거 후에도 4 — 중복은 Set 으로 단일화)
  expect(result.clickedElements).toBe(4);
}, 30_000);
```

- [ ] **Step 4: 테스트 실행 — 실패 확인**

Run: `cd sprint-gallery && pnpm vitest run tests/verify-prototype.test.ts`
Expected: 신규 2 케이스 FAIL (clickedElements 가 0 또는 부족).

## Task 2: CLICK_SELECTORS 확장

- [ ] **Step 1: verify-prototype.ts 수정**

```typescript
// sprint-gallery/scripts/verify-prototype.ts:31
const CLICK_SELECTORS = [
  '[onclick]',
  '.state-toggle',
  '[data-state-toggle]',
  '[data-tab]',
  '[data-action]',
  '[data-nav]',
  '[data-close-sheet]',
  '[role="menuitem"]',
  // role="tab" 은 거의 항상 [data-tab] 과 중복 — 추가 안 함 (false positive 우려)
];
```

- [ ] **Step 2: 테스트 재실행 — 통과 확인**

Run: `cd sprint-gallery && pnpm vitest run tests/verify-prototype.test.ts`
Expected: 모든 테스트 PASS (기존 2 + 신규 2 = 4).

- [ ] **Step 3: 전체 prototype 회귀 확인**

Run: `cd sprint-gallery && pnpm verify:prototypes`
Expected: 기존 17개 prototype 중 fail 0. clicked count 가 늘어난 prototype 다수 (data-action 위주 ugc-platform-002/app-002 등).

이전과 비교: clicked total 이 늘어나면 정상. 새로운 fail 이 발생하면 — 늘어난 클릭이 실제 broken 코드를 노출한 것 → 별 PR 로 fix.

## Task 3: 중복 제거 검증

`verify-prototype.ts` 의 `evaluateHandle` 로직은 이미 `Set` 으로 중복 제거하므로 (`[role="tab"]` 추가 시에도 `[data-tab]` 매치 요소가 두 번 클릭되지 않음) 추가 작업 불필요.

- [ ] **Step 1: 동일 element 가 여러 selector 에 매치되는 fixture 로 sanity 확인**

`prototype-aria-roles.html` 의 tab 은 `role="tab"` + `data-tab` 둘 다 갖지만 (현재 SELECTORS 에는 `[data-tab]` 만 포함), 만약 `[role="tab"]` 도 추가한다면 — Set 중복 제거 가 작동해야 한다.

본 plan 에서는 `[role="tab"]` 미추가 — false positive 우려 (디스플레이용 role 이 실제 인터랙티브가 아닐 수 있음).

## Task 4: Commit

- [ ] **Step 1: Commit**

```bash
git add sprint-gallery/scripts/verify-prototype.ts sprint-gallery/tests/verify-prototype.test.ts sprint-gallery/tests/fixtures/
git commit -m "feat(gallery): expand verify-prototype CLICK_SELECTORS

Adds 4 selectors based on actual ZZEM prototype patterns:
- [data-action] (10 matches across UGC prototypes)
- [data-nav] (3 matches)
- [data-close-sheet] (2 matches)
- [role=menuitem] (4 matches)

Excludes [role=tab] — overlaps with [data-tab] and risks
false positives on display-only role markers.

Two new fixtures + 2 new vitest cases verifying click coverage."
```

---

## Post-Plan Verification

- [ ] **Step 1: build 체인 회귀**

Run: `cd sprint-gallery && pnpm build`
Expected: verify:prototypes → capture:screenshots → astro build 모두 통과.

- [ ] **Step 2: 신규 selector 가 잡은 click count 변화 측정**

Run: `pnpm verify:prototypes` 의 출력에서 sprint별 clicked count 비교 (PR diff 에 before/after 표 첨부 권장).

---

## Open Questions

- [ ] **`cursor: pointer` 처리**: CSS 기반 인터랙티브 (71개) 는 selector 로 탐지 불가. 옵션:
  - (a) Pass 6 audit 룰로 강제 — `cursor: pointer` 가 있으면 반드시 명시적 attribute (`onclick`/`role`/`data-*`) 동반
  - (b) verify-prototype 에 computed style 검사 단계 추가 (성능 영향 큼)
  - (c) 현 상태 유지 — 명시적 attribute 패턴만 검증
  - 권장: (a) — 별 plan 으로 분리 (DE 측 룰 변경)
- [ ] **dogfood 후 재평가**: 다음 sprint 첫 dogfood 에서 다시 clicked=0 케이스가 나오면 selector 추가 검토.
