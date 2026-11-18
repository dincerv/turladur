-- TourExtra: required extras (auto-selected at checkout)
ALTER TABLE "catalog"."TourExtra"
  ADD COLUMN IF NOT EXISTS "isRequired" BOOLEAN NOT NULL DEFAULT false;
