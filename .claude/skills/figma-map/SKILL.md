---
name: figma-map
description: >
  PRD의 Acceptance Criteria와 Figma 디자인 프레임을 매핑하는 구조화된 파일을 생성한다.
  스프린트 프로토타입 생성/보정 시 Figma 레퍼런스를 AC 단위로 참조할 수 있게 한다.
  Triggers on: "피그마 매핑", "figma mapping", "PRD 피그마 연결", "figma-map",
  "피그마 URL 매핑", "AC 피그마 연결", "/figma-map".
  ALWAYS use this skill when mapping Figma design frames to PRD acceptance criteria.
---

# Figma-PRD Mapping

PRD의 AC를 기준으로 Figma URL을 매핑하는 `figma-mapping.yaml`을 생성하고, 선택적으로 Figma 디자인 컨텍스트를 추출하여 프로토타입 보정에 활용한다.

## 사용 시점

- **Phase 3 시작 전**: 프로토타입 생성 전에 Figma 매핑을 수집하여 Design Engineer에게 전달
- **Phase 3 리뷰 시**: 프로토타입과 Figma 간 괴리 발견 시 보정 기준으로 활용
- **독립 실행**: 스프린트 외에서도 PRD-Figma 매핑이 필요할 때

## 인자

```
/figma-map <sprint-id>                    # 스프린트의 figma-mapping.yaml 생성
/figma-map <sprint-id> --extract          # 매핑 후 Figma 디자인 컨텍스트 추출
/figma-map <sprint-id> --diff             # 현재 프로토타입과 Figma diff 분석
/figma-map <prd-file>                     # PRD 파일 직접 지정
```

## Steps

### Step 1: PRD AC 추출

스프린트 PRD 또는 직접 지정된 PRD 파일에서 AC를 추출한다.

```
1. PRD.md 또는 원본 PRD 파일 읽기
2. "AC X.Y" 또는 "### AC" 패턴으로 AC 목록 추출
3. 각 AC의 summary, 관련 화면, 관련 태스크 식별
```

### Step 2: 태스크-화면 매핑

스프린트 태스크 파일에서 `### Screens / Components` 섹션을 읽어 AC → Screen 매핑을 구성한다.

```
AC 2.1 → app/001-tab-navigation → screen-home, screen-explore, screen-profile
AC 2.4 → app/003-profile-edit → screen-profile-edit
AC 2.8 → app/004-settings-screen → screen-settings
```

### Step 3: figma-mapping.yaml 생성

아래 포맷으로 매핑 파일을 생성한다.

```yaml
# Figma-PRD Mapping: {sprint-id}
#
# figma는 항상 배열 형태로 작성:
#   figma:
#     - url: "https://www.figma.com/design/..."
#       note: "설명"
#
# Figma 디자인이 없으면: figma: []

AC_{N.M}_{제목}:
  summary: "{AC 요약}"
  prototype: app/{task-id}
  screens:
    - screen: {screen-id}
      label: "{화면 설명}"
      state: {default | empty | loading | ...}  # 선택
      figma:
        - url: ""
          note: ""
```

**저장 위치**: `sprints/{sprint-id}/prototypes/figma-mapping.yaml`

### Step 4: 사용자에게 URL 입력 요청

생성된 매핑 파일을 사용자에게 제시하고, 각 AC의 `figma:` 필드에 Figma URL을 채워달라고 요청한다.

```
figma-mapping.yaml이 생성되었습니다.
각 AC의 figma 필드에 해당 Figma 프레임 URL을 입력해주세요.

- 단일 프레임: url + note 1개
- 여러 프레임: url + note 여러 개 (배열)
- 디자인 없음: figma: [] (빈 배열)

입력 완료 후 알려주시면 디자인 컨텍스트를 추출합니다.
```

### Step 5: Figma 디자인 컨텍스트 추출 (--extract)

사용자가 URL을 채운 후 `--extract` 옵션으로 실행하면:

```
1. figma-mapping.yaml에서 URL이 있는 항목 필터링
2. 각 URL에서 fileKey와 nodeId 추출
   - figma.com/design/:fileKey/:fileName?node-id=:nodeId
   - node-id의 "-"를 ":"로 변환
3. Figma MCP로 디자인 컨텍스트 추출:
   - get_design_context: 코드 + 스크린샷 + 토큰 정보
   - get_screenshot: 시각적 레퍼런스 (대안)
4. 추출된 컨텍스트를 figma-refs/ 디렉토리에 저장
5. 요약을 figma-refs/summary.md에 기록
```

**병렬 추출**: URL이 여러 개면 병렬로 `get_design_context`를 호출하여 속도를 높인다.

### Step 6: Diff 분석 (--diff)

프로토타입이 이미 존재하는 경우, Figma 스크린샷과 프로토타입 스크린샷을 비교한다.

```
1. 프로토타입 스크린샷 캡처 (browse 스킬 활용)
2. Figma 스크린샷과 시각적 비교
3. 주요 괴리점 목록화:
   - 레이아웃 (그리드 열 수, 간격)
   - 컴포넌트 (버튼 색상, 아이콘 유무)
   - 타이포그래피 (폰트 크기, 무게)
   - 구조 (메뉴 항목, 섹션 구분)
4. diff-report.md 생성
```

## PRD-Figma 충돌 처리

PRD와 Figma 사이에 충돌이 발견되면 사용자에게 3가지 옵션을 제시한다:

| 옵션 | 설명 |
|------|------|
| **PRD 우선** | PRD 메뉴/기능 구성 유지, Figma 시각 스타일만 적용 |
| **Figma 우선** | Figma 디자인 그대로, PRD 업데이트 |
| **Merge** | Figma 스타일 + PRD 기능 요구사항 병합 |

충돌 항목과 선택한 해결 방식을 `figma-mapping.yaml`에 기록한다:

```yaml
AC_{N.M}:
  conflicts:
    - item: "차단 관리 메뉴"
      prd: "있음 (준비중)"
      figma: "없음"
      resolution: "merge"  # prd | figma | merge
      note: "PRD 요구사항 유지, Figma 스타일로 렌더링"
```

## 프로토타입 보정 워크플로우

매핑 + 추출이 완료되면 Design Engineer에게 보정 태스크를 할당할 때 다음 정보를 전달한다:

```
보정 태스크 입력:
1. figma-mapping.yaml — AC별 Figma URL 매핑
2. figma-refs/summary.md — 추출된 디자인 요약
3. diff-report.md — 프로토타입 vs Figma 괴리점 (있는 경우)
4. docs/designs/README.md — 기존 컴포넌트 패턴 (개별 컴포넌트 상세: docs/designs/components/*.mdx)
```

## component patterns 갱신

보정 과정에서 새로운 컴포넌트 패턴이 발견되면 `docs/designs/README.md` 및 해당 `docs/designs/components/*.mdx`에 추가한다. 이는 다음 스프린트에서 Figma 없이도 높은 품질의 프로토타입을 생성하기 위한 누적 학습 메커니즘이다.

```
보정 완료 후:
1. 보정 diff에서 새로운 패턴 식별
2. docs/designs/README.md 및 docs/designs/components/*.mdx에 패턴 추가/업데이트
3. 패턴 라이브러리가 충분히 쌓이면 Figma 보정 없이 생성 가능
```

## 주의사항

- Figma URL에서 `node-id`의 `-`를 `:`로 변환해야 MCP 호출이 성공한다
- `get_design_context`가 Code Connect 프롬프트를 반환하면 `disableCodeConnect: true`로 재호출
- 대용량 출력은 `excludeScreenshot: true`로 스크린샷 제외 후 별도로 `get_screenshot` 호출
- Figma 에셋 URL은 7일 후 만료됨. 장기 참조가 필요하면 로컬에 다운로드
