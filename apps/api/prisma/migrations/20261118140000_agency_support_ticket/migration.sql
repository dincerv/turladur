-- SupportTicket: acente destek talepleri (tenant-scoped)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'SupportTicketPriority' AND n.nspname = 'identity'
  ) THEN
    CREATE TYPE identity."SupportTicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'SupportTicketStatus' AND n.nspname = 'identity'
  ) THEN
    CREATE TYPE identity."SupportTicketStatus" AS ENUM ('OPEN', 'ANSWERED', 'CLOSED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS identity."SupportTicket" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "priority" identity."SupportTicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" identity."SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "category" VARCHAR(80),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "deletedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SupportTicket_agencyId_status_idx"
  ON identity."SupportTicket"("agencyId", "status");

CREATE INDEX IF NOT EXISTS "SupportTicket_agencyId_createdAt_idx"
  ON identity."SupportTicket"("agencyId", "createdAt");

CREATE INDEX IF NOT EXISTS "SupportTicket_userId_idx"
  ON identity."SupportTicket"("userId");

CREATE INDEX IF NOT EXISTS "SupportTicket_deletedAt_idx"
  ON identity."SupportTicket"("deletedAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SupportTicket_agencyId_fkey'
  ) THEN
    ALTER TABLE identity."SupportTicket"
      ADD CONSTRAINT "SupportTicket_agencyId_fkey"
      FOREIGN KEY ("agencyId") REFERENCES identity."Agency"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
