# PRD: ugc-platform-integration-qa

**Sprint ID**: ugc-platform-integration-qa
**Type**: QA / 안정화 스프린트 (follow-up of `ugc-platform-003`)
**Start**: 2026-04-24
**Canonical PRD**: `docs/prds/ugc-platform-integration-qa.md` ← **SSOT — 이 파일을 참조**

> 본 디렉토리의 PRD.md 는 canonical PRD 에 대한 orchestration-layer index. 실제 User Stories / Acceptance Criteria / Business Rules 는 canonical 파일에서 읽는다.

---

## 성격

**기능 추가 금지. 순수 QA / 안정화 / 누적 carryover 해소.**
3 Phase (ugc-platform-001/002/003) 의 통합 검증 + Phase 1 시절부터 잠복한 config 버그 + 런타임 안정성 gate + cross-phase integration scenario 구축.

## 선행 스프린트

- ugc-platform-001 (merged #794/#555) — 프로필 & 네비게이션
- ugc-platform-002 (merged #799/#562) — 피드 인터랙션 & 페이백
- ugc-platform-003 (merged #804/#563) — 소셜 & 알림

## Group Plan (orchestration level, canonical PRD 에서 선별)

| Group | Scope | Canonical AC | Priority | Repo |
|-------|-------|--------------|----------|------|
| 001 | ApiInstance.Auth base URL misalignment 해소 | AC 4.1-a (env/CI) + AC 4.1-b (32 repo-impl migration) | **P0** — 잠복 버그 (모든 /v2/* 404) | app |
| 002 | Seed fetcher 인프라 + 미통과 E2E flow 복구 | AC 2.1 (7 seed) + AC 1.2 (7 flow) + AC 1.3 regression | P0 | app (e2e/) |
| 003 | 런타임 crash 게이트 + Manual QA carryover | AC 3.1 (Typo whitelist) + AC 3.2 (screen mount) + AC 6.1 (AC-2.3) + AC 6.2 (AC-7.4 regression flow) | P1 | app + CI |
| 004 | Cross-phase integration E2E flows | AC 7.1 (Flow A) / 7.2 (B) / 7.3 (C) / 7.4 (D) | P1 | app (e2e/) |
| 005 (stretch) | IAP crash + Token refresh + Regression dashboard | AC 4.3 + AC 5.1/5.2 + AC 8.1/8.2 | P2 | app + CI |
| 006 (stretch) | Grid Feed Masonry + Explore tab 디자인 정합 | US9 (9.1-9.4) + US10 (10.1-10.5) | P2 — 기능 정합, QA 와 분리된 track | app (UI) |

**그룹 의존성**:
- Group 001 은 독립 (config + data layer).
- Group 002 / 003 / 004 는 Group 001 완료 후 (API 실제 200 을 전제로 E2E flow 검증).
- Group 005 / 006 은 Group 001-004 와 병렬 실행 가능하나 스프린트 scope 여유 시 착수.

## 실행 전략

iterative Group-by-Group — 각 Group 이 Build → Evaluate → Accept 후 다음 Group Spec 세부화.
이 PRD 는 **Group 001 착수를 위해 상세화**된 상태. Group 002+ 는 Group 001 완료 후 canonical PRD 를 다시 참조하여 세부 task 작성.

## Cross-cutting 제약 (canonical PRD 경계 §537)

### ALWAYS DO
1. E2E full suite CI 연동 (최종 목표)
2. `.env.example` / `.env.version` 최신 dev/prod 값 반영
3. Manual QA carryover 종결 후 다음 스프린트 시작
4. `@wrtn/app-design-guide` variant 화이트리스트 검증

### NEVER DO
1. **기능 추가 금지** — 본 스프린트는 순수 QA/안정화
2. **BE API 변경** (필요 시 별도 BE 스프린트)
3. **UI copy 변경**
4. **Airbridge/Datadog SDK 제거**

### OUT OF SCOPE
1. Phase 4 신규 feature
2. 프로덕션 배포 파이프라인 변경
3. react-native / @wrtn/common-app 버전 upgrade
4. @wrtn/app-design-guide 신규 variant 추가
5. **AC-6.2 nickname sort** — canonical PRD §580 "정리 대상" 브레인덤프에만 언급. 별도 후속 sprint (code stashed in reflog @ bff2ec23 / 58d6aed8 for reference; 필요 시 cherry-pick).

## Pivot 기록

- 초기 Phase 1 에서 Delta PRD 를 retrospective + deferred-items.yaml 기반으로 잘못 구성하여 nickname sort 를 P0 으로 포함. Group 002 구현 + Evaluator round 1 완료 (ISSUES → Minor #3 fix 후 ACCEPT 예정) 상태에서 canonical PRD 재확인 결과 NEVER DO #1 저촉 판정. 2026-04-24 backend reset (backend HEAD → 9cfebaaf = 003 merge point). Phase 2 재착수.
- Retrospective 기록 대상: Sprint Lead 가 Phase 1 init 시 `docs/prds/` canonical PRD 경로 선행 확인 필수.

---

## Regression Guard (003 + inherited)

003 + 이전 스프린트에서 fulfilled 된 기능이 본 스프린트 작업 (특히 Group 001 ApiInstance migration 후) 에 회귀되지 않는지 canonical PRD AC 1.3 Regression flow 로 검증.

AC 4.1-b 이후 특히 확인 대상: 본인 프로필 렌더 / 콘텐츠 카운트 / 좋아요 탭 / 알림 unread count / 팔로우 상태 — Phase 1 이후 처음으로 실제 데이터 렌더.
