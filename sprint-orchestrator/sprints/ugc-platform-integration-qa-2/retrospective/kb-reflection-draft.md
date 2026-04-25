# KB Reflection Draft — qa-2 sprint

> **Status**: 본 문서는 KB (knowledge-base) 로 promote 되기 전 draft. 실 promotion 은 별 skill `zzem-kb` 으로 수행 (본 sprint closeout 의 scope 가 아님). 본 draft 는 향후 KB extractor 가 자동 인식할 수 있도록 metadata + Lesson + Pattern 두 섹션으로 구조화.

---

## Metadata

```yaml
domain: prototype-pipeline   # 또는 sprint-orchestration
title: "v2 prototype pipeline first live dogfood — production code audit pattern"
source_sprint: "ugc-platform-integration-qa-2"
date: "2026-04-25"
related_prs:
  - "orchestrator#37 (DE archetype self-reclassification)"
  - "orchestrator#38 (form-persona instant-save)"
  - "orchestrator#39 (modal picker exception)"
  - "orchestrator#40 (detail blocked variant)"
  - "orchestrator#41 (archetype enum nav_list)"
  - "orchestrator#42 (empty_state PRD copy 충돌)"
  - "orchestrator#45 + #46 (Phase 2 BE grep protocol)"
  - "app#579 / #580 / #581 (Phase 4 build + lint fix)"
  - "app#583 (USER_AVATAR enum wire)"
  - "be#842 (USER_AVATAR enum)"
related_files:
  - "sprint-orchestrator/sprints/ugc-platform-integration-qa-2/retrospective/v2-pipeline-dogfood-retrospective.md"
  - "sprint-orchestrator/sprints/ugc-platform-integration-qa-2/retrospective/ac-verification-matrix.md"
  - "sprint-orchestrator/sprints/ugc-platform-integration-qa-2/retrospective/intent-gate-decisions.md"
tags:
  - prototype-pipeline
  - sprint-orchestration
  - v2-dogfood
  - prototype-led-code-audit
  - be-grep-protocol
```

---

## Lesson (KB-extractable)

### Lesson 1: Phase 2 spec engineer BE grep protocol

**Statement**: Phase 2 spec engineer 가 PRD 에 BE OUT OF SCOPE 라벨링이 있을 때 actual BE source 를 grep 하지 않으면 Mock 부정확 위험이 매우 크다.

**Evidence**: qa-2 sprint 에서 7/7 mock endpoint 가 actual BE source (`~/dev/work/wrtn-backend`) 와 path/payload 0/7 일치. 차단/알림/사진 변경 모두 production endpoint 가 이미 존재하는데 spec engineer 가 grep 없이 추론으로 mock 작성 → 7/7 부정확. BE reconciliation mini-sprint 가 별도로 발생.

**Recommendation (코드화)**:
- Phase 2 spec engineer 의 Step 1 에 "actual BE source repo 를 grep 하여 endpoint 존재 여부 / payload 모양을 1차 확인" 추가.
- BE OUT OF SCOPE 라벨이 있더라도 "기존 endpoint 재사용 여부" 는 grep 으로 사실 확인 → mock 또는 actual contract 결정.
- v2.2 follow-up `2026-04-25-phase2-be-grep-protocol.md` 가 본 룰 명문화 (PR #45 → #46).

**Triggers**:
- 신규 sprint 가 prior sprints 의 도메인 (사용자/알림/차단 등) 의 화면을 추가할 때
- PRD 가 "Mock BE 진행" 을 명시할 때

---

### Lesson 2: archetype persona dogfood 가 production code 를 자동 검증

**Statement**: v2 prototype pipeline 의 archetype persona dogfood 는 production code 의 archetype 패턴을 (의도치 않게) 자동 검증한다. form persona conflict 가 production 의 403 PERSONA_LOCKED rollback 패턴과 1:1 일치하는 사례가 발견됐다.

**Evidence**: app-022 (알림설정_토글) 가 form persona 강제 룰 #2 (submit button) / #4 (1 primary action) 와 본질적으로 충돌 → DE 가 waiver 신청. 이 waiver 패턴이 production 의 `useNotificationSettings` mutation 의 즉시 호출 + onError rollback 패턴과 의미가 1:1 매핑됨 — production 도 사실상 form persona 우회를 사용 중. dogfood 가 production 의 sane-pattern 을 사후 검증한 셈.

**Recommendation**:
- archetype persona waiver 가 발생하면 "production code 가 같은 waiver 를 이미 운영 중인가?" 확인을 retrospective 에 필수 항목으로 추가.
- waiver 가 production 패턴과 일치하면 → archetype 룰 자체에 exception clause 명문화 (qa-2 의 v2.2 plan #1/#3/#4/#6 모두 이 패턴).

**Triggers**:
- DE 가 persona 강제 룰 waiver 를 신청
- prototype 이 PRD 의 의도적 충돌 케이스 (qa-2 AC-3.4 같은) 를 다룰 때

---

### Lesson 3: Prototype-led Code Audit pattern

**Statement**: Pre-existing production code 가 PRD AC 의 majority 를 충족하는 sprint 패턴이 존재한다. 이 경우 sprint 의 가치는 "full implementation" 이 아니라 "spec 정확도 검증 + extension only" 로 재정의된다 — 이를 **Prototype-led Code Audit** 패턴이라 부른다.

**Evidence**: qa-2 sprint 에서 13/13 PRD AC 중 12 AC 의 production code 가 prior sprints (ugc-platform-001/002/003) 에 이미 존재. Phase 4 build 는 ImageCropper wiring + USER_AVATAR enum + lint bug fix 3건만 처리 — full implementation 대비 80% 이상 감소.

**Recommendation**:
- 새 sprint 의 PRD 가 기존 도메인 화면 산출인 경우, Phase 0 (planning) 에 production code 확인 단계 추가.
- production code 가 majority fulfillment 하면 sprint 목표를 (a) prototype 으로 spec 검증, (b) edge case / polish 만 build 로 명시 재정의.
- 본 sprint 의 retrospective `ac-verification-matrix.md` 가 12/13 AC 를 "100% pre-implemented in prior sprint X" 로 표시 — 동일 매트릭스 형식을 이 패턴 적용 시 표준 산출물로 등재.

---

## Pattern (KB-extractable)

```yaml
pattern_id: prototype-led-code-audit
name: "Prototype-Led Code Audit"
domain: sprint-orchestration

applicable_when:
  - "PRD 가 기존 도메인 (사용자 / 알림 / 차단 등) 의 화면 산출을 명시"
  - "Production code 가 prior sprints 에서 majority 부분 구현된 상태"
  - "신규 feature 라기보다 polish / extension / edge case 보강이 주 산출물"
  - "Phase 0 / Phase 2 에서 production code grep 으로 사전 확인 가능"

mechanism:
  - step: "Phase 0 production code audit"
    action: "PRD AC 별로 production code 의 fulfillment 여부 확인 (grep + read)"
    output: "ac-verification-matrix.md 의 '100% pre-implemented' / 'partial' / 'gap' 분류"
  - step: "Phase 3 prototype 산출 (full coverage)"
    action: "23 화면 모두 prototype 산출 (production code 와 무관하게) — visual baseline + spec 검증 목적"
    output: "23 prototype.html + screen-spec.yaml"
  - step: "Phase 4 build 축소"
    action: "production code gap 만 patch — full implementation 회피"
    output: "1-3 PR (qa-2: PR #579/#580/#581 + #583)"
  - step: "Phase 4-5 retro"
    action: "spec engineer 의 mock 정확도 별 검증 (BE reconciliation mini-sprint trigger 포함)"
    output: "retrospective + KB lesson promotion"

effects:
  - effect: "Phase 4 build 가 polish/extension 패턴 (full implementation 대비 80% 이상 감소)"
    measured_in: "qa-2: 12/13 AC pre-fulfilled, 3건 patch (PR #579/#580/#583)"
  - effect: "spec engineer 의 BE mock 정확도 약점 노출 (BE grep protocol 트리거)"
    measured_in: "qa-2: 7/7 mock 부정확 발견 → BE reconciliation mini-sprint 신설"
  - effect: "prototype 의 dogfood 가치가 production code audit 가치로 확장"
    measured_in: "qa-2: 4 persona waiver 가 모두 production 의 sane-pattern 일치 → v2.2 plan 으로 룰 진화"

anti_patterns_avoided:
  - "Full re-implementation (이미 production 에 있는 코드 중복 작성)"
  - "Mock contract 설계 시 actual BE source grep 생략 → 부정확 mock"
  - "Persona waiver 발생 시 production 패턴 확인 없이 룰 강행 → production code 와 충돌"

related_patterns:
  - "phase2-be-grep-protocol (qa-2 의 sub-pattern)"
  - "archetype-waiver-promotion (waiver → 룰 진화)"
```

---

## Promotion Checklist (zzem-kb skill 으로 처리)

- [ ] Lesson 1 (BE grep protocol) → `domain: sprint-orchestration` 로 promote
- [ ] Lesson 2 (archetype dogfood production audit) → `domain: prototype-pipeline` 로 promote
- [ ] Lesson 3 (Prototype-led Code Audit) → `domain: sprint-orchestration` 로 promote
- [ ] Pattern `prototype-led-code-audit` → `patterns/sprint-orchestration/` 디렉토리 등재
- [ ] Cross-link: `feedback_canonical_prd_first.md` (관련 — PRD canonical 확인 + production code 확인 양쪽 trigger 명시)
