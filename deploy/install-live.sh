#!/usr/bin/env bash
# The Git live snapshots are the production source; rebuilding artifacts/shop alone is incorrect.
set -euo pipefail
cd "$(dirname "$0")/.."
CI=true pnpm install --frozen-lockfile
# Generate runtime worker files/dependencies, then install the authoritative live API snapshot.
pnpm --filter @workspace/api-server run build
cp artifacts/api-server-live/index.mjs artifacts/api-server/dist/index.mjs
mkdir -p artifacts/shop/dist/public
rsync -a artifacts/shop-live/ artifacts/shop/dist/public/
(cd artifacts/seoulmono-admin && CI=true pnpm install --frozen-lockfile && pnpm build)
