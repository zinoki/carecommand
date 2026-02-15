-- Rename Person table to Caregiver
ALTER TABLE "Person" RENAME TO "Caregiver";

-- EmploymentEpisode: drop FK, rename column, add caregiverPipelineStage, migrate data, drop old columns, recreate FK
ALTER TABLE "EmploymentEpisode" DROP CONSTRAINT IF EXISTS "EmploymentEpisode_personId_fkey";
ALTER TABLE "EmploymentEpisode" RENAME COLUMN "personId" TO "caregiverId";
ALTER TABLE "EmploymentEpisode" ADD COLUMN "caregiverPipelineStage" TEXT;

-- Migrate recruitmentStage/onboardingStage to caregiverPipelineStage
UPDATE "EmploymentEpisode" SET "caregiverPipelineStage" = CASE
  WHEN "recruitmentStage" IN ('Intake', 'Interviewing') THEN 'Interview'
  WHEN "recruitmentStage" = 'Offered' THEN 'ManagerReview'
  WHEN "onboardingStage" IS NOT NULL AND "onboardingStage" != '' THEN 
    CASE WHEN "onboardingStage" IN ('Ready', 'Active') THEN 'Ready' ELSE 'Onboarding' END
  ELSE 'Interview'
END WHERE "caregiverPipelineStage" IS NULL;

UPDATE "EmploymentEpisode" SET "caregiverPipelineStage" = 'Interview' WHERE "caregiverPipelineStage" IS NULL;

ALTER TABLE "EmploymentEpisode" DROP COLUMN "recruitmentStage";
ALTER TABLE "EmploymentEpisode" DROP COLUMN "onboardingStage";
ALTER TABLE "EmploymentEpisode" ADD CONSTRAINT "EmploymentEpisode_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "Caregiver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update unique constraint
DROP INDEX IF EXISTS "EmploymentEpisode_personId_episodeNumber_key";
CREATE UNIQUE INDEX "EmploymentEpisode_caregiverId_episodeNumber_key" ON "EmploymentEpisode"("caregiverId", "episodeNumber");

-- NoShowEvent
ALTER TABLE "NoShowEvent" DROP CONSTRAINT IF EXISTS "NoShowEvent_personId_fkey";
ALTER TABLE "NoShowEvent" RENAME COLUMN "personId" TO "caregiverId";
ALTER TABLE "NoShowEvent" ADD CONSTRAINT "NoShowEvent_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "Caregiver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AxisCareMapping
ALTER TABLE "AxisCareMapping" DROP CONSTRAINT IF EXISTS "AxisCareMapping_personId_fkey";
ALTER TABLE "AxisCareMapping" RENAME COLUMN "personId" TO "caregiverId";
ALTER TABLE "AxisCareMapping" ADD CONSTRAINT "AxisCareMapping_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "Caregiver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Schedule
ALTER TABLE "Schedule" DROP CONSTRAINT IF EXISTS "Schedule_personId_fkey";
ALTER TABLE "Schedule" RENAME COLUMN "personId" TO "caregiverId";
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "Caregiver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Visit
ALTER TABLE "Visit" DROP CONSTRAINT IF EXISTS "Visit_personId_fkey";
ALTER TABLE "Visit" RENAME COLUMN "personId" TO "caregiverId";
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "Caregiver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- MessageLog
ALTER TABLE "MessageLog" DROP CONSTRAINT IF EXISTS "MessageLog_personId_fkey";
ALTER TABLE "MessageLog" RENAME COLUMN "personId" TO "caregiverId";
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "Caregiver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AxisCareSyncLog
ALTER TABLE "AxisCareSyncLog" RENAME COLUMN "personId" TO "caregiverId";

-- Tenant: update FK from persons to caregivers (relation name only - table is Caregiver now)
-- No SQL change needed - Tenant has no direct FK to Person, it's the reverse (Caregiver.tenantId -> Tenant)

-- Client: rename leadPipelineStage to clientPipelineStage
ALTER TABLE "Client" RENAME COLUMN "leadPipelineStage" TO "clientPipelineStage";

-- Migrate Client stage values: New->Lead, Contacted->Assessment, Qualified->Matching, Proceeding->Matched
UPDATE "Client" SET "clientPipelineStage" = 'Lead' WHERE "clientPipelineStage" = 'New';
UPDATE "Client" SET "clientPipelineStage" = 'Assessment' WHERE "clientPipelineStage" = 'Contacted';
UPDATE "Client" SET "clientPipelineStage" = 'Matching' WHERE "clientPipelineStage" = 'Qualified';
UPDATE "Client" SET "clientPipelineStage" = 'Matched' WHERE "clientPipelineStage" = 'Proceeding';

-- Update indexes
DROP INDEX IF EXISTS "EmploymentEpisode_personId_idx";
CREATE INDEX "EmploymentEpisode_caregiverId_idx" ON "EmploymentEpisode"("caregiverId");

DROP INDEX IF EXISTS "NoShowEvent_personId_idx";
CREATE INDEX "NoShowEvent_caregiverId_idx" ON "NoShowEvent"("caregiverId");

DROP INDEX IF EXISTS "AxisCareMapping_personId_idx";
CREATE INDEX "AxisCareMapping_caregiverId_idx" ON "AxisCareMapping"("caregiverId");

DROP INDEX IF EXISTS "Schedule_personId_idx";
CREATE INDEX "Schedule_caregiverId_idx" ON "Schedule"("caregiverId");

DROP INDEX IF EXISTS "Visit_personId_idx";
CREATE INDEX "Visit_caregiverId_idx" ON "Visit"("caregiverId");

DROP INDEX IF EXISTS "MessageLog_personId_idx";
CREATE INDEX "MessageLog_caregiverId_idx" ON "MessageLog"("caregiverId");

DROP INDEX IF EXISTS "AxisCareSyncLog_personId_idx";
CREATE INDEX "AxisCareSyncLog_caregiverId_idx" ON "AxisCareSyncLog"("caregiverId");
