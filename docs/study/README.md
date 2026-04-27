# 시스템 진화 스터디

ZZEM Orchestrator 가 2026-04-08 inception 부터 현재까지 어떻게 만들어졌는지를 회차별로 정리한 학습 자료. 새 팀원 / 다음 세션의 Claude / 본인 회고 모두를 청자로 둠.

## 회차 목차

| 회차 | 주제 | 상태 | 파일 |
|------|------|------|------|
| 1 | 타임라인 + 시스템 큰 그림 (어떻게 6 Phase 가 정착됐는지) | ✅ 작성 | [01-timeline-and-big-picture.md](01-timeline-and-big-picture.md) |
| 2 | Knowledge Base 진화 (파일 → standalone repo → two-axis) | 🟡 예정 | `02-knowledge-base-evolution.md` |
| 3 | Prototype Pipeline v1 → v2 → v2.2 (Pass 6 / Variants / Persona / Exemplars 도입 순서와 이유) | 🟡 예정 | `03-prototype-pipeline.md` |
| 4 | Self-improving 메커니즘 (Rubric 승격 / Reflection / Pattern Digest) | 🟡 예정 | `04-self-improving.md` |
| 5 | 미적용 로드맵 + gating criteria | 🟡 예정 | `05-roadmap-and-gating.md` |

## 이 자료를 읽는 법

- **새 팀원**: 1 → 2 → 3 → 4 → 5 순서. 회차 끝의 "더 읽을 자료" 에서 원본 plan/spec 까지 깊이 들어감.
- **시스템 회고**: 1 의 inflection points 표 → 4 의 self-improving 메커니즘 → 5 의 gating criteria. "왜 그렇게 결정했는가" 가 보임.
- **다음 세션의 Claude**: 1 의 큰 그림 → 5 의 미적용 항목 + gating 으로 진행 권장 사항을 결정.

## 주의

- 회차 문서는 작성 시점의 1차 사료 (`docs/superpowers/plans/`, `specs/`, git log, sprint REPORT.md) 기반 합성본. 시간이 지나 KB / phase 룰이 바뀌면 본문이 stale 해질 수 있음 → 분기마다 audit 권장.
- 1차 사료는 절대 삭제 금지. 본 study 문서는 **요약** 이고, 진화의 detail 은 `docs/superpowers/plans/` 의 dated 파일이 SSOT.
