#!/usr/bin/env bash
# サーバー上で更新: cd /var/www/seoulmono && git pull && bash deploy/update.sh
set -euo pipefail
cd "$(dirname "$0")/.."
CI=true pnpm install --frozen-lockfile
pnpm --filter @workspace/shop run build
pnpm --filter @workspace/order-system run build
pnpm --filter @workspace/api-server run build
pm2 startOrReload deploy/ecosystem.config.cjs --update-env
curl --retry 10 --retry-connrefused --retry-delay 1 --max-time 5 --fail --silent --show-error http://127.0.0.1:8080/api/healthz
