#!/bin/sh
set -e

COOKIE=/tmp/diyar-probe-cookies.txt
BASE="${1:-http://nginx}"

curl -s -c "$COOKIE" -b "$COOKIE" "$BASE/sanctum/csrf-cookie" >/dev/null

XSRF=$(grep XSRF-TOKEN "$COOKIE" | awk '{print $7}' | sed 's/%/\\x/g' | xargs -0 printf 2>/dev/null || true)
if [ -z "$XSRF" ]; then
  XSRF=$(php -r 'parse_str(str_replace("\t", "&", file_get_contents("php://stdin")), $c); echo urldecode($c["XSRF-TOKEN"] ?? "");' < "$COOKIE")
fi

echo "login:"
curl -s -w "\nHTTP:%{http_code}\n" -c "$COOKIE" -b "$COOKIE" \
  -X POST "$BASE/api/v1/auth/login" \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -H "X-XSRF-TOKEN: $XSRF" \
  -d '{"identifier":"customer@diyar.local","password":"Password123!","method":"email"}'

PNG=/tmp/diyar-probe-avatar.png
php -r 'file_put_contents(getenv("PNG") ?: "/tmp/diyar-probe-avatar.png", base64_decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="));'

echo "upload:"
curl -s -w "\nHTTP:%{http_code}\n" -c "$COOKIE" -b "$COOKIE" \
  -X POST "$BASE/api/v1/profile/avatar" \
  -H 'Accept: application/json' \
  -H "X-XSRF-TOKEN: $XSRF" \
  -F 'avatar=@/tmp/diyar-probe-avatar.png;type=image/png;filename=avatar.png'
