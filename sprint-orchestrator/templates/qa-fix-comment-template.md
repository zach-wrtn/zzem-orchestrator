<!--
QA-Fix Jira Comment — Local SSOT
Stage 5 step 2 — Sprint Lead writes this BEFORE posting to Jira.
The same content is posted via mcp__wrtn-mcp__jira_add_comment.
On successful post + transition, .posted marker file is created alongside this file.
Path: sprints/<sprint-id>/qa-fix/jira-comments/<TICKET-ID>.md
-->

## ✅ Fix Ready for QA — <SPRINT-ID> / group-<N>

**Root Cause**
<한 단락. 왜 이 버그가 발생했는지. "Unknown" 금지. 패턴 위반/누락이 있다면 명시.>

**Fix Summary**
<한 단락. 무엇을 어떻게 바꿨는지. 사용자 관점 변화. 코드 diff 그대로 붙여넣기 금지.>

**Verification Steps**
1. <원본 Steps to Reproduce 1단계 + fix 후 기대 결과>
2. <원본 2단계 + 기대 결과>
3. ...

**Evidence**
- PR: <BE PR url> / <FE PR url>  ← 항상 필수
- Changed files: <핵심 파일 N개 — 절대 경로 또는 PR diff 링크>
- Regression test: <Maestro flow file path>      ← 회귀 추가 가능한 경우
- Screenshot: <before/after URL or attachment ref>  ← UI/copy 케이스
- N/A — <회귀 자동화가 비현실적인 사유>          ← evidence 생략 시 사유 필수

**Related**
- Sprint: <sprint-id>
- Group: <group-id> (함께 fix된 다른 티켓: <TICKET-IDs>)
- KB Pattern Candidate: <yes — kb-candidates/<TICKET-ID>.yaml | no>

<!--
PARTIAL EVIDENCE: 모든 evidence 충족 못 한 경우, 위의 ## 라인에 ⚠️ 마커를 머리에 추가:
## ⚠️ Fix Ready for QA — <SPRINT-ID> / group-<N>
-->
