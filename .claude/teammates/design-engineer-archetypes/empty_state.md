# Empty State Persona

## 정체성

콘텐츠가 0건임을 사용자에게 안내하고 다음 행동을 제시하는 화면 또는 화면 영역 (빈 피드, 검색결과 없음, 첫 사용자 화면). 사용자는 "기대했는데 비어있다" 상태 — 감정적 좌절을 최소화하고 행동 유도가 결정적. 핵심 신호: 시각 앵커(illustration 또는 icon) + 짧은 안내 + 1 primary CTA. 예: 빈 알림 탭, 검색결과 없음, 첫 게시물 만들기 유도.

## 강제 룰 (모두 충족 — 미충족 시 STOP)

| # | 룰 | 검증 방법 |
|---|----|---------|
| 1 | Illustration / icon 80px 이상, 화면 또는 영역 중앙에 배치 — 시각 앵커 없는 텍스트만 화면 금지 | 시각 검토 또는 `grep -E "empty.*icon\|illustration" screen-spec.yaml` |
| 2 | Headline 1 문장 + body 1-2 문장 (총 3 문장 이내) — 장문 안내 금지 | 텍스트 라인 카운트 ≤ 3 |
| 3 | Primary CTA 1개 — 다음 단계 명확 (예: "첫 X 만들기", "다른 검색어로 검색"). 0개 또는 2개 이상 금지 | 버튼 분류: primary 1 |
| 4 | 부정 어조 회피 (권장 강제) — "아무것도 없습니다" / "검색 실패" 같은 negative framing 은 행동 유도형으로 변환. **단, PRD/Figma 카피가 명시되어 있으면 그 카피를 우선** (PRD `### NEVER DO`: UI copy 변경 금지). 충돌 시 §3.2.5 표준 gate question 으로 Sprint Lead 결정. | DE 가 제안 카피를 quality-report 에 기록 — Sprint Lead/사용자가 PRD 카피 vs DE 카피 중 선택 |

## 권장 룰 (트레이드오프 — 거절 시 로그)

| # | 룰 | 거절 시 영향 |
|---|----|---------|
| 1 | Illustration 의 색감은 DESIGN.md 의 보조 컬러 (브랜드 보라 그라디언트 금지 — Pass 6 #5 참조) | Pass 6 #5 와 충돌 위험 |
| 2 | 컨텍스트별 다른 메시지 — 검색 0건 vs 알림 0건 vs 첫 사용 vs 친구 0명 각기 다른 카피 | 일관 카피로 사용자에게 "막연함" 인상 |
| 3 | Secondary action (text link) 1개 가능 — 예: "도움말 보기" / "다시 시도" | 사용자가 막다른 길에 갇힌 느낌 |

## Good Pattern Examples

- **검색 결과 없음**: 돋보기-X 아이콘 100px → "찾으시는 결과가 없어요" → "다른 검색어로 시도해보세요" → "다시 검색" primary + "도움말" text link.
- **빈 알림 탭**: bell-zZz 일러스트 120px → "조용한 하루네요" → "친구를 팔로우하면 새로운 활동을 받아볼 수 있어요" → "친구 찾기" primary.
- **첫 게시물 유도**: 카메라++ 일러스트 160px → "첫 작품을 공유해보세요" → "어떤 순간이든 의미가 됩니다" → "만들기" primary (큰 fab style).

## PRD Copy 와의 충돌

PRD/Figma 가 부정형 카피 ("아직 X 가 없어요", "검색 실패") 를 명시하고 PRD `### NEVER DO` 에 "UI copy 변경 금지" 가 있을 때:

**우선순위**:

1. **PRD 카피 우선** — DE 는 PRD 카피를 그대로 사용
2. DE 는 동시에 quality-report.yaml 에 다음을 기록:
   ```yaml
   prd_copy_conflict:
     screen: "{ScreenName}"
     prd_copy: "{원문}"
     persona_recommended_copy: "{DE 제안 — empty_state #4 적용 시}"
     resolution: "prd_preserved"  # 또는 persona_applied (Sprint Lead 결정 후)
   ```
3. Sprint Lead 가 §3.2.5 에서 사용자에게 표준 gate question 발사 — 사용자 결정으로 `resolution` 갱신

**예외 (DE 자가 결정 가능)**:

- PRD 카피가 명백한 오타 / 문법 오류 — 수정 후 quality-report 에 `prd_copy_conflict.resolution: typo_fix` 기록
- 그 외 모든 의미적 변경은 Sprint Lead 결정 필요

## Anti-Patterns

- **시각 앵커 없는 plain 텍스트**: 화면 중앙에 "결과 없음" 텍스트만 — 사용자에게 "버그?" 인상.
- **장문 paragraph 설명**: "현재 데이터베이스에서 일치하는 항목을 찾을 수 없습니다. 다음을 시도해보세요: 1) ..." — 모바일에 부적합.
- **CTA 0개**: 사용자에게 다음 행동 가이드 결여 — dead-end.
- **부정 어조**: "검색 실패", "데이터 없음" — 사용자 자존감 저해, 앱 첫 인상 손상.
- **CTA 2개 동급**: "다시 시도" + "취소" 두 버튼 동일 강조 — 결정 마비.
