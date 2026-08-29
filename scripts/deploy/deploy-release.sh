#!/usr/bin/env bash
# DIYAR production release script (Phase 28.14)
# Safe deploy flow — NEVER runs migrate:fresh or db:wipe.
#
# Usage (on VPS as deploy user):
#   APP_ROOT=/var/www/diyar RELEASES_DIR=/var/www/diyar/releases ./scripts/deploy/deploy-release.sh
#
# Prerequisites: previous release kept for rollback; Nginx points to current symlink.

set -euo pipefail

APP_ROOT="${APP_ROOT:-/var/www/diyar}"
RELEASES_DIR="${RELEASES_DIR:-${APP_ROOT}/releases}"
SHARED_DIR="${SHARED_DIR:-${APP_ROOT}/shared}"
TIMESTAMP="$(date +%Y%m%d%H%M%S)"
RELEASE_PATH="${RELEASES_DIR}/${TIMESTAMP}"
KEEP_RELEASES="${KEEP_RELEASES:-3}"

echo "==> DIYAR deploy release ${TIMESTAMP}"

mkdir -p "${RELEASES_DIR}" "${SHARED_DIR}/storage" "${SHARED_DIR}/.env"

# 1. Copy artifact (expects CI/rsync already populated RELEASE_PATH or git clone here)
if [[ ! -d "${RELEASE_PATH}" ]]; then
  echo "Release path ${RELEASE_PATH} must exist (rsync/git artifact)."
  exit 1
fi

cd "${RELEASE_PATH}/backend"

# 2. Link shared env + storage
ln -sfn "${SHARED_DIR}/.env" .env
ln -sfn "${SHARED_DIR}/storage" storage

# 3. Validate environment BEFORE activation
php artisan diyar:validate-environment
php artisan diyar:validate-php-runtime

# 4. Dependencies (production)
composer install --no-dev --optimize-autoloader --no-interaction

# 5. Migrations (forward only)
php artisan migrate --force --no-interaction

# 6. Cache warming
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 7. Frontend build (if built on server)
if [[ -d "../frontend" ]]; then
  cd "../frontend"
  npm ci
  npm run build
  cd "../backend"
fi

# 8. Activate release symlink
ln -sfn "${RELEASE_PATH}" "${APP_ROOT}/current"

# 9. Reload services
sudo systemctl reload php8.2-fpm || sudo service php8.2-fpm reload
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl restart diyar-queue-critical diyar-queue-high diyar-queue-broadcast diyar-queue-chat || true
sudo nginx -t && sudo systemctl reload nginx

# 10. Health smoke
BASE_URL="${DEPLOY_API_URL:-https://api.diyar.com/api/v1}"
curl -fsS "${BASE_URL}/health/live" >/dev/null
curl -fsS "${BASE_URL}/health/ready" >/dev/null

# 11. Prune old releases (keep previous for lazy-chunk compatibility)
ls -1dt "${RELEASES_DIR}"/* 2>/dev/null | tail -n +$((KEEP_RELEASES + 1)) | xargs -r rm -rf

echo "==> Deploy complete: ${RELEASE_PATH}"
echo "Rollback: ln -sfn ${RELEASES_DIR}/<previous> ${APP_ROOT}/current && reload fpm/nginx/workers"
