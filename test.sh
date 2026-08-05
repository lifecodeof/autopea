#!/usr/bin/env bash
set -euo pipefail

IMAGE=autopea-test
PROJECT_DIR="$(dirname "$0")"

if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
  echo "Building $IMAGE ..."
  docker buildx build -t "$IMAGE" .
fi

exec docker run --rm -it \
  -e PW_SHOW="${PW_SHOW:-}" \
  -v "$PROJECT_DIR:/app" \
  -v /app/node_modules \
  -v /app/packages/autopea/node_modules \
  -v /app/packages/autopea-playwright/node_modules \
  -v /app/packages/tests/node_modules \
  -v /app/packages/examples/node_modules \
  -w /app/packages/tests \
  "$IMAGE" \
  pnpm exec vitest --config vitest.watch.config.ts --watch "$@"
