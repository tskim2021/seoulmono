ALTER TABLE "priceAlerts" ADD COLUMN IF NOT EXISTS "previousPrice" integer;
ALTER TABLE "priceAlerts" ADD COLUMN IF NOT EXISTS "changeDirection" text;
ALTER TABLE "priceAlerts" ADD COLUMN IF NOT EXISTS "changedAt" timestamp;

-- 레거시 데이터 백필: targetPrice가 originalPrice(실제 가격)와 다른 행(90% 목표가 방식)을
-- 현재 상품의 실제 가격으로 초기화하여 정확한 변동 기준선으로 교정
UPDATE "priceAlerts" pa
SET "targetPrice" = COALESCE(p."salePrice", p."price")
FROM "products" p
WHERE p.id = pa."productId"
  AND pa."targetPrice" != pa."originalPrice";
