#!/usr/bin/env bash
# ============================================================
#  ソウルモノ 배포 스크립트 (Replit → 115.68.208.65)
#  사용법: bash scripts/deploy.sh
# ============================================================
set -e

SERVER="root@115.68.208.65"
SERVER_BASE="/var/www/seoulmono"
SSH_KEY="$HOME/.ssh/seoulmono_deploy"
SSH_OPTS="-o StrictHostKeyChecking=no -i $SSH_KEY"

echo "=============================="
echo "  ソウルモノ 배포 스크립트"
echo "=============================="

echo ""
echo "[1/4] 빌드 중..."
pnpm --filter @workspace/shop run build
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/order-system run build

echo ""
echo "[2/4] 압축 중..."
(cd artifacts/shop         && tar czf /tmp/shop-dist.tar.gz        dist/public/)
(cd artifacts/api-server   && tar czf /tmp/api-dist.tar.gz         dist/)
(cd artifacts/order-system && tar czf /tmp/order-dist.tar.gz       dist/public/)

echo ""
echo "[3/4] 서버 전송 중..."
cat /tmp/shop-dist.tar.gz   | ssh $SSH_OPTS $SERVER "cat > /tmp/shop-dist.tar.gz   && echo 'shop OK'"
cat /tmp/api-dist.tar.gz    | ssh $SSH_OPTS $SERVER "cat > /tmp/api-dist.tar.gz    && echo 'api OK'"
cat /tmp/order-dist.tar.gz  | ssh $SSH_OPTS $SERVER "cat > /tmp/order-dist.tar.gz  && echo 'order OK'"

echo ""
echo "[4/4] 서버 배포 & PM2 재시작..."
ssh $SSH_OPTS $SERVER "
  set -e
  # shop
  cd $SERVER_BASE/artifacts/shop && rm -rf dist/public && tar xzf /tmp/shop-dist.tar.gz

  # api-server: dist 교체 후 native 모듈(sharp 등) 재설치
  cd $SERVER_BASE/artifacts/api-server && rm -rf dist && tar xzf /tmp/api-dist.tar.gz
  cd $SERVER_BASE && pnpm --filter @workspace/api-server install --frozen-lockfile 2>/dev/null || true

  # order-system
  cd $SERVER_BASE/artifacts/order-system && rm -rf dist/public && tar xzf /tmp/order-dist.tar.gz

  pm2 restart seoulmono-api
  rm -f /tmp/shop-dist.tar.gz /tmp/api-dist.tar.gz /tmp/order-dist.tar.gz
  echo ''
  echo '=============================='
  echo '  배포 완료!'
  echo '=============================='
  pm2 list
"

rm -f /tmp/shop-dist.tar.gz /tmp/api-dist.tar.gz /tmp/order-dist.tar.gz
echo ""
echo "✅ 완료! https://seoulmono.com"
