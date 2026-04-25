# Assumption Preview — ExitConfirmSheet (app-003)

> Sprint Lead 게이트용. Spec 에 **없던** 결정 + Figma 대조 필요 항목만 기록.
> `quality_score.fabrication_risk: low` 트리거.

## Trigger

- `fabrication_risk: low` (Figma 단일 텍스트 → spec title+desc 분리)
- task description prompt 의 카피 (Figma 원문과 다름) 채택 — 확정 필요
- 새 컴포넌트 0개 (`(new)` 없음 — modal pattern app-013 와 token 재사용)

## Inferred Decisions

### 1. Title vs Description 분리 (Figma 단일 → spec 2줄)

| Source | 카피 |
|--------|-----|
| Figma frame 37160:79969 (텍스트 노드 37160:79990) | "수정사항이 있습니다. 그래도 나가시겠습니까?" (단일 텍스트, 311x54) |
| task description (Sprint Lead prompt) | title "변경 사항이 저장되지 않습니다" + desc "정말 나가시겠어요?" (분리) |
| 본 spec | task description 채택 — title bold + desc regular 2줄 분리 |

**근거**:
- task spec `타이틀 "변경사항이 저장되지 않아요"` 키워드 → modal 강제 룰 #4 (명확한 콘텍스트) 강화
- 두 줄 분리 시 시각 위계 명확 (무엇이 일어났는가 / 무엇을 결정하는가)
- iOS HIG / Material Design 표준 alert 패턴 (title + body)

**우려**:
- Figma 디자이너 의도가 단일 줄일 수 있음 (간결성 우선)
- 한국어 ('-습니다' vs '-어요') 톤 일관성 — 본 sprint 다른 modal (app-013 '차단하시겠어요?') 과 맞춰 '-어요' 채택

### 2. Title 카피 정확 텍스트

| 후보 | 출처 | 톤 |
|-----|-----|---|
| "수정사항이 있습니다. 그래도 나가시겠습니까?" | Figma 원문 | 격식 (-습니다) |
| "변경 사항이 저장되지 않습니다" + "정말 나가시겠어요?" | Sprint Lead prompt | 결과 강조 + 친근 (-어요) |
| "변경사항이 저장되지 않아요" | task spec | 친근 (-어요) |
| 본 prototype | "변경 사항이 저장되지 않습니다" + "정말 나가시겠어요?" | mixed |

**채택**: Sprint Lead prompt 의 정확한 카피.
**Gate**: Figma 디자이너 톤 일관성 (다른 confirm 시트 카피 대조) 필요.

### 3. X 버튼 부재 (Figma 원본 기준)

Figma frame 에 X 버튼 없음 (frame 37160:79985 자식: BottomSheetHeader (drag handle) / TextArea / ActionButtonArea — close 아이콘 0개).

**modal archetype 강제 룰 #2 (2-way close)** 충족:
- (a) 명시적 cancel: '계속 편집' 버튼 (secondary ghost) — 1개
- (b) backdrop tap → close — 1개
- (보조) ESC keydown — 1개

X 버튼 없이도 강제 룰 통과 (강제 룰 #2 가 X 버튼 자체를 강제하는 것이 아니라 "X 또는 명시적 cancel + backdrop tap" 양자 택일).

**우려**: app-013 (BlockConfirmSheet) 은 X 버튼 추가했으나, 본 frame 은 명시적 cancel 버튼이 1차 close channel 이므로 X 중복 회피 — 디자이너 의도와 일치.

### 4. Description 추가 ("정말 나가시겠어요?")

Sprint Lead prompt 가 desc 를 명시 (title 1줄 + desc 1줄 패턴).
Figma 원문은 단일 텍스트이므로 본 desc 는 spec 외 추가.

**대안**: desc 생략 + title 만 (Figma 원문 충실).
**Gate**: Sprint Lead 결정.

### 5. ParentSurface (시각 컨텍스트) 노출

Figma frame 은 modal 위 부모 화면 (편집 form) 의 dirty 상태 (닉네임 입력 + 저장 활성) 가 그대로 보임 → backdrop dim 으로 약하게 보이는 수준.

본 prototype 은 app-001 의 dirty 상태 (`까망콩 V2` + 저장 활성) 를 ParentSurface 로 재현. 이는 modal 강제 룰 #1 (backdrop opacity 0.4+ 로 부모와 시각 분리) 의 효과를 검증하기 위함.

**근거**: 부모 화면 노출은 사용자가 "무엇을 편집 중이었는지" 환기 → modal 콘텍스트 보강.

## Layout Decisions (Spec 외부)

- **Sheet height**: Figma 170px (handle 20 + text 54 + button 80 + padding 16) → 본 prototype hug content (~190px) 로 처리. desc 추가로 약 20px 증가.
- **Button 좌/우 순서**: 좌 '계속 편집' (ghost) + 우 '나가기' (destructive). iOS HIG 표준 + Figma frame 순서 일치 (좌 RegularButton + 우 RegularButton, 동일 폭 160.5).
- **Title margin**: handle ↔ title 16px, title ↔ desc 4px (긴밀 연결), desc ↔ button 20px (시각 위계).
- **DragHandle 크기**: Figma 40x4 → 본 prototype 40x4 일치.

## Tokens 신규 등록

기존 sprint tokens.css 의 modal 토큰 (app-013 에서 등록됨) **그대로 재사용**:
- `--component-button-destructive-fill` / `-label` / `-fill-pressed`
- `--component-button-secondary-ghost-fill` / `-label`
- `--component-bottom-sheet-fill` / `-radius` / `-handle`
- `--component-button-radius`
- `--wds-background-dimmed`

본 task 신규 등록 토큰 **0개** (전부 재사용).

## Gate Questions (Sprint Lead 확정 필요)

1. **Title 카피** — 다음 중 어디?
   - (a) "변경 사항이 저장되지 않습니다" + "정말 나가시겠어요?" (현재, prompt 채택)
   - (b) "수정사항이 있습니다. 그래도 나가시겠습니까?" (Figma 원문, 단일)
   - (c) "변경사항이 저장되지 않아요" 단일 (task spec 카피)

2. **Description 분리 vs 통합** — 별도 desc 줄 표시 vs Figma 원문대로 단일 줄?

3. **버튼 라벨 톤 일관성** — '계속 편집' / '나가기' (현재) vs '취소' / '나가기' vs '머무르기' / '나가기' 중 어느 카피?
   - app-013 은 '취소' / '차단하기'. 본 sheet 는 '계속 편집' (작업 지속의 의도 명확) 채택.

4. **app-007 (사진 바텀시트 나가기 확인)** 와 일치 패턴 유지?
   - 두 화면이 같은 컴포넌트 재사용 가정 → 본 prototype 패턴이 app-007 에도 그대로 적용되는지 확인.

5. **ParentSurface 표시 vs 빈 backdrop** — 부모 화면 시각 컨텍스트 노출 (현재) vs 단순 dimmed background?

## Adjust Loop

`adjust` 수신 시 다음 항목만 spec 에 반영하고 prototype 재생성:
- title/desc 카피 변경 → labels.sheet.{title,desc} 업데이트
- 버튼 라벨 변경 → labels.buttons.{keep,exit} 업데이트
- desc 제거 → Description 컴포넌트 삭제 + sheet height 축소
- ParentSurface 제거 → parent-edit-form 블록 삭제

`proceed` 시 즉시 Step C 진행 (이미 prototype.html 생성됨 — 본 intent.md 는 사후 게이트).
`stop` 시 PRD 보강 보고.
