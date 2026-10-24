#!/usr/bin/env bash
# サーバー (Ubuntu/Debian, root) で実行: bash deploy/setup-server.sh
# 初回セットアップ + ビルド + nginx + SSL (Let's Encrypt)
set -euo pipefail

DOMAIN="seoulmono.com"
EMAIL="${CERTBOT_EMAIL:?CERTBOT_EMAIL を指定してください (例: CERTBOT_EMAIL=you@example.com)}"
APP_DIR="/var/www/seoulmono"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y nginx certbot python3-certbot-nginx curl git rsync build-essential mariadb-server ufw

# Node 24 + pnpm + pm2
if ! command -v node >/dev/null || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 24 ]; then
  curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
  apt-get install -y nodejs
fi
npm i -g pnpm pm2

# アプリ配置
mkdir -p "$APP_DIR"
[ "$REPO_DIR" = "$APP_DIR" ] || rsync -a --delete --exclude node_modules --exclude .git --exclude .env "$REPO_DIR/" "$APP_DIR/"
cd "$APP_DIR"

# .env (初回のみ生成。DB パスワード/JWT は自動生成)
if [ ! -f .env ]; then
  cp deploy/env.example .env
  DBPASS="$(openssl rand -hex 16)"; JWT="$(openssl rand -hex 32)"
  sed -i "s/^MYSQL_PASSWORD=.*/MYSQL_PASSWORD=$DBPASS/; s/^JWT_SECRET=.*/JWT_SECRET=$JWT/" .env
  mysql -e "CREATE DATABASE IF NOT EXISTS seoulmono CHARACTER SET utf8mb4;
            CREATE USER IF NOT EXISTS 'seoulmono'@'127.0.0.1' IDENTIFIED BY '$DBPASS';
            GRANT ALL ON seoulmono.* TO 'seoulmono'@'127.0.0.1'; FLUSH PRIVILEGES;"
  chmod 600 .env
  echo ">>> .env を生成しました。SMTP/Stripe 等を編集してください: $APP_DIR/.env"
fi

# ビルド
pnpm install --frozen-lockfile
pnpm --filter @workspace/shop run build
pnpm --filter @workspace/order-system run build
pnpm --filter @workspace/api-server run build

# PM2
pm2 startOrReload deploy/ecosystem.config.cjs
pm2 save
pm2 startup systemd -u root --hp /root >/dev/null || true

# nginx
cp deploy/nginx.conf /etc/nginx/sites-available/seoulmono
ln -sf /etc/nginx/sites-available/seoulmono /etc/nginx/sites-enabled/seoulmono
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ファイアウォール
ufw allow OpenSSH >/dev/null; ufw allow 'Nginx Full' >/dev/null; ufw --force enable >/dev/null

# SSL (DNS が このサーバーを向いていること)
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect
systemctl list-timers | grep -q certbot && echo "certbot 自動更新: 有効"

echo "完了: https://$DOMAIN"
