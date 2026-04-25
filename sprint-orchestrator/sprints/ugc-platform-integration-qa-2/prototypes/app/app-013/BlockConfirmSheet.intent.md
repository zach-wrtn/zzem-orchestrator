# Assumption Preview — BlockConfirmSheet (app-013)

> Sprint Lead 게이트용. Spec 에 **없던** 결정 + Figma 대조 필요 항목만 기록.
> `quality_score.fabrication_risk: low` 트리거.

## Trigger

- `fabrication_risk: low` (info row 카피 추론)
- 태스크 PRD 키워드 → 한국어 풀 문장 변환 1건

## Inferred Decisions

### 1. Info row 한국어 카피 구체화

| row | PRD 키워드 | DE 추론 카피 (title / desc) |
|-----|----------|--------------------------|
| 1 | 콘텐츠 숨김 | "이 사용자의 콘텐츠가 보이지 않아요" / "피드, 댓글, 프로필을 더 이상 볼 수 없어요" |
| 2 | (PRD 미명시 — 양방향 차단 추론) | "내 활동도 이 사용자에게 숨겨져요" / "내가 올린 콘텐츠를 이 사용자가 볼 수 없어요" |
| 3 | 알림 차단 | "알림이 더 이상 오지 않아요" / "이 사용자의 좋아요·댓글·팔로우 알림이 차단돼요" |

**근거**: 태스크 spec `안내 row × 3 — 콘텐츠 숨김 / 알림 차단 / 해제 가능` 의 키워드.
**우려**: row 2 의 "양방향 차단" (내 활동도 숨겨짐) 은 PRD 가 명시하지 않은 추가 의미.
실제로는 ZZEM 차단이 단방향 (상대방은 모름) 일 수도 있음 — Figma 37211:162198 의
실제 한국어 카피로 대조 검증 필요.

### 2. "해제 가능" → row 3 으로 매핑하지 않고 별도 처리

PRD 키워드의 "해제 가능" 은 차단 해제 가능을 의미하나, info row 가 3개 (icon + text)
구조이고 task spec 의 핵심 요소는 `ban / view_disabled / notifications_off` 3 아이콘.
"해제 가능" 은 별 row 가 아니라 차단 후 anytime 해제 가능하다는 시스템 보장으로
해석. info row 2 를 "view_disabled" (활동 비공개) 로 매핑.

**우려**: 만약 Figma 가 "언제든 해제 가능해요" 한 줄을 별도 row 또는 footnote 로
표시했다면 본 prototype 누락. Figma frame 텍스트 노드 확인 후 footnote 추가 검토.

### 3. Avatar fallback (PRD 미명시)

ProfileImage 100x100 — 실 데이터 없음. 단일 색 원 + 닉네임 첫 글자 ("Z") 로 fallback.
context-engine.yaml `assets.avatars.kind: gradient-token` 으로 등록 — Pass 6 #6 면제.
실 구현 시 user-uploaded URL 또는 `app-core-packages/ds/avatars/` 로 교체.

## Layout Decisions (Spec 외부)

- **Sheet height**: PRD 미명시. 컨텐츠 hug 로 처리 (~520px). max-height 80% viewport 안에서 안전.
- **버튼 좌/우 순서**: 좌 "취소" (ghost) + 우 "차단하기" (destructive). iOS HIG 표준 (destructive 우측, default cancel 좌측).
- **Title margin**: 프로필 이미지 ↔ 타이틀 16px, 타이틀 ↔ info rows 24px (시각 위계).

## Tokens 신규 등록

기존 sprint tokens.css 에 다음 component 토큰을 신규 등록 (block 외에도 향후 delete/report confirm 에 재사용 가능):

| 토큰 | 값 | 용도 |
|-----|----|------|
| `--component-button-destructive-fill` | `#FF3B30` (var --wds-color-red-500) | 차단/삭제/신고 primary fill |
| `--component-button-destructive-label` | `#FFFFFF` (var --wds-color-neutral-0) | 차단/삭제/신고 라벨 |
| `--component-button-destructive-fill-pressed` | `#E0241A` (var --wds-color-red-600) | pressed state |
| `--component-button-secondary-ghost-fill` | `transparent` | ghost cancel fill |
| `--component-button-secondary-ghost-label` | `#6B6E76` (var --wds-color-neutral-600) | ghost cancel label |
| `--component-bottom-sheet-fill` | `#FFFFFF` | 시트 배경 |
| `--component-bottom-sheet-radius` | `20px` (top-only) | 시트 상단 라디우스 |
| `--component-bottom-sheet-handle` | `#D1D3D8` (var --wds-color-neutral-300) | drag handle 색 |
| `--component-info-icon-fill` | `#FFE5E3` (var --wds-color-red-100) | 안내 row 아이콘 컨테이너 weak fill |
| `--component-info-icon-color` | `#FF3B30` (var --wds-color-red-500) | 안내 row 아이콘 stroke color |
| `--wds-background-dimmed` | `rgba(0,0,0,0.50)` | modal backdrop (≥0.4 강제 룰) |

## Gate Questions (Sprint Lead 확정 필요)

1. **Info row 카피 (row 2)** — 양방향 차단 ("내 활동도 숨겨져요") 가 PRD 의도와 일치하나?
   대안: "프로필 검색에 노출되지 않아요" 또는 row 2 자체 제거 (2 rows + 권장 사항)
2. **"해제 가능" 안내** — 별 row / footnote / 생략 중 어디?
3. **Title 정확 카피** — Figma 37211:162198 가 "차단하시겠어요?" 인지 "차단할까요?"
   인지 (PRD 본문은 "차단할까요?" 사용). 본 prototype 은 task description 의
   "&아이디&님을 차단하시겠어요?" 채택.
4. **버튼 순서** — iOS HIG (destructive 우측) vs 한국 모바일 표준 (primary 우측).
   현재 destructive 우측. Figma 대조 필요.

## Adjust Loop

`adjust` 수신 시 다음 항목만 spec 에 반영하고 prototype 재생성:
- info row 카피 변경 → labels.info_rows 업데이트
- title 변경 → labels.sheet.title 업데이트
- 버튼 순서 변경 → button-pair flex-direction reverse

`proceed` 시 즉시 Step C 진행. `stop` 시 PRD 보강 보고.
