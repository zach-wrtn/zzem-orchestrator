# PRD ↔ Figma 불일치 해결 로그 (ai-webtoon)

> Phase 3 프로토타입 리뷰 과정에서 식별한 PRD/Task 스펙과 Figma 디자인 간 불일치.
> 3가지 옵션(PRD 우선 / Figma 우선 / dev-pattern) 중 택일한 결과를 기록.
> 이후 Phase 4 Build에서 이 결정을 준수한다.

## 결정 요약

| # | 항목 | PRD | Figma | 해결 방식 |
|---|------|-----|-------|----------|
| 1 | 로딩 단계 분리 | 1단계(업로드) + 2단계(AI) UI 분리 | 단일 프레임 `웹툰_결과물_로딩` | **Figma 우선** → 단일 로딩 UI |
| 2 | 시리즈 상세 네이밍 | `SeriesDetailScreen` | `웹툰_결과물_완료_스크롤` | **PRD 우선** → 엔지니어링 네이밍 유지 |
| 3 | 웹툰 탭 빈 상태 UI | 필요 (AC 2.1.3) | 프레임 없음 | **dev-pattern** → component-patterns 기반 |
| 4 | 서버 에러 UI | 필요 (AC 2.3.7) | 섹션 label만, 프레임 없음 | **dev-pattern** → 기존 Toast 재사용 |
| 5 | Timeout UI | 필요 (AC 2.3.8) | 섹션 label만, 프레임 없음 | **dev-pattern** → 공통_바텀시트 패턴 |
| 6 | 동시성 제한 UI | 필요 (BR-3) | 프레임 없음 | **dev-pattern** → 공통_바텀시트 패턴 |
| 7 | `InlineEpisodeError` 회차별 실패 | 필요 (AC 2.4.1 분기) | full-screen만 (`웹툰_결과물_실패`) | **dev-pattern** → 공통 에러 블록 인라인 |
| 8 | `NO_REFERENCE_EPISODE` 시트 | 필요 (contracts error) | 프레임 없음 | **dev-pattern** → 공통_바텀시트 패턴 |

## 상세

### #1. 로딩 1단계/2단계 UI 분리 제거 (Figma 우선)

- **PRD 원문**: US-3 "2단계 생성 (1단계 업로드, 2단계 모델 호출)"
- **해석 보정**: "2단계"는 BE 파이프라인의 처리 단계를 지칭하는 것이지, UI 2화면 분리가 아니다. Figma의 `웹툰_결과물_로딩` 단일 프레임이 canonical.
- **영향**:
  - `tasks/app/002-*.md`: `WebtoonGeneratingScreen` 내부 2단계 기술 제거 (이미 단일 컴포넌트로 기술되어 있음, 변경 불요)
  - `prototypes/app/app-002/prototype.html`: Stage 1 업로드 프레임 제거, Stage 2 스켈레톤만 유지하고 "WebtoonGeneratingScreen"으로 단일화
  - `prototypes/app/app-002/screen-spec.md`: 2단계 구조 관련 서술 보정
  - BE 내부 파이프라인(be-002)은 변경 없음 — 업로드 → fal-ai submit → polling 단계 유지하되 UI 상태는 단일 "생성 중"으로 표현.

### #2. SeriesDetailScreen 네이밍 유지 (PRD 우선)

- Figma의 `웹툰_결과물_완료_스크롤`은 기능적으로 PRD의 `SeriesDetailScreen`과 동일 (화수 Chip 탭 + 세로 webtoon + 이어가기 CTA).
- 엔지니어링 네이밍은 `SeriesDetailScreen`로 유지. Figma 네이밍은 디자인 파일 내부 레퍼런스일 뿐.
- 변경 없음.

### #3~#8. Figma 미제공 UI 6종 → dev-pattern 커버

- 모두 에러/빈 상태/시스템 계열로 Jayla의 시각 디자인 없이 표준 component-patterns로 구현 가능한 UI.
- design-engineer가 이미 `prototypes/app/app-002` + `app-003`에서 다음을 구현 완료:
  - `ServerErrorToast` (기존 Toast 시스템 호출)
  - `TimeoutSheet`, `ConcurrencyLimitSheet`, `NoReferenceEpisodeSheet` (공통_바텀시트 스타일 참조)
  - `WebtoonEmptyView` (빈 상태 패턴)
  - `InlineEpisodeError` (공통 에러 블록을 시리즈 상세 내부에 인라인 배치)
- 향후 Jayla가 해당 UI를 그리면 디자인 토큰/컴포넌트 교체만 하면 되는 구조.
- Phase 4에서 이 6종의 디자인 토큰/간격/색상은 기존 공통 컴포넌트 토큰을 따른다.

## 다음 단계

1. ✅ `figma-mapping.yaml` resolution 필드 기록 완료
2. ⏳ `prototypes/app/app-002/prototype.html` 로딩 단계 통합
3. ⏳ `prototypes/app/app-002/screen-spec.md` 서술 보정
4. ⏳ Phase 4 Build 시 이 로그를 엔지니어/평가자에게 Frozen Snapshot으로 전달
