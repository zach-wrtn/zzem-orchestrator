# Screenshots — app-020 (NotificationCenterScreen)

Capture commands (Phase 4 사용자 또는 capture-screenshots.ts 가 자동 생성):

```bash
# default
pnpm --dir sprint-gallery tsx scripts/capture-screenshots.ts \
  --html sprint-orchestrator/sprints/ugc-platform-integration-qa-2/prototypes/app/app-020/prototype.html \
  --out  sprint-orchestrator/sprints/ugc-platform-integration-qa-2/prototypes/app/app-020/screenshots \
  --states default,loading,empty,error
```

Expected output:
- NotificationCenterScreen-default.png
- NotificationCenterScreen-loading.png
- NotificationCenterScreen-empty.png
- NotificationCenterScreen-error.png
- ../prototype.png (representative — copy of default)

Sandbox 환경에서 자동 캡처 불가 시 사용자 또는 Sprint Lead가 별도로 실행.
