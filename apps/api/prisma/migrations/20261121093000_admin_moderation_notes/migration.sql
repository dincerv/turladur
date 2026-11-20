-- AlterTable
ALTER TABLE "identity"."Agency" ADD COLUMN IF NOT EXISTS "moderationNote" TEXT;
ALTER TABLE "identity"."Agency" ADD COLUMN IF NOT EXISTS "moderatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "identity"."Guide" ADD COLUMN IF NOT EXISTS "moderationNote" TEXT;
ALTER TABLE "identity"."Guide" ADD COLUMN IF NOT EXISTS "moderatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "catalog"."Experience" ADD COLUMN IF NOT EXISTS "moderationNote" TEXT;
ALTER TABLE "catalog"."Experience" ADD COLUMN IF NOT EXISTS "moderatedAt" TIMESTAMP(3);
