# BE-001 — Schema Extensions: Filter & Content

## Target
- `apps/meme-api/src/persistence/filter/filter.schema.ts`
- `apps/meme-api/src/persistence/content/content.schema.ts`

## Context
preview-feature는 부모 workflow 필터 + 자식 i2i/i2v 필터 구성. Content는 노출 여부와
부모 추적이 필요. 현재 schema에는 `hasDecompPreview`, `decompRole`, `parentFilterId`,
`isHidden`, `sourcePreviewContentId`가 모두 부재.

## Objective
Filter / Content 두 스키마에 preview-feature가 의존하는 신규 필드를 추가한다. 기존
필드의 의미·기본값은 변경하지 않는다.

## Specification

### Filter (additions)
| Field | Type | Default | Note |
|---|---|---|---|
| `hasDecompPreview` | `boolean` | `false` | parent filter only. agent endpoint가 자동 세팅 (BR-8). |
| `requiredCredit` | `number` | `0` | parent에서 총액으로 사용. child requiredCredit는 사용 안 함 (BR-1). |
| `parentFilterId` | `string \| null` | `null` | child filter만 채워짐. |
| `decompRole` | `'i2i' \| 'i2v' \| null` | `null` | child filter 분류. |

### Content (additions)
| Field | Type | Default | Note |
|---|---|---|---|
| `isHidden` | `boolean` | `false` | i2i preview Content만 `true`. |
| `decompRole` | `'i2i' \| 'i2v' \| null` | `null` | preview 경로 Content만 채움. |
| `parentFilterId` | `string \| null` | `null` | preview Content의 source workflow filter id. |
| `sourcePreviewContentId` | `string \| null` | `null` | i2v Content가 i2i preview Content를 가리킴. |

### Migration
- 기존 도큐먼트는 신규 필드의 기본값을 자동 적용 (semantic-breaking fallback 금지 — 패턴 completeness-008 참조).
- index 추가: Content `{ userId: 1, isHidden: 1 }` (목록 쿼리 최적화).

## Acceptance Criteria
- [ ] Filter 스키마에 4개 필드 추가, 타입과 default 일치.
- [ ] Content 스키마에 4개 필드 추가, 타입과 default 일치.
- [ ] 기존 typed-DTO/Mapper에서 새 필드의 누락 또는 fallback (`?? false`, `|| null`) 없음 (`rg` gate).
- [ ] 기존 list/aggregate 쿼리가 새 필드의 추가로 깨지지 않는다 (Content 인덱스 신규 추가가 기존 쿼리 plan을 회귀시키지 않음).

## Implementation Hints
- 기존 enum 컨벤션: `apps/meme-api/src/common/constant/` 디렉토리의 다른 enum 파일 참조.
- Mongo schema 정의 스타일: 동일 폴더의 기존 스키마 파일 참조.
