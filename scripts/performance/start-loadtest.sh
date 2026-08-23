#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "==> Starting DIYAR load-test stack (Octane + Swoole + Redis)"
docker compose -f docker-compose.loadtest.yml up --build
