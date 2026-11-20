-- AlterTable
ALTER TABLE "review"."Review" ADD COLUMN IF NOT EXISTS "travelerContext" VARCHAR(20);
ALTER TABLE "review"."Review" ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "review"."TourMetrics" ADD COLUMN IF NOT EXISTS "topTags" JSONB;
