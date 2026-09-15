#!/usr/bin/env bash
set -e

# Add ~/.local/bin to PATH for composer
export PATH="$HOME/.local/bin:$PATH"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_DIR="$REPO_ROOT/backend"
FRONTEND_DIR="$REPO_ROOT/frontend"

echo "=========================================================="
echo " DIYAR Marketplace — Local Dev Server (Pop!_OS / ThinkPad)"
echo "=========================================================="
echo "Backend:  http://127.0.0.1:8000"
echo "Frontend: http://localhost:3000"
echo "=========================================================="

# 1. Check MariaDB (user-space instance on port 3307)
MARIADB_DIR="$HOME/.local/share/diyar-mariadb"
if ! ss -tulpn 2>/dev/null | grep -q ":3307 "; then
    echo "Starting local MariaDB on port 3307..."
    /usr/sbin/mariadbd \
        --datadir="$MARIADB_DIR" \
        --port=3307 \
        --socket="$MARIADB_DIR/mysql.sock" \
        --pid-file="$MARIADB_DIR/mysql.pid" &
    sleep 1
fi

# 2. Check Redis
if redis-cli ping >/dev/null 2>&1; then
    echo "✓ Redis is active"
else
    echo "⚠ Redis is not running. Starting redis-server..."
    systemctl --user start redis-server 2>/dev/null || sudo systemctl start redis-server 2>/dev/null || true
fi

# 2. Check Backend .env
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo "⚠ $BACKEND_DIR/.env missing! Copying from .env.example..."
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
    php "$BACKEND_DIR/artisan" key:generate
fi

# 3. Check Frontend .env.local
if [ ! -f "$FRONTEND_DIR/.env.local" ]; then
    echo "⚠ $FRONTEND_DIR/.env.local missing! Creating default..."
    cat > "$FRONTEND_DIR/.env.local" << 'ENVEOF'
DIYAR_API_PROXY_TARGET=http://127.0.0.1:8000
VITE_API_URL=/api/v1
VITE_BACKEND_URL=http://localhost:8000
VITE_APP_NAME=DIYAR
ENVEOF
fi

# Trap SIGINT/SIGTERM to kill all background background processes cleanly
cleanup() {
    echo ""
    echo "Shutting down dev servers..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 4. Start Laravel Backend Server
echo "Starting Laravel backend on http://127.0.0.1:8000..."
cd "$BACKEND_DIR"
php artisan serve --host=127.0.0.1 --port=8000 &
BACKEND_PID=$!

# 5. Start Vite Frontend Server
echo "Starting Vite frontend on http://localhost:3000..."
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Both servers are running! Press Ctrl+C to stop."
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
