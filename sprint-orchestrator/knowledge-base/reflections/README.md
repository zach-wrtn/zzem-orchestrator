# Reflections (Reflexion-style Memory)

> 스프린트 종료 시 Sprint Lead가 1페이지 자연어 회고를 작성한다.
> 다음 스프린트의 Phase 2 (Spec)에서 같은 도메인의 최근 reflection이 자동 로드된다.

## File Naming

- 경로: `knowledge-base/reflections/{sprint-id}.md`
- 1 sprint = 1 reflection (없으면 다음 스프린트가 학습 못 함 — 누락 금지)

## Schema

```markdown
# Reflection: {sprint-id}

> Generated: {ISO8601}
> Domain: {예: ugc-platform | growth | infra | ...}
> PRD: {prd-source}

## What worked
- {성공 요인 2~3개. 다음 스프린트에 재사용 가능한 형태로}

## What failed (with root cause)
- {실패 1}: {1줄 trace} → {root cause}
- {실패 2}: ...

## Lesson (next-sprint actionable)
- {다음 스프린트 Phase 2/4에 반영할 구체 지침. "~~할 때 ~~를 먼저 검증한다" 형태}

## Pointers
- pattern-digest: {경로}
- gap-analysis: {경로}
- 관련 KB pattern ids: [{id1}, {id2}]
```

## Write Protocol

Phase 6 (Retro) 6.7d 단계에서 자동 생성:
1. `pattern-digest.yaml` + `gap-analysis.yaml` 읽기
2. 위 4개 섹션을 1페이지(<= 400단어)로 요약
3. 동일 도메인 직전 reflection이 있으면 1줄로 "직전 lesson 반영 여부" 평가 추가

## Read Protocol (Phase 2 Spec 시점)

Phase 2 시작 시:
1. `knowledge-base/reflections/` 디렉토리 ls
2. 같은 domain 태그 + 최근 3개 파일 선택
3. 각 reflection의 "Lesson" 섹션만 추출 → Spec 작성 컨텍스트에 주입
4. 신규 PRD 분석 후, 관련 lesson을 명시적으로 채택/기각

## Auto-Cleanup

| 조건 | 액션 |
|------|------|
| 6개월 이상 미참조 | `archived/`로 이동 |
| Lesson이 KB pattern으로 승격됨 | 본문 상단에 `superseded_by: pattern-{id}` 추가 |
