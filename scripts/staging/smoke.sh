#!/usr/bin/env bash
# Post-deploy staging smoke checks. Requires curl + jq.
set -euo pipefail

BASE_URL="${STAGING_API_URL:-http://127.0.0.1:8000/api/v1}"
FRONTEND_URL="${STAGING_FRONTEND_URL:-http://127.0.0.1:3000}"

echo "==> DIYAR staging smoke — API ${BASE_URL}"

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

http_ok() {
  local url="$1"
  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' "$url")"
  [[ "$code" == "200" ]] || fail "${url} returned HTTP ${code}"
}

http_ok "${BASE_URL}/health"
http_ok "${BASE_URL}/readiness"

search_code="$(curl -sS -o /dev/null -w '%{http_code}' "${BASE_URL}/catalog/search?q=chair")"
[[ "$search_code" == "200" ]] || fail "catalog search returned HTTP ${search_code}"

# Admin session must not authenticate without credentials
admin_code="$(curl -sS -o /dev/null -w '%{http_code}' "${BASE_URL}/admin/session")"
[[ "$admin_code" == "401" ]] || fail "admin session without auth expected 401, got ${admin_code}"

# Marketplace maintenance middleware must not block readiness
readiness_has_queue="$(curl -sS "${BASE_URL}/readiness" | jq -e '.data.checks.queue.driver' >/dev/null 2>&1 && echo yes || echo no)"
[[ "$readiness_has_queue" == "yes" ]] || fail "readiness missing queue probe"

if curl -sS -o /dev/null -w '%{http_code}' "${FRONTEND_URL}/" | grep -qE '200|304'; then
  echo "OK: frontend ${FRONTEND_URL}"
else
  echo "WARN: frontend ${FRONTEND_URL} not reachable (skip if API-only smoke)"
fi

echo "PASS: staging smoke checks"
