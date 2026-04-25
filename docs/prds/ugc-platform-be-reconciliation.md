---
prd_id: ugc-platform-be-reconciliation
title: "UGC Platform BE Reconciliation — qa-2 spec ↔ 실 production BE 정합성"
type: reconciliation / mini-sprint
start: 2026-04-25
predecessor: ugc-platform-integration-qa-2
status: draft
---

# PRD: UGC Platform BE Reconciliation

**Sprint ID**: `ugc-platform-be-reconciliation`
**Canonical PRD**: `docs/prds/ugc-platform-be-reconciliation.md` ← **SSOT**
**Predecessor**: `ugc-platform-integration-qa-2` (qa-2 sprint dogfood 결과 발견)
**Repo**: backend (verify-only) + app (data layer fix if needed)

---

## 성격

**Mini reconciliation sprint**. qa-2 sprint Phase 2 에서 `api-contract.yaml` 을 Mock 으로 작성했으나, dogfood 단계에서 **BE 엔드포인트가 이미 production 에 존재함** 을 발견. spec ↔ 실 BE 정합 검증 + 차이가 있으면 spec 또는 app data layer 수정.

**OUT OF SCOPE**: 신규 BE 기능, BE 코드 변경 (엔드포인트는 이미 production-shipped), 알림 push 발송 인프라.

---

## 발견된 BE endpoint 정합 (qa-2 dogfood 시점)

| qa-2 spec endpoint | meme-api 실제 controller | 정합도 |
|---|---|---|
| `POST /v2/users/{userId}/block` | `POST /v2/users/:userId/blocks` | ⚠ path 마지막 `s` 차이 |
| `DELETE /v2/users/{userId}/block` | `DELETE /v2/users/:userId/blocks` | ⚠ 동일 |
| `GET /v2/me/blocked-users` | `GET /v2/me/blocks` | ⚠ path 다름 |
| `GET /v2/me/notifications` | `GET /v2/notifications` (controller path 외) | ⚠ controller mount path 검증 필요 |
| `PATCH /v2/me/notification-settings` | `PATCH /v2/me/notification-settings` | ✅ |
| `GET /v2/me/notification-settings` | `GET /v2/me/notification-settings` | ✅ |
| `POST /v2/me/avatar/presigned-url` | (TBD — 검증 필요) | ❓ |

## Group Plan

### Group 001 — Endpoint diff investigation (read-only)

**Priority**: P0
**Repo**: backend (read-only)

Tasks:
1. 7 endpoint 의 actual path / payload schema (request + response) 추출 (controller + DTO + zod schema)
2. qa-2 `api-contract.yaml` 와 1:1 비교
3. avatar presigned-url 엔드포인트 위치 확인
4. **차이 정리 보고서**: `sprints/{id}/contracts/be-vs-spec-diff.md`

### Group 002 — Spec OR app fix (write)

**Priority**: P0
**Repo**: app (data layer 또는 spec) — backend 변경 없음

Tasks (Group 001 결과로 결정):
- Path 차이 → app data layer 의 RepositoryImpl URL 수정 (이미 prior sprint 에서 처리됐을 가능성 — verify only)
- Field 명 차이 (`pushAll` vs `push`) → 결정 + reconcile (data layer 또는 BE Mock 의 spec 정정)
- Spec 에 잘못된 path 명시된 부분 정정 → `api-contract.yaml` update

### Group 003 (옵션) — `app` 데이터 레이어 audit

**Priority**: P1 (Group 002 결과에 따라)

Tasks:
- 차단/알림 관련 RepositoryImpl 의 endpoint URL 이 모두 실 BE 와 일치하는지 final check
- 회귀 테스트 (existing `__tests__/*.test.ts`)

---

## ALWAYS DO
1. 신규 BE 코드 변경 금지 — 본 sprint 는 verify + spec/app fix 만
2. `pushAll` vs `push` 결정은 BE 의 actual schema 우선
3. 결과는 별 PR 로 commit

## NEVER DO
1. 신규 BE 엔드포인트 생성
2. 기존 BE 엔드포인트 path / payload 변경
3. 알림 push 발송 인프라 변경

## OUT OF SCOPE
1. 신규 기능 (차단 카테고리, 알림 카테고리 추가 등)
2. BE 데이터 모델 / 스키마 마이그레이션
3. push 인프라 (FCM/APNs)

---

## 산출물

- `sprints/{id}/contracts/be-vs-spec-diff.md` (Group 001 결과)
- `sprints/{id}/contracts/api-contract-corrected.yaml` (Group 002 — 수정된 spec, 가능 시)
- 1-2 PR (app data layer 또는 docs)
- retrospective: BE 엔드포인트 mock-vs-real 일치율

## 완료 기준

- 7 endpoint 의 actual path / payload schema 모두 문서화
- 차이가 있으면 spec 또는 app data layer 수정 PR 머지
- `pushAll` vs `push` 결정 commit
