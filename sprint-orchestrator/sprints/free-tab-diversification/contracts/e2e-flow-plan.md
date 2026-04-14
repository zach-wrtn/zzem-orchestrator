# E2E Flow Plan — free-tab-diversification

> Maestro 제약: Fabric+RNGH tap 미발화 → 네비게이션은 딥링크 우선. CTA→결과 검증은 `assertVisible`까지만, 결과 추적은 Evaluator 몫.

## 기존 flow (재사용)
- `home-tabs.yaml`, `swipe-feed.yaml`, `filter-preview.yaml`, `meme-collection.yaml`, `guest-credit-redirect.yaml`, `deeplink-smoke.yaml`, `login-entry-point.yaml`.

## 신규/확장 flow

| 이름 | 분류 | 대상 AC |
|------|------|---------|
| `home-tabs.yaml` | Extend | AC 2.1.4 (레드닷), AC 2.1.1(카드 수 스모크) |
| `free-tab-grid.yaml` | New | AC 2.1.1, 2.1.2, 2.1.3, 2.5.1 (배너 testID) |
| `swipe-feed.yaml` | Extend | AC 2.2.1, 2.3.1 |
| `swipe-feed-free-circular.yaml` | New | AC 2.2.2 |
| `filter-preview.yaml` | Extend | AC 2.2.4 (무료 경로 진입까지) |
| `free-gen-confirm.yaml` | New | AC 2.2.3, 2.6.3 (바텀시트 노출) |
| `external-entry-free-parity.yaml` | New (+ Deferred) | AC 2.7.1, 2.7.3 |

## AC 커버리지 매트릭스

| AC | 분류 | Flow / 대체 |
|----|------|------------|
| 2.1.1 | New+Extend | `free-tab-grid.yaml` |
| 2.1.2 | New | `free-tab-grid.yaml` (시드 토글) |
| 2.1.3 | New | `free-tab-grid.yaml` (시드 토글) |
| 2.1.4 | Extend | `home-tabs.yaml` |
| 2.2.1 | Extend | `swipe-feed.yaml` |
| 2.2.2 | New | `swipe-feed-free-circular.yaml` |
| 2.2.3 | New | `free-gen-confirm.yaml` |
| 2.2.4 | Extend (partial) | `filter-preview.yaml` + Evaluator(crop/generate) |
| 2.2.5 | Covered | `free-gen-confirm.yaml` (취소 버튼) |
| 2.2.6 | Extend | `login-entry-point.yaml` |
| 2.2.7 | Deferred | native-dialog/내부 상태 → Evaluator |
| 2.2.8 | Deferred | native-dialog(앨범/크롭) → Evaluator |
| 2.2.9 | Deferred | server-injection-required(동시생성 상태) → BE 통합 테스트 |
| 2.2.10 | Deferred | time-warp → BE 통합 테스트 |
| 2.2.11 | Deferred | server-injection-required → BE 통합 테스트 + Evaluator |
| 2.3.1/2.3.2 | Extend | `swipe-feed.yaml` |
| 2.4.1 | New | `free-tab-grid.yaml`(탭 왕복 스크롤) |
| 2.5.1~2.5.3 | New | `free-tab-grid.yaml`(시드: freeUsedToday=true) |
| 2.5.4 | Deferred | time-warp → Evaluator |
| 2.6.1~2.6.3 | Extend+New | `swipe-feed.yaml`(유료 CTA), `free-gen-confirm.yaml` |
| 2.6.4 | Deferred | native-dialog 흐름 → Evaluator |
| 2.6.5 | Deferred | multi-device → BE 통합 테스트 |
| 2.7.1~2.7.3 | New | `external-entry-free-parity.yaml` |

## Seed / testID 요구
- testID: `free-tab-banner-purple`, `free-tab-banner-teal`, `free-tab-empty`, `free-tab-reddot`, `swipe-feed-cta-free`, `swipe-feed-cta-paid`, `free-use-confirm-sheet`, `credit-use-confirm-sheet`, `free-tab-card-{index}`.
- Seed 필요 플로우는 `e2e-seed-plan.md` 참조.
