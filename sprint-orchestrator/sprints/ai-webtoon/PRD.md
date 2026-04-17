# Sprint PRD: ai-webtoon

## Source

- **Notion (canonical):** https://www.notion.so/Agent-PRD-AI-v1-2-3410159c6b5981929ea5d198b3b9b244
- **Local extract:** [`docs/prds/PRD-ai-webtoon-v1.2.md`](../../../docs/prds/PRD-ai-webtoon-v1.2.md) (413 lines, extracted 2026-04-15)
- **Figma:** https://www.figma.com/design/7hozJ6Pvs09q98BxvChj08/Wrtn-X_쨈_Sprint-File?node-id=37289-168285
- **Domain:** ZZEM
- **Version:** v1.2 (last edited 2026-04-14)
- **Status (Notion):** 진행 중

## Scope Summary

사진 1장으로 나만의 AI 웹툰 1화를 생성하고, **자동/직접 이어가기**로 연재 구조를 형성해 크레딧 재소비·재방문을 유도하는 기능.

### 핵심 가설
이어가기 구조를 제공하면 유저가 다음 화 궁금증으로 재방문해 크레딧을 재소비한다.

### 성공 기준 (KPI)
- 웹툰 생성 비중 전체 대비 **10% 이상**
- 리텐션 커브 **플래토 형성**
- **크레딧 재구매 발생** 여부

### Feature Groups (초안 — Phase 2에서 확정)

| US | 제목 | 범위 |
|----|------|------|
| US-1 | 웹툰 탭 템플릿 탐색 | 홈 [추천/웹툰/무료] 탭 + 웹툰 탭 리스트 + 빈 상태 |
| US-2 | 템플릿 상세 미리보기 | 상세 페이지 + 프리뷰 + 만들기 CTA |
| US-3 | 사진 업로드 → 1화 생성 | 입력 화면 + 2단계 생성 (1단계 업로드, 2단계 모델 호출) + 결과 |
| US-4 | 자동 이어가기 | 결과물에서 다음 화 자동 생성 (크레딧 차감) |
| US-5 | 직접 이어가기 | 유저 줄거리 입력으로 다음 화 생성 |

### 생성 모델
- Model: `fal-ai/nano-banana-2/edit` (i2i)
- Input: `image_urls[]` + `prompt` (Jayla 초기 시스템 프롬프트 + 줄거리 + 템플릿 메타)
- Output: 컷이 합성된 단일 웹툰 페이지 이미지 1장

### 주요 제약/에러
- 유해 이미지 감지 → AC 2.3.6
- 콜백 실패 → BR-2 (크레딧 차감 없음)
- 정상 소요 시간 초과 → AC 2.3.8 (timeout)

### 구현 주의
- `FAL_AI_MODEL_INPUT_MAP` 에 `nano-banana-2/edit` 엔트리 추가 필요
- 참조 이미지는 `image_urls[]`에 포함 (BR-12 / §5 ASK 참조)

## References

- Acceptance Criteria, Business Rules, 용어, 리스크 등 상세는 원본 PRD 링크 참조.
- Figma 프레임 node-id=37289-168285 (Wrtn-X_쨈_Sprint-File)

## Sprint Artifacts

| 파일 | 생성 시점 |
|------|----------|
| sprint-config.yaml | Phase 1 |
| tasks/{app,backend}/*.md | Phase 2 |
| contracts/api-contract.yaml | Phase 2 |
| prototypes/app/*/ | Phase 3 |
| evaluations/group-*.md | Phase 4 |
| retrospective/ | Phase 6 |
