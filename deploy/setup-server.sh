#!/usr/bin/env bash
# Ubuntu/Debian: CERTBOT_EMAIL=you@example.com bash deploy/setup-server.sh
set -euo pipefail
DOMAIN=seoulmono.com
EMAIL="${CERTBOT_EMAIL:?CERTBOT_EMAIL is required}"
APP_DIR=/var/www/seoulmono
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
export DEBIAN_FRONTEND=noninteractive CI=true
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx curl git rsync build-essential mariadb-server
if ! command -v node >/dev/null || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 24 ]; then
  curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
  apt-get install -y nodejs
fi
npm install -g pnpm@10.34.8 pm2
mkdir -p "$APP_DIR"
if [ "$REPO_DIR" != "$APP_DIR" ]; then
  rsync -a --exclude node_modules --exclude .git --exclude '.env*' --exclude uploads "$REPO_DIR/" "$APP_DIR/"
fi
cd "$APP_DIR"
if [ ! -f .env ]; then
  umask 077
  cp deploy/env.example .env
  DBPASS="$(openssl rand -hex 24)"
  JWT="$(openssl rand -hex 32)"
  sed -i "s/^MYSQL_PASSWORD=.*/MYSQL_PASSWORD=$DBPASS/; s/^JWT_SECRET=.*/JWT_SECRET=$JWT/" .env
  mysql -e "CREATE DATABASE IF NOT EXISTS seoulmono CHARACTER SET utf8mb4;
    CREATE USER IF NOT EXISTS 'seoulmono'@'127.0.0.1' IDENTIFIED BY '$DBPASS';
    GRANT ALL ON seoulmono.* TO 'seoulmono'@'127.0.0.1';"
fi
chmod 600 .env
# Only missing tables are created; existing records are preserved.
mysql seoulmono < deploy/schema.sql
pnpm install --frozen-lockfile
pnpm --filter @workspace/shop run build
pnpm --filter @workspace/order-system run build
pnpm --filter @workspace/api-server run build
pm2 startOrReload deploy/ecosystem.config.cjs --update-env
pm2 save
pm2 startup systemd -u root --hp /root
# Keep existing HTTPS configuration on subsequent deployments.
if [ ! -f /etc/nginx/sites-available/seoulmono ]; then
  cp deploy/nginx.conf /etc/nginx/sites-available/seoulmono
fi
ln -sf /etc/nginx/sites-available/seoulmono /etc/nginx/sites-enabled/seoulmono
nginx -t
systemctl reload nginx
if command -v ufw >/dev/null && ufw status | grep -q 'Status: active'; then
  ufw allow 'Nginx Full'
fi
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect
systemctl enable --now certbot.timer
curl --retry 10 --retry-connrefused --retry-delay 1 --max-time 5 --fail --silent --show-error "https://$DOMAIN/api/healthz"
printf '\nReady: https://%s\n' "$DOMAIN"
