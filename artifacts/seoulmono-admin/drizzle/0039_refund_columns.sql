ALTER TABLE "orderItems" ADD COLUMN "refundAmount" integer;
ALTER TABLE "orderItems" ADD COLUMN "refundedAt" timestamp;
ALTER TABLE "orderItems" ALTER COLUMN "cancelReason" TYPE varchar(500);
