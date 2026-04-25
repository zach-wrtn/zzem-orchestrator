# Stage 3: v2 Prototype Pipeline Dogfood — Options

> 2026-04-25. Stage 1+2 완료 (PR #30-#35) 후, v2 prototype pipeline 의 첫 실 dogfood 시작 옵션 정리.

## 재검토 배경

당초 권장: 기존 `ugc-platform-integration-qa` sprint 의 AC-2.3 (modal) + AC-7.4 (empty_state) 화면을 신규 prototype 으로 만들어 v2 archetype persona dogfood. **그러나 PRD 재독 결과 부적합 판명**:

- PRD 명시: "기능 추가 금지. 순수 QA / 안정화 / 누적 carryover 해소"
- AC-2.3 / AC-7.4 모두 **기존 flow Manual QA carryover** — 신규 prototype 생성 작업이 아님
- "UI copy 변경 금지" — 새 화면 디자인 자체가 NEVER DO

→ 기존 sprint 에 prototype 작업을 끼우면 PRD 경계 위반. 다른 경로 필요.

## 옵션 A: Eval Harness 로 검증 (코드 미변경)

**개요**: PR #34 머지 후, eval harness 로 역사적 PRD 3-5개를 frozen input 으로 freeze → DE 재실행 → baseline 산출. 회귀 측정 인프라가 첫 운용. v2 features 는 historical PRD 에 적용되어 비교 가능.

**Pros**:
- 신규 sprint 시작 비용 0
- v2 features (Pass 6 / Preview / Asset / Variants / Persona / Exemplars) 모두 동일 입력으로 측정 가능
- Eval baseline freeze 자체가 #34 의 Phase 2 산출물

**Cons**:
- Phase 2 baseline freeze 가 사용자 검수 + ANTHROPIC_API_KEY secret 필요 — 1회성 셋업 비용
- "실 sprint 에서 v2 가 작동하는가" 라는 질문에 직접 답 못함 (가상 reproducer)

**규모**: 0.5-1 day (셋업 + 4 PRD 실행 + baseline 검수)

**선결 조건**: PR #34 머지 + Phase 2 follow-up PR

---

## 옵션 B: 작은 신규 PRD 로 exploratory sprint

**개요**: ZZEM 의 다음 small feature (1-3 화면) 를 v2 pipeline 으로 처음부터 끝까지 실 sprint. 후보:
- 알림 설정 화면 (form + modal)
- 도움말/FAQ (feed + detail)
- 첫 사용 walkthrough (onboarding)
- 검색 필터 시트 (modal + empty_state)

**Pros**:
- 진짜 sprint dogfood — Pass 6 / Preview / Asset / Variants / Persona / Exemplars 모두 라이브 검증
- archetype 다양성 확보 (3-4 archetype 동시 노출 가능)
- 산출물이 실제 다음 sprint 자산 (PRD + prototype)

**Cons**:
- 사용자 input 필요 — 어떤 feature?
- 신규 PRD 작성 ~1-2 hour
- Sprint 자체 1-2 day

**선결 조건**: PR #30/#31/#32 머지 + 사용자가 feature topic 지명

---

## 옵션 C: 역사 PRD 재 prototype (exercise only)

**개요**: 이미 ship 된 sprint (ugc-platform-001/002, free-tab) 의 1-2 화면을 v2 pipeline 으로 재 prototype. 비교: 기존 prototype.html vs v2 산출. 새 sprint 아님 — 단발 exercise.

**Pros**:
- PRD 작성 0 (역사 PRD 재사용)
- Before/After 직접 비교 가능 (가장 명확한 v2 가치 측정)
- exemplar 후보 발견 ("v2 로 다시 만들었더니 더 좋아진 화면")

**Cons**:
- 진짜 sprint 가 아님 — 일부 phase (PR 머지 / E2E) 미실행
- 비교 기준 (기존 prototype) 이 같은 PRD 로 만들어지지 않았을 가능성 (PRD 변경 이력)

**규모**: 2-4 hour (1 화면당 30-60분)

**선결 조건**: PR #30/#31/#32 머지

---

## 권장 시퀀스

```
1. PR #30 + #31 머지            (verify infra 안정화, low review burden)
2. PR #32 머지                  (archetype persona — 다른 옵션 모두에 필수)
3. 옵션 C 1 화면 실험            (4시간, 즉각 v2 가치 측정)
   - 권장 후보: free-tab/app-001 Home (feed archetype, 이미 PR #31 emoji 정리됨)
   - 또는: ugc-platform-002/app-002 (PR #30 으로 false-pass 노출된 화면 — verify 회귀 케이스 포함)
4. 옵션 C 결과 review 후 두 분기:
   - 만족 → 옵션 B (실 sprint) 로 진행
   - 미흡 → 옵션 A (eval harness baseline freeze) 로 quantify
5. PR #33/#34/#35 머지         (옵션 C/A/B 의 결과로 우선순위 재조정)
```

**왜 옵션 C 우선**: 가장 빠른 v2 가치 측정 + 신규 PRD 미필요 + 사용자 입력 없이 즉시 시작 가능. 결과로 다음 분기 결정.

## 옵션 외 follow-up PRs (모두 Stage 3 와 병렬 가능)

- **#34 Phase 2**: 4 frozen input + baseline freeze. 옵션 A 의 선결 조건. 별 PR.
- **#35 Bootstrap**: 초기 5-10 exemplar 큐레이션 (옵션 C 결과를 exemplar 후보로). 별 PR.
- **#32 ↔ #35 충돌**: 후순위 머지 PR 의 design-engineer.md Pass 6 audit 표 row 번호 +1 rebase. Conflict resolution 별 PR 또는 머지 시 처리.

---

## 사용자 결정 필요

1. **PR 머지 순서/시점**: #30→#31→#32 우선 머지 OK?
2. **옵션 A/B/C 선택 또는 조합**: 권장 = C 우선 → 결과 보고 분기
3. **옵션 C 시작 시 화면 후보**: free-tab/app-001 Home (feed) vs ugc-platform-002/app-002 (false-pass 화면) 중 1택, 또는 둘 다
