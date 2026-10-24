#!/usr/bin/env bash
# サーバー上で更新: cd /var/www/seoulmono && git pull && bash deploy/update.sh
set -euo pipefail
cd "$(dirname "$0")/.."
pnpm install --frozen-lockfile
pnpm --filter @workspace/shop run build
pnpm --filter @workspace/order-system run build
pnpm --filter @workspace/api-server run build
pm2 reload seoulmono-api
