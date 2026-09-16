#!/usr/bin/env bash
# Stops everything session-start.sh launched: the admin desktop (Tauri) and
# mobile (Flutter) windows, the backend TS services (turbo dev), and the
# infra containers (Postgres, RabbitMQ). Runs on SessionEnd. Best-effort and
# non-blocking — a slow or already-dead process must never hang session exit.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG_DIR="$ROOT/.claude/logs"
mkdir -p "$LOG_DIR"

# turbo/tauri/flutter each fan out into child processes that don't reliably
# forward a plain SIGTERM sent to the recorded top-level pid (observed in
# practice), so shutdown is pattern-based: TERM everything, give it a couple
# of seconds, then KILL whatever is still alive. Patterns are matched against
# each process's own argv, not the invoking shell's — safe to run inline.
terminate_then_kill() {
  local -a patterns=("$@")
  local p
  for p in "${patterns[@]}"; do
    pkill -TERM -f "$p" 2>/dev/null || true
  done
  sleep 2
  for p in "${patterns[@]}"; do
    pkill -KILL -f "$p" 2>/dev/null || true
  done
}

terminate_then_kill \
  "bin/pnpm dev" \
  "turbo run dev" \
  "turbo-linux-64" \
  "nest start --watch" \
  "@nestjs/cli/bin/nest.js" \
  "packages/config/tsconfig/dist/main" \
  "esbuild --service"

terminate_then_kill \
  "target/debug/school-admin-desktop" \
  "admin-desktop/node_modules/.bin/../vite"

terminate_then_kill \
  "build/linux/x64/debug/bundle/school_mobile" \
  "flutter run -d linux"

rm -f "$LOG_DIR/dev.pid" "$LOG_DIR/tauri.pid" "$LOG_DIR/flutter.pid"

# Stop (not remove) the containers — preserves Postgres/RabbitMQ data and
# networks for the next session-start, just halts them.
if [ -f "$ROOT/infra/.env" ]; then
  docker compose -f "$ROOT/infra/docker-compose.yml" --env-file "$ROOT/infra/.env" stop \
    >> "$LOG_DIR/docker-compose.log" 2>&1
fi

echo "$(date -Iseconds) session-end: dev environment stopped" >> "$LOG_DIR/docker-compose.log"
