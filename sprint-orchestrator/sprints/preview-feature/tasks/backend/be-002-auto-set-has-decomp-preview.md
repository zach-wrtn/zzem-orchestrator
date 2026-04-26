# BE-002 — Auto-set `hasDecompPreview` on Parent (BR-8)

## Target
agent (admin/internal) endpoint that registers child filters — same controller
that today creates child filters with `decompRole`. Likely under
`apps/meme-api/src/controller/filter/` or an admin/agent module.

## Context
Per BR-8: "agent endpoint에서 `decompRole: 'i2i'` child filter 등록 시 → parent
filter에 `hasDecompPreview: true` 자동 세팅". Content Factory는 변경하지 않는다 (NEVER).

## Objective
i2i child filter 등록 트랜잭션 안에서 parent filter의 `hasDecompPreview`를 idempotent
하게 `true`로 갱신한다.

## Specification
- 트리거: child filter 생성 요청에서 `decompRole === 'i2i'`인 경우만.
- 동작: 동일 트랜잭션/세션에서 `Filter.updateOne({ _id: parentFilterId }, { $set: { hasDecompPreview: true } })` 실행.
- 멱등성: 이미 `true`이면 no-op. 동시성 시 conflict 없음.
- 실패 정책: parent 갱신 실패 시 child 등록도 롤백 (atomic).

## Acceptance Criteria
- [ ] i2i child 등록 시 parent의 `hasDecompPreview = true`.
- [ ] i2v child 등록(또는 다른 decompRole)에서는 parent flag를 변경하지 않는다.
- [ ] Idempotent: 같은 parent에 두 번 i2i child를 등록해도 부작용 없음.
- [ ] child 등록 실패 시 parent flag도 변경되지 않는다 (atomic).

## Implementation Hints
- 기존 child filter 등록 흐름을 base로 사용; Content Factory 코드는 만지지 않는다 (NEVER).
