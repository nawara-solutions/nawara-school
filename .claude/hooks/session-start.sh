#!/usr/bin/env bash
# Launches the full local stack (CLAUDE.md §2/§11) when a Claude Code session
# starts in this repo: infra (Postgres, RabbitMQ) via Docker Compose, the
# Phase 1 TS backend services via `pnpm dev` (turbo), the admin desktop app
# via its own Tauri toolchain, and the mobile app via Flutter. Idempotent —
# safe to run every session start without piling up duplicate processes,
# containers, or windows.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG_DIR="$ROOT/.claude/logs"
mkdir -p "$LOG_DIR"

# Each service listens on its own PORT (see services/*/.env.example) but only
# reads it from services/*/.env, which isn't committed (CLAUDE.md §6.10).
# Bootstrap it from the template on first run so services don't all fall back
# to the same hardcoded default port and collide.
for svc_env_example in "$ROOT"/services/*/.env.example; do
  svc_env="${svc_env_example%.example}"
  [ -f "$svc_env" ] || cp "$svc_env_example" "$svc_env"
done
for app_env_example in "$ROOT"/apps/*/.env.example; do
  app_env="${app_env_example%.example}"
  [ -f "$app_env" ] || cp "$app_env_example" "$app_env"
done

if [ -f "$ROOT/infra/.env" ]; then
  docker compose -f "$ROOT/infra/docker-compose.yml" --env-file "$ROOT/infra/.env" up -d \
    >> "$LOG_DIR/docker-compose.log" 2>&1
else
  echo "$(date -Iseconds) infra/.env missing — skipping docker compose up (see infra/.env.example)" \
    >> "$LOG_DIR/docker-compose.log"
fi

# Backend TS services only — admin-desktop is deliberately excluded here and
# launched below via its own Tauri toolchain instead (CLAUDE.md §11). Tauri's
# beforeDevCommand starts vite itself on devUrl (tauri.conf.json, port 1420);
# also starting it here would double-bind that port.
PID_FILE="$LOG_DIR/dev.pid"
if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  : # already running from a previous session
else
  cd "$ROOT"
  nohup pnpm exec turbo run dev --filter='!@school/admin-desktop' >> "$LOG_DIR/dev.log" 2>&1 &
  echo $! > "$PID_FILE"
  disown
fi

# GUI apps need a display to attach a window to. Skip them (rather than fail)
# when the hook runs headless, e.g. CI.
if [ -n "${DISPLAY:-}" ]; then
  # Admin desktop (Tauri) — opens the native window directly; do not run
  # `vite` separately for this package (see note above).
  TAURI_PID_FILE="$LOG_DIR/tauri.pid"
  if [ -f "$TAURI_PID_FILE" ] && kill -0 "$(cat "$TAURI_PID_FILE")" 2>/dev/null; then
    : # already running from a previous session
  else
    cd "$ROOT/apps/admin-desktop"
    nohup pnpm tauri dev >> "$LOG_DIR/tauri.log" 2>&1 &
    echo $! > "$TAURI_PID_FILE"
    disown
  fi

  # Mobile (Flutter) — targets the Linux desktop device. No Android AVD is
  # configured on this machine (`flutter emulators` finds none); switch the
  # `-d` target to an emulator id once one exists.
  FLUTTER_PID_FILE="$LOG_DIR/flutter.pid"
  if [ -f "$FLUTTER_PID_FILE" ] && kill -0 "$(cat "$FLUTTER_PID_FILE")" 2>/dev/null; then
    : # already running from a previous session
  else
    cd "$ROOT/apps/mobile"
    nohup flutter run -d linux >> "$LOG_DIR/flutter.log" 2>&1 &
    echo $! > "$FLUTTER_PID_FILE"
    disown
  fi
else
  echo "$(date -Iseconds) DISPLAY not set — skipping tauri/flutter window launch" \
    >> "$LOG_DIR/docker-compose.log"
fi
