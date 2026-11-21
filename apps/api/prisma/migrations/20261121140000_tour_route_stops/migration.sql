-- Tur gezi durakları (rota haritası). Kalkış/biniş noktalarından ayrı.

CREATE TYPE "catalog"."TourRouteStopKind" AS ENUM ('VISIT', 'LODGING');

CREATE TABLE "catalog"."TourRouteStop" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "name" VARCHAR(160) NOT NULL,
    "description" VARCHAR(500),
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "kind" "catalog"."TourRouteStopKind" NOT NULL DEFAULT 'VISIT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "deletedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TourRouteStop_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TourRouteStop_tourId_dayNumber_order_idx" ON "catalog"."TourRouteStop"("tourId", "dayNumber", "order");
CREATE INDEX "TourRouteStop_tourId_order_idx" ON "catalog"."TourRouteStop"("tourId", "order");
CREATE INDEX "TourRouteStop_deletedAt_idx" ON "catalog"."TourRouteStop"("deletedAt");

ALTER TABLE "catalog"."TourRouteStop"
  ADD CONSTRAINT "TourRouteStop_tourId_fkey"
  FOREIGN KEY ("tourId") REFERENCES "catalog"."Tour"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
