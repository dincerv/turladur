-- Multi bank accounts + payout bankInfoId (agency payout requests).

ALTER TABLE "identity"."AgencyBankInfo" DROP CONSTRAINT IF EXISTS "AgencyBankInfo_agencyId_key";

ALTER TABLE "identity"."AgencyBankInfo"
  ADD COLUMN IF NOT EXISTS "isDefault" BOOLEAN NOT NULL DEFAULT false;

UPDATE "identity"."AgencyBankInfo"
SET "isDefault" = true
WHERE "deletedAt" IS NULL
  AND "id" IN (
    SELECT DISTINCT ON ("agencyId") "id"
    FROM "identity"."AgencyBankInfo"
    WHERE "deletedAt" IS NULL
    ORDER BY "agencyId", "createdAt" ASC
  );

CREATE INDEX IF NOT EXISTS "AgencyBankInfo_agencyId_deletedAt_idx"
  ON "identity"."AgencyBankInfo"("agencyId", "deletedAt");

CREATE INDEX IF NOT EXISTS "AgencyBankInfo_agencyId_isDefault_idx"
  ON "identity"."AgencyBankInfo"("agencyId", "isDefault");

ALTER TABLE "payment"."AgencyPayout"
  ADD COLUMN IF NOT EXISTS "bankInfoId" TEXT;

CREATE INDEX IF NOT EXISTS "AgencyPayout_bankInfoId_idx"
  ON "payment"."AgencyPayout"("bankInfoId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AgencyPayout_bankInfoId_fkey'
  ) THEN
    ALTER TABLE "payment"."AgencyPayout"
      ADD CONSTRAINT "AgencyPayout_bankInfoId_fkey"
      FOREIGN KEY ("bankInfoId") REFERENCES "identity"."AgencyBankInfo"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
