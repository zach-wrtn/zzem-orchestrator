# Assumption Preview — UnblockConfirmSheet (app-018)

> Sprint Lead 게이트용. Spec 에 **없던** 결정 + Figma 대조 필요 항목만 기록.
> `quality_score.fabrication_risk: low` 트리거.

## Trigger

- `fabrication_risk: low` (info row 카피 + primary 색상 결정 추론)
- 사용자 prompt 의 "neutral 이거나 brand color" 지침 → brand 채택 결정

## Inferred Decisions

### 1. Primary 버튼 색상: brand (#8752FA), destructive 아님

**근거**: 사용자 prompt 명시 — "해제는 destructive 보다 neutral 이거나 brand color".
**결정**: brand purple (#8752FA) — sibling app-013 의 destructive 빨강 (#FF3B30) 과
의도적 대비. 차단 해제는 검열·차단 강화 액션이 아닌 **회복** 액션 — 사용자가 부정적
인지 (위험·되돌릴 수 없음) 를 갖지 않게 함.

**우려**: Figma 37290:170093 의 실제 버튼 색상 확인 필요. brand 가 아니라 neutral
(회색 fill) 일 가능성도 있음 (해제 = 중립 액션 표현).

### 2. Info row 카피: sibling 반전 (2 rows)

| row | sibling app-013 (차단) | app-018 (해제) — DE 추론 |
|-----|----------------------|------------------------|
| 1 | "이 사용자의 콘텐츠가 보이지 않아요" | "이 사용자의 콘텐츠가 다시 보여요" |
| 2 | "내 활동도 이 사용자에게 숨겨져요" | "내 활동도 이 사용자에게 다시 보여요" |
| ~3~ | (app-013) "알림이 더 이상 오지 않아요" | **생략** — 해제 시 "알림이 다시 와요" 는 사용자 호불호 분기 (재 노출 부담 가능). 2 rows 로 간소화 (사용자 prompt 의 "1-2 row") |

**근거**: 태스크 spec "안내 (1-2 row)". sibling 의 3 row 보다 1개 적게 하여 결정
부담 완화. 알림 row 는 제외 — 해제했으나 알림은 받기 싫은 사용자 케이스 보호.

**우려**: Figma 가 1 row 만 표시했을 수도. 또는 row 카피가 완전 다른 표현 ("차단을
해제하면 이 사용자가 다시 보여요" 통합 1줄) 일 수도 있음.

### 3. Title 카피

**채택**: "@zzem_user_123님 차단을\n해제하시겠어요?" (사용자 prompt 의 정확 표현).
**대안**: "{nickname}님 차단을 해제할까요?" (PRD AC-2.3 의 본문 어투).
사용자 prompt 가 우선 — modal persona 강제 룰 #4 (title/명확한 콘텍스트) 충족.

**우려**: "@아이디" 표기 방식 (handle 형) vs "{nickname}" (display name) — 본
prototype 은 handle 표기 채택 (@zzem_user_123). Figma 대조 필요.

### 4. Avatar fallback (PRD 미명시)

ProfileImage 100x100 — 실 데이터 없음. 단일 색 원 + 닉네임 첫 글자 ("Z") 로 fallback.
context-engine.yaml `assets.avatars.kind: gradient-token` 으로 등록 — Pass 6 #6 면제.
실 구현 시 user-uploaded URL 또는 `app-core-packages/ds/avatars/` 로 교체.

## Layout Decisions (Spec 외부)

- **Sheet height**: 컨텐츠 hug (~480px, app-013 의 ~520px 보다 약간 짧음 — info row 1개 적음). max-height 80% viewport 안에서 안전.
- **버튼 좌/우 순서**: 좌 "취소" (ghost) + 우 "차단 해제하기" (brand). app-013 동일 패턴 유지 — 사용자 muscle memory 보존.
- **Title margin**: 프로필 이미지 ↔ 타이틀 16px, 타이틀 ↔ info rows 24px (sibling 동일).
- **Info icon 색상 토큰**: app-013 은 `--component-info-icon-fill` (red weak). app-018 은 brand weak (`--wds-fill-brand-weak: #EBE1FF` + `--wds-fill-brand-primary: #8752FA`) 으로 회복 톤 매핑.

## Tokens 신규 등록 (sprint tokens.css 에 이미 존재)

기존 sprint tokens.css 에 modal-friendly tokens 가 이미 등록되어 있음 (app-013 시 도입).
app-018 에서는 **신규 토큰 도입 없음** — 기존 brand weak/primary 토큰 재사용:

| 토큰 | 값 | 용도 |
|-----|----|------|
| `--wds-fill-brand-primary` | `#8752FA` | unblock primary fill (재사용) |
| `--wds-fill-brand-weak` | `#EBE1FF` | info-icon fill (재사용 — 회복 톤) |
| `--wds-fill-brand-strong` | `#7040E0` | unblock pressed (재사용) |
| `--component-button-secondary-ghost-fill` | `transparent` | cancel fill (재사용) |
| `--component-bottom-sheet-fill` | `#FFFFFF` | 시트 배경 (재사용) |

## Gate Questions (Sprint Lead 확정 필요)

1. **Primary 색상** — brand purple (#8752FA) 채택. Figma 가 neutral 회색이면 변경
   (`--wds-fill-neutral` + `--wds-label-normal`).
2. **Info row 개수** — 2 row 채택 (콘텐츠 / 활동). Figma 가 1 row 또는 3 row 면 spec 조정.
3. **알림 row 포함 여부** — 본 prototype 은 의도적 제외 (사용자 호불호). Figma 가
   "알림이 다시 와요" row 포함 시 추가.
4. **Title 표기** — "@handle" vs "{nickname}". 본 prototype 은 "@zzem_user_123".
5. **Title 어휘** — "해제하시겠어요?" (사용자 prompt) vs "해제할까요?" (PRD 본문).
   본 prototype 은 사용자 prompt 채택.

## Adjust Loop

`adjust` 수신 시 다음 항목만 spec 에 반영하고 prototype 재생성:
- primary 색상 변경 → `--component-button-primary-fill` → `--wds-fill-neutral` 또는 다른 토큰
- info row 카피/개수 변경 → labels.info_rows 업데이트
- title 변경 → labels.sheet.title 업데이트
- 버튼 순서 변경 → button-pair flex-direction reverse

`proceed` 시 즉시 Step C 진행. `stop` 시 PRD 보강 보고.
