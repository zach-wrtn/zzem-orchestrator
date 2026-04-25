# PRD: ugc-platform-be-reconciliation

**Sprint ID**: ugc-platform-be-reconciliation
**Type**: Mini reconciliation sprint
**Start**: 2026-04-25
**Canonical PRD**: `docs/prds/ugc-platform-be-reconciliation.md` ← **SSOT**

> 본 디렉토리의 PRD.md 는 canonical PRD 의 orchestration-layer index.

## 성격

qa-2 sprint dogfood 에서 BE 엔드포인트가 이미 production 에 존재함을 발견. spec ↔ 실 BE 정합 검증 + spec 또는 app data layer 수정. **신규 BE 코드 0**.

## Group Plan

| Group | Scope | Repo | Priority |
|-------|-------|------|---------|
| 001 | Endpoint diff investigation (read-only) | backend | P0 |
| 002 | Spec OR app data layer fix (write) | app/spec | P0 |
| 003 (옵션) | App data layer audit | app | P1 |

상세 AC + endpoint 표: `docs/prds/ugc-platform-be-reconciliation.md`
