# sprint-orchestrator/

스프린트 인스턴스, 템플릿, 평가 하네스의 컨테이너 디렉토리.

| 디렉토리 | 용도 |
|---------|------|
| `sprints/{sprint-id}/` | 스프린트 인스턴스 (PRD/contracts/evaluations/prototypes/checkpoints/retrospective/REPORT) |
| `templates/` | PRD/Sprint Contract/Screen Spec/QA-Fix 등 작성 템플릿 |
| `evals/` | Design Engineer eval 하네스 (`design-engineer-suite.yaml` 등) |
| `dogfood/` | 파이프라인 개선 시 사용한 dogfood 산출물 (`v2-exercise/` 등) |

스프린트 오케스트레이션 스킬 본체와 실행 프로토콜은 `.claude/skills/sprint/SKILL.md` 에 있다 (`/sprint <sprint-id>` 로 진입).

루트의 `README.md`, `ARCHITECTURE.md`, `MANUAL.md` 도 함께 참조.
