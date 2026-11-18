-- AgencySalesGoal: dönemsel hedef takibi (raporlar)
CREATE TABLE IF NOT EXISTS identity."AgencySalesGoal" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "period" VARCHAR(20) NOT NULL,
    "metric" VARCHAR(40) NOT NULL,
    "targetValue" DECIMAL(12,2) NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "deletedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AgencySalesGoal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AgencySalesGoal_agencyId_period_metric_year_month_key"
  ON identity."AgencySalesGoal"("agencyId", "period", "metric", "year", "month");

CREATE INDEX IF NOT EXISTS "AgencySalesGoal_agencyId_period_year_idx"
  ON identity."AgencySalesGoal"("agencyId", "period", "year");

CREATE INDEX IF NOT EXISTS "AgencySalesGoal_deletedAt_idx"
  ON identity."AgencySalesGoal"("deletedAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AgencySalesGoal_agencyId_fkey'
  ) THEN
    ALTER TABLE identity."AgencySalesGoal"
      ADD CONSTRAINT "AgencySalesGoal_agencyId_fkey"
      FOREIGN KEY ("agencyId") REFERENCES identity."Agency"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
