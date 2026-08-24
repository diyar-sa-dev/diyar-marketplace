#!/usr/bin/env bash
# Post-deploy production smoke checks. Requires curl + jq.
set -euo pipefail

API_BASE="${PRODUCTION_API_URL:-https://diyar-k255.onrender.com/api/v1}"
FRONTEND_URL="${PRODUCTION_FRONTEND_URL:-https://diyar-psi.vercel.app}"
SPA_ORIGIN="${PRODUCTION_SPA_ORIGIN:-https://diyar-psi.vercel.app}"

echo "==> DIYAR production smoke"
echo "    API: ${API_BASE}"
echo "    Frontend: ${FRONTEND_URL}"

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

http_ok() {
  local url="$1"
  local extra_headers=("${@:2}")
  local code
  if ((${#extra_headers[@]} > 0)); then
    code="$(curl -sS -o /dev/null -w '%{http_code}' "${extra_headers[@]}" "$url")"
  else
    code="$(curl -sS -o /dev/null -w '%{http_code}' "$url")"
  fi
  [[ "$code" == "200" ]] || fail "${url} returned HTTP ${code}"
}

http_ok "${API_BASE}/health"
http_ok "${API_BASE}/readiness"

# Stateful SPA origin must not 500 (Sanctum session bootstrap)
http_ok "${API_BASE}/health" -H "Origin: ${SPA_ORIGIN}" -H "Accept: application/json"
http_ok "${API_BASE}/csrf-token" -H "Origin: ${SPA_ORIGIN}" -H "Accept: application/json"

csrf_token="$(curl -sS -H "Origin: ${SPA_ORIGIN}" -H "Accept: application/json" "${API_BASE}/csrf-token" | jq -er '.data.token')"
[[ -n "$csrf_token" ]] || fail "csrf-token missing data.token"

http_ok "${API_BASE}/platform/theme" -H "Origin: ${SPA_ORIGIN}" -H "Accept: application/json"

search_code="$(curl -sS -o /dev/null -w '%{http_code}' "${API_BASE}/catalog/search?q=chair")"
[[ "$search_code" == "200" ]] || fail "catalog search returned HTTP ${search_code}"

admin_code="$(curl -sS -o /dev/null -w '%{http_code}' "${API_BASE}/admin/session")"
[[ "$admin_code" == "401" ]] || fail "admin session without auth expected 401, got ${admin_code}"

if curl -sS -o /dev/null -w '%{http_code}' "${FRONTEND_URL}/" | grep -qE '200|304'; then
  echo "OK: frontend ${FRONTEND_URL}"
else
  fail "frontend ${FRONTEND_URL} not reachable"
fi

echo "PASS: production smoke checks"
