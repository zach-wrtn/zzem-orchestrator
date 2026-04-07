---
name: extract-design
description: >
  코드베이스에서 DESIGN.md를 역추출하여 프로젝트 레벨 디자인 시스템 문서를 생성한다.
  app-design-guide 패키지, wds-tokens, MemeApp 컴포넌트 스타일에서 9개 섹션을 추출.
  Triggers on: "디자인 시스템 추출", "DESIGN.md 생성", "extract design", "디자인 문서 만들어",
  "visual atmosphere 추출", "/extract-design".
  ALWAYS use this skill when generating or updating the project-level DESIGN.md.
---

# Extract Design — 코드 역추출 DESIGN.md 생성

## 개요

3개 원천 소스에서 디자인 시스템을 역추출하여, awesome-design-md 형식의 DESIGN.md를 생성한다.

## 원천 소스

| # | Source | Path | 추출 대상 |
|---|--------|------|----------|
| 1 | **WDS Token JSON** | `wds-tokens/` | Color, Typography, Spacing, Elevation, Motion |
| 2 | **app-design-guide** | `app-core-packages/packages/app-design-guide/lib/` | Semantic color, Component styling, Layout utility |
| 3 | **MemeApp 구현체** | `app-core-packages/apps/MemeApp/src/` | 실제 사용 패턴 → Atmosphere, Do's/Don'ts |

## 산출물

```
docs/designs/DESIGN.md          ← 프로젝트 레벨 디자인 시스템 문서
docs/designs/preview.html        ← 시각적 카탈로그 (색상, 타이포, 컴포넌트)
```

## Steps

### Step 1: Raw Data 수집

3개 원천을 순차적으로 읽는다. **값을 추측하지 않는다 — 파일에 있는 것만 추출한다.**

**1-A. WDS Tokens** (결정론적 추출)

다음 파일을 Read:
- `wds-tokens/primitive/color.json` → 전체 팔레트
- `wds-tokens/primitive/typography.json` → 폰트 계층
- `wds-tokens/primitive/spacing.json` → 간격 스케일
- `wds-tokens/primitive/elevation.json` → 그림자 시스템
- `wds-tokens/primitive/motion.json` → 모션 토큰
- `wds-tokens/semantic/light.json` → 시맨틱 색상 (light)
- `wds-tokens/semantic/dark.json` → 시맨틱 색상 (dark)
- `wds-tokens/component/*.json` → 컴포넌트 토큰 (button, card, input 등)

**1-B. app-design-guide** (시맨틱 매핑 추출)

다음 파일을 Read:
- `app-core-packages/packages/app-design-guide/lib/theme/color/palette.ts` → 확장 팔레트
- `app-core-packages/packages/app-design-guide/lib/theme/color/grayscale-color.ts` → 시맨틱 그레이스케일
- `app-core-packages/packages/app-design-guide/lib/theme/color/zzem-semantic-color.ts` → ZZEM 바이올렛
- `app-core-packages/packages/app-design-guide/lib/theme/color/function-color.ts` → 기능 색상
- `app-core-packages/packages/app-design-guide/lib/stylev2/typographyV2.ts` → 타이포그래피 스케일
- `app-core-packages/packages/app-design-guide/lib/stylev2/stylesV2.ts` → 레이아웃 유틸리티

**1-C. MemeApp 패턴 분석** (관찰 기반 추출)

다음을 분석:
- `app-core-packages/apps/MemeApp/src/shared/ui/styles/useShadow.ts` → 그림자 사용 패턴
- `app-core-packages/apps/MemeApp/src/shared/ui/` 하위 `*.styles.ts` 3~5개 → 컴포넌트 스타일 패턴
- Grep: `borderRadius`, `gap`, `padding`, `zzem_violet`, `surface_`, `text_` → 빈도 기반 패턴

### Step 2: 9개 섹션 작성

awesome-design-md 형식을 따르되, 모바일 앱(React Native) 맥락에 맞게 조정한다.

**섹션별 작성 원천 매핑:**

| # | 섹션 | 원천 | 작성 방법 |
|---|------|------|----------|
| 1 | **Visual Theme & Atmosphere** | 1-C 패턴 분석 | 토큰 특성 + 사용 빈도에서 디자인 성격을 관찰 서술 |
| 2 | **Color Palette & Roles** | 1-A color.json + 1-B semantic color | hex 값 + 시맨틱 역할 매핑 |
| 3 | **Typography Rules** | 1-A typography.json + 1-B typographyV2.ts | 폰트 계층 테이블 |
| 4 | **Component Stylings** | 1-A component/*.json + 1-C styles 분석 | 컴포넌트별 상태 + 토큰 매핑 |
| 5 | **Layout Principles** | 1-A spacing.json + 1-B stylesV2.ts | 간격 스케일 + 그리드 규칙 |
| 6 | **Depth & Elevation** | 1-A elevation.json + 1-C useShadow.ts | 그림자 레벨 테이블 + 사용 철학 |
| 7 | **Do's and Don'ts** | 1-C 패턴 분석 | 실제 코드에서 관찰된 일관된 패턴 = Do, 사용되지 않는 패턴 = Don't |
| 8 | **Motion & Interaction** | 1-A motion.json + 1-C | duration/easing + 인터랙션 패턴 (Responsive 대신) |
| 9 | **Agent Prompt Guide** | 전체 종합 | 색상 참조표 + 컴포넌트 프롬프트 예시 |

### Step 3: Visual Atmosphere 작성 기준

**이 섹션만 "서술"이 포함된다. 나머지 8개 섹션은 데이터 중심.**

서술의 근거는 반드시 **관찰된 토큰 특성**이어야 한다:

| 관찰 가능한 특성 | 서술 예시 |
|----------------|---------|
| 브랜드 색상이 purple/violet 계열 | "퍼플 톤의 크리에이티브 에너지" |
| shadow가 단일 값, 낮은 opacity | "플랫에 가까운 미니멀 엘리베이션" |
| radius가 12~16이 주류, pill(9999)도 사용 | "부드러운 라운딩, 공격적이지 않은 곡선" |
| neutral이 12단계 세분화 | "정밀한 명암 계층으로 depth 표현" |
| Pretendard 단일 폰트 | "한글 최적화 산세리프, 깨끗한 가독성" |

**금지**: 원천 데이터에 없는 감성적 수식어 (예: "럭셔리한", "혁신적인"). 관찰에서 도출 불가능한 서술은 fabrication이다.

### Step 4: Do's and Don'ts 작성 기준

**Do = 코드에서 3회 이상 일관되게 관찰된 패턴**
**Don't = 토큰에 존재하지만 코드에서 사용되지 않는 값, 또는 일관성을 깨뜨리는 패턴**

| Do 추출 방법 | 예시 |
|-------------|------|
| Grep 빈도 1위~5위 패턴 | "theme key로만 색상 참조, hex 하드코딩 금지" |
| 모든 컴포넌트에 공통인 패턴 | "useShadow() 훅으로 그림자 적용" |
| 선택 상태에서 일관된 색상 | "선택 상태는 zzem_violet_500/600" |

| Don't 추출 방법 | 예시 |
|----------------|------|
| 토큰에 있지만 사용 안 되는 값 | "elevation xl(16 32) 미사용 — 과도한 그림자 지양" |
| 코드에서 명시적으로 회피하는 패턴 | "inline fontSize 금지 — Typo 컴포넌트 사용" |
| 불일치가 발견된 패턴 | 반례가 1개 이하이면 Don't로 확정 |

### Step 5: preview.html 생성

DESIGN.md의 시각적 카탈로그를 self-contained HTML로 생성한다.

구성:
- 색상 팔레트 스와치 (brand + semantic + function)
- 타이포그래피 스케일 미리보기
- 컴포넌트 스타일 샘플 (button, card, input, badge)
- Elevation 레벨 비교
- Do's / Don'ts 시각적 예시

### Step 6: Design Engineer 연결

DESIGN.md 생성 후, Design Engineer가 자동 참조하도록 연결한다:

1. `design-engineer.md`의 Context Engine WHAT 레이어에 DESIGN.md 참조 추가
2. Step A (Context Engine Assembly)에서 `docs/designs/DESIGN.md` 읽기를 필수 단계로 포함

### Step 7: 검증

- [ ] DESIGN.md의 모든 hex 값이 `wds-tokens/` 또는 `app-design-guide`에 실재하는지 확인
- [ ] Do's 항목이 실제 코드에서 3회+ 관찰되는지 Grep으로 검증
- [ ] Don'ts 항목이 실제 코드에서 사용되지 않는지 확인
- [ ] preview.html이 브라우저에서 정상 렌더링되는지 확인

## 주의사항

- **fabrication 금지**: DESIGN.md의 모든 값은 원천 파일에서 추출한 것이어야 한다. 추측으로 보완하지 않는다.
- **Visual Atmosphere만 서술 허용**: 나머지 8개 섹션은 데이터(테이블, 코드, hex 값) 중심으로 작성.
- **서술의 근거 명시**: Atmosphere의 각 문장에 대해 어떤 토큰/패턴에서 도출했는지 주석 가능.
- **기존 토큰과 충돌 금지**: DESIGN.md는 wds-tokens를 해석하는 문서이지, 새로운 토큰을 정의하지 않는다.
- **프로젝트 레벨**: 스프린트마다 재생성하지 않는다. 토큰이 변경될 때만 갱신.
- **갱신 시**: `/extract-design --update` 로 기존 DESIGN.md와 diff를 출력하고, 변경 항목만 반영.
