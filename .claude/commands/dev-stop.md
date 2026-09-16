---
description: Stop the local dev stack (backend services, Tauri window, Flutter window, infra containers) before exiting.
---

Run the shutdown script that stops everything `session-start.sh` launched:

!bash .claude/hooks/session-end.sh

Report concisely what stopped (or that it was already stopped). This is a workaround for `/exit` not reliably firing the `SessionEnd` hook — run this command right before you exit or Ctrl+D, or just Ctrl+D directly since that fires `SessionEnd` on its own.
