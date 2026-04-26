# APP-006 — i2v Transition (Proceed → MemeCollection)

## Target
- `apps/MemeApp/src/presentation/meme/preview-result.screen.tsx` (CTA handler — APP-004와 협업)
- 기존 `useActiveGenerationsPollingUseCase` (재사용)
- navigation: MemeCollection screen.

## Context
PreviewResultScreen에서 [이 이미지로 만들기] 탭 시 i2v를 시작하고 MemeCollection으로
이동. fire-and-forget — 응답 직후 즉시 navigate.

## Objective
- `POST /preview-contents/:contentId/proceed` 호출 → 응답 직후 MemeCollection으로
  navigate.replace.
- i2v Content가 active-generations 폴링에 들어와 "생성중..." → 결과 thumbnail로 자연
  전환 (기존 폴링 경로 그대로).

## Specification

### Flow
1. CTA 탭 → in-flight 표시 (CTA disabled).
2. `POST /preview-contents/{contentId}/proceed`.
3. 응답:
   - 200 → navigate.replace to MemeCollection (route 또는 home tab + collection 탭).
   - 402 → 기존 크레딧 부족 sheet (i2v 잔액 부족 상정).
   - 409 → 토스트 "이미 진행된 미리보기예요" + FilterPreview 복귀 (edge — 동일 contentId 재호출).
   - 429 → 기존 429 패턴.

### Polling
- 변경 없음. MemeCollection의 기존 active-generations 폴링이 i2v Content를 자동 표기.

### TestID
```
meme.previewResult.proceedCta  # APP-004와 동일
```

## Acceptance Criteria — maps to AC 2.2.1, 2.2.2
- [ ] (AC 2.2.1) [이 이미지로 만들기] 탭 → proceed API 호출 + MemeCollection으로 즉시 이동.
- [ ] (AC 2.2.2) MemeCollection에 i2v Content가 "생성중..." 상태로 노출되고 완료 시 결과 thumbnail로 전환.
- [ ] 402/409/429 응답 시 사용자 안내 + 안전 복귀 (기존 패턴 재사용).
