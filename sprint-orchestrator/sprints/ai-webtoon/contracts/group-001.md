# Sprint Contract: Group 001 (ai-webtoon)

## Scope

- **Tasks**: be-001 (templates + series/episode schema + series read 기본),
  app-001 (웹툰 탭, 템플릿 상세, MY 웹툰 리스트/빈 상태/N뱃지).
- **Endpoints**:
  - `GET /webtoon/templates`
  - `GET /webtoon/templates/{id}`
  - `GET /webtoon/series`
  - `GET /webtoon/series/{id}?focus=FIRST|LAST_CONTINUE`
  - `POST /webtoon/series/{id}/seen`

## Done Criteria

### be-001
- [ ] 템플릿 레지스트리 정확히 2개 엔트리(PERSON 1, ANIMAL 1). 응답은
  `TemplateListResponse` 스키마와 1:1.
- [ ] 404 on unknown `templateId`.
- [ ] `WebtoonSeries`/`WebtoonEpisode` Mongoose 스키마 + 리포지토리 +
  도메인 서비스 존재.
- [ ] unique index `(seriesId, episodeNumber)` 및 `generationId`. 중복
  insert 시 MongoServerError.
- [ ] `appendEpisode` 5-parallel 동시성 테스트 통과.
- [ ] `markSeriesSeen` idempotent.
- [ ] `GET /webtoon/series` user 격리 + 정렬(desc `lastEpisodeCreatedAt`).
- [ ] `GET /webtoon/series/{id}?focus=LAST_CONTINUE` → `focusEpisodeNumber`
  = max COMPLETED episodeNumber, 없으면 null.
- [ ] `POST /seen` 미소유/존재하지 않음 → 404.

### app-001
- [ ] 홈 진입 시 탭 3개 중 `[추천]` 기본 활성, `[웹툰]` assertVisible.
- [ ] 웹툰 탭 템플릿 카드 2개 렌더. 빈 배열 → `WebtoonEmptyView`.
- [ ] 템플릿 카드 탭 → 상세 화면 heading/preview image/CTA 렌더.
- [ ] `WebtoonFloatingButton` 탭 → `MyWebtoonScreen` 이동.
- [ ] MY 웹툰 빈 상태(생성 이력 0) → `MyWebtoonEmptyView` 렌더.
- [ ] 시리즈 카드 영역 / "이어가기" 버튼 히트박스 분리, 각각
  `focus=FIRST` / `focus=LAST_CONTINUE` navigate.
- [ ] `hasUnseenEpisode=true` 시리즈에만 `NBadge` 렌더.
- [ ] 상세 진입 시 `POST /seen` 호출 + 리스트 재진입 시 뱃지 미노출.
- [ ] 딥링크 `zzem://webtoon`, `zzem://webtoon/my` 직진입 동작.
- [ ] 구앱(feature flag off) → 웹툰 탭 미노출, 회귀 없음.

## Verification Method

- **Template registry**: 유닛 테스트로 `WEBTOON_TEMPLATES.length === 2`,
  characterType set === {PERSON, ANIMAL}.
- **Schema/Index**: 통합 테스트 `Model.collection.indexes()` + 중복 insert
  MongoServerError.
- **Series read**: 통합 테스트(다중 사용자 시드 + cross-user isolation).
- **App rendering**: Maestro `home-tabs.yaml` Extend, `webtoon-tab-browse.yaml`,
  `my-webtoon-empty.yaml`, `my-webtoon-seeded.yaml` 통과.
- **Seen idempotency**: 유닛 테스트 — 2회 호출 결과 동일, emit 1회.

## Edge Cases

- Guest(비인증) 사용자가 `/webtoon/series*` 호출 → 401(또는 기존 규칙).
  구현 시 코드 주석으로 결정 근거 기록.
- 시리즈 소유자 != 현재 유저 → 404 (존재 누설 방지).
- 삭제되지 않은 과거 시리즈 중 episode 0개(스키마상 불가) → 방어 코드.
- feature flag 꺼진 상태에서 딥링크 `zzem://webtoon` 직진입 → 홈 추천 탭
  착지 fallback.

## Sign-off

- be-001 merge → app-001 API mock 대체 가능. contract 안정화 후 app-001
  진행.
- Evaluator: Critical/Major 0건 달성해야 다음 그룹 승인.
- 2026-04-15: Evaluator approved (see group-001-review.md)
