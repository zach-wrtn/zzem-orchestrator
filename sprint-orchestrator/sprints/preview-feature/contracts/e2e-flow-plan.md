# E2E Flow Plan — preview-feature

> Maestro flow ↔ AC 매핑. Phase 3 prototype-only sprint이므로 본 plan은 후속 build sprint
> 인계용 reference. flow 작성은 build phase에서 수행한다.

## Existing Flows (reference)
- `apps/MemeApp/e2e/flows/filter-preview.yaml` — 기존 FilterPreview 화면.
- `apps/MemeApp/e2e/flows/meme-collection.yaml` — MemeCollection 화면.
- `apps/MemeApp/e2e/flows/credit-paywall.yaml` — 크레딧 부족 sheet.
- `apps/MemeApp/e2e/flows/deeplink-smoke.yaml` — 딥링크 진입.

## Maestro Constraints (재확인)
- Fabric+RNGH tap 미발화 — 새 화면은 zzem:// 딥링크 진입 우선 (APP-008).
- CTA tap → 결과 검증은 `assertVisible`까지만, 실제 효과는 Evaluator 코드 추적에 위임.

## AC ↔ Flow Mapping

| AC | Flow strategy | 대상 flow / 추가 step |
|---|---|---|
| 2.1.1 미리보기 버튼 노출 | **Extend** `filter-preview.yaml` | `assertVisible: id: meme.filterPreview.previewButton`. `hasDecompPreview: true` 필터 시드 필요 (BE seed). |
| 2.1.2 바텀시트 진입 | **Extend** `filter-preview.yaml` | `tapOn: id: meme.filterPreview.previewButton` → `assertVisible: id: meme.previewSheet.sheet` + image picker + CTA disabled. |
| 2.1.3 이미지 선택 | **New** `preview-image-attach.yaml` | image picker는 native dialog → **Deferred (native-dialog)**. 대신 testID로 selected variant 직접 시뮬레이션 (디버그 hook). 시드 이미지 fixture 필요. |
| 2.1.4 CTA 활성화 | (위 New에 포함) | selected variant 진입 후 `assertVisible: id: meme.previewSheet.previewCta` enabled. |
| 2.1.5 검증 순서 | **Deferred (BE-only)** | 단위 + 통합 테스트로 검증. e2e는 결과 화면 진입까지만. |
| 2.1.6 크레딧 부족 | **New** `preview-credit-insufficient.yaml` | 잔액 0 fixture로 BE 응답 402 시뮬 → `credit-paywall` sheet visible. |
| 2.1.7 유해 이미지 | **Deferred (server-injection-required)** | Rekognition 응답 mock 필요. 대안: BE 통합 테스트 + 수동 QA. |
| 2.1.8 로딩 화면 | **New** `preview-loading.yaml` | 딥링크 `zzem://preview/loading?contentId=...&parentFilterId=...` 진입 → `assertVisible: id: meme.previewLoading.spinner` + 라벨. |
| 2.1.9 로딩 중 이탈 | **Extend** `preview-loading.yaml` | `tapOn: id: meme.previewLoading.closeButton` → `assertVisible: id: meme.previewLoading.cancelDialog`. [나가기] tap → `assertVisible: id: meme.filterPreview.screen`. |
| 2.1.10 결과 표시 | **New** `preview-result.yaml` | 딥링크 `zzem://preview/result?contentId=...` → image visible + proceed CTA visible + label에 정확한 i2v credit. |
| 2.1.11 결과 화면 이탈 | **Extend** `preview-result.yaml` | X tap → cancel dialog → [나가기] → FilterPreview. |
| 2.2.1 i2v 전환 | **Extend** `preview-result.yaml` | proceed CTA tap → `assertVisible: id: meme.collection.screen`. |
| 2.2.2 i2v 폴링 | **Covered** `meme-collection.yaml` | 기존 폴링 검증으로 충족. |
| 2.2.3 기존 만들기 경로 | **Covered** `filter-preview.yaml` | [만들기] 버튼 tap 회귀 검증 추가 (assertion만). |
| 2.3.1 isHidden 격리 | **Deferred (BE-only)** | 통합 테스트 (BE-008 task의 AC). |
| 2.3.2 parentFilterId nav | **New** `preview-parent-nav.yaml` | i2v Content fixture 시드 후 collection → viewer → filter detail navigation에서 parent filter 진입 검증. |
| 2.3.3 콜백 분기 | **Deferred (BE-only)** | BE-006 통합 테스트. |
| 2.3.4 i2i 실패 환불 | **Deferred (BE-only + time-warp)** | BE 통합 테스트. |
| 2.3.5 i2v 부분 환불 | **Deferred (BE-only)** | BE 통합 테스트. |
| 2.3.6 슬롯 관리 | **Deferred (multi-device + BE-only)** | BE-009 통합 테스트. |

## Coverage Summary
- Covered: 2 (2.2.2, 2.2.3)
- Extend: 4 (2.1.1, 2.1.2, 2.1.9, 2.1.11)
- New: 6 (2.1.3, 2.1.6, 2.1.8, 2.1.10, 2.2.1, 2.3.2) — flows: preview-image-attach, preview-credit-insufficient, preview-loading, preview-result, preview-parent-nav (2.2.1은 preview-result extend로 흡수).
- Deferred: 8 (2.1.5, 2.1.7, 2.3.1, 2.3.3, 2.3.4, 2.3.5, 2.3.6) — 사유 명시 (BE-only / native-dialog / server-injection-required / time-warp / multi-device).

## Required Seeds
- workflow filter with `hasDecompPreview: true` (parent + i2i child + i2v child).
- preview Content fixture (i2i, status=DONE, with falCdnUrl) for `preview-result.yaml`.
- i2v Content fixture (parentFilterId=parent) for `preview-parent-nav.yaml`.
- low-balance user for `preview-credit-insufficient.yaml`.

## Notes
- e2e seed fetcher names (build phase): `fetch-seed-preview-filter.mjs`, `fetch-seed-preview-content.mjs`.
- BE 사전 작업 (build phase 시점에 BE 태스크 Specification에 반영):
  - 시드 endpoint 또는 seed script (BE 별도 follow-up).
