# Sprint Orchestrator Evals

DE / sprint pipeline 변경 회귀 테스트 하니스.

## 비용 경고

- 1회 eval = N개 frozen input × 1 DE 풀 실행 (Pass 1-6 + Asset + Preview)
- 토큰 소비 ≈ 30k-80k per input (Opus). 4개 input = 120k-320k tokens
- CI 자동 실행은 변경 감지 시 1일 최대 3회로 제한 (de-eval.yml 의 cooldown)
- 로컬 실행은 `pnpm de-eval --inputs=<id>` 로 단일 input 만 (개발 중 빠른 피드백)

## 실행

```bash
# 전체 suite
pnpm de-eval

# 단일 input
pnpm de-eval --inputs=ugc-001-home

# baseline 갱신 (사용자 승인 후)
pnpm de-eval:snapshot --inputs=ugc-001-home
```

## 통과 기준

- regression_score (가중 평균) ≥ 0.85 → PASS
- 임계값 미만 → FAIL + 회귀 항목 nudge

## Frozen Inputs 룰

- inputs/ 하위는 절대 변경 금지 (변경 시 baseline 도 같이 변경되므로 회귀 의미 상실)
- 신규 input 추가는 별 PR
- 기존 input 폐기는 별 PR + 사유 명시
