#!/usr/bin/env bash
set -e

echo "=========================================================="
echo " DIYAR Marketplace — Local MySQL Setup for Pop!_OS"
echo "=========================================================="

DB_NAME="diyar"
DB_USER="diyar"
DB_PASS="diyar_password"

echo "Configuring database '$DB_NAME' and user '$DB_USER'..."

SQL_COMMANDS="
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
CREATE USER IF NOT EXISTS '$DB_USER'@'127.0.0.1' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'localhost';
GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'127.0.0.1';
FLUSH PRIVILEGES;
"

# Check if direct root access works without sudo
if mysql -u root -e "SELECT 1;" >/dev/null 2>&1; then
    echo "$SQL_COMMANDS" | mysql -u root
else
    echo "Using sudo to access MySQL socket..."
    echo "$SQL_COMMANDS" | sudo mysql
fi

echo ""
echo "Testing connection with user '$DB_USER'..."
if mysql -u "$DB_USER" -p"$DB_PASS" -h 127.0.0.1 -e "SELECT 1;" >/dev/null 2>&1; then
    echo "✓ Success: MySQL user '$DB_USER' connected successfully!"
else
    echo "⚠ Connection test failed. Please verify credentials."
    exit 1
fi

echo ""
echo "✓ Database setup completed successfully!"
