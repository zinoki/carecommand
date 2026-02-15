-- Person: add new columns
ALTER TABLE "Person" ADD COLUMN "axisCareId" TEXT;
ALTER TABLE "Person" ADD COLUMN "axisCareLifecycleStage" TEXT;
ALTER TABLE "Person" ADD COLUMN "axisCareRawData" JSONB;
ALTER TABLE "Person" ADD COLUMN "axisCareLastSyncedAt" TIMESTAMP(3);

-- Copy axiscareCaregiverId to axisCareId
UPDATE "Person" SET "axisCareId" = "axiscareCaregiverId" WHERE "axiscareCaregiverId" IS NOT NULL;

-- Handle case where Applicant has same axisCareId as existing Person (applicant converted to caregiver)
UPDATE "Person" p SET 
  "axisCareLifecycleStage" = 'applicant',
  "axisCareRawData" = a."rawData",
  "axisCareLastSyncedAt" = a."lastSyncedAt"
FROM "Applicant" a
WHERE p."axisCareId" = a."axiscareApplicantId" AND p."tenantId" = a."tenantId";

-- Migrate Applicant to Person (only those not already in Person)
INSERT INTO "Person" (
  "id", "tenantId", "firstName", "lastName", "email", "phone",
  "axisCareId", "axisCareLifecycleStage", "axisCareRawData", "axisCareLastSyncedAt",
  "eligibilityStatus", "createdAt", "updatedAt"
)
SELECT 
  a."id", a."tenantId", a."firstName", a."lastName", a."email", a."phone",
  a."axiscareApplicantId", 'applicant', a."rawData", a."lastSyncedAt",
  'ELIGIBLE', a."createdAt", a."updatedAt"
FROM "Applicant" a
WHERE NOT EXISTS (
  SELECT 1 FROM "Person" p 
  WHERE p."tenantId" = a."tenantId" AND p."axisCareId" = a."axiscareApplicantId"
);

-- Drop Applicant table
ALTER TABLE "Applicant" DROP CONSTRAINT IF EXISTS "Applicant_tenantId_fkey";
DROP TABLE IF EXISTS "Applicant";

-- Person: drop old column, add unique
ALTER TABLE "Person" DROP COLUMN IF EXISTS "axiscareCaregiverId";
CREATE UNIQUE INDEX "Person_tenantId_axisCareId_key" ON "Person"("tenantId", "axisCareId");

-- Client: add new columns
ALTER TABLE "Client" ADD COLUMN "axisCareId" TEXT;
ALTER TABLE "Client" ADD COLUMN "axisCareLifecycleStage" TEXT;
ALTER TABLE "Client" ADD COLUMN "leadPipelineStage" TEXT;
ALTER TABLE "Client" ADD COLUMN "ownerUserId" TEXT;
ALTER TABLE "Client" ADD COLUMN "axisCareLastSyncedAt" TIMESTAMP(3);

-- Copy axiscareClientId to axisCareId, set axisCareLifecycleStage
UPDATE "Client" SET "axisCareId" = "axiscareClientId", "axisCareLifecycleStage" = 'client', "axisCareLastSyncedAt" = "lastSyncedAt" WHERE "axiscareClientId" IS NOT NULL;

-- Make axiscareClientId nullable so we can insert Leads
ALTER TABLE "Client" ALTER COLUMN "axiscareClientId" DROP NOT NULL;

-- Migrate Lead to Client (only those not already in Client as converted client)
INSERT INTO "Client" (
  "id", "tenantId", "firstName", "lastName", "email", "phone",
  "axisCareId", "axisCareLifecycleStage", "rawData", "axisCareLastSyncedAt",
  "axiscareClientId", "status", "createdAt", "updatedAt"
)
SELECT 
  l."id", l."tenantId", l."firstName", l."lastName", l."email", l."phone",
  l."axiscareLeadId", 'lead', l."rawData", l."lastSyncedAt",
  l."axiscareLeadId", 'Lead', l."createdAt", l."updatedAt"
FROM "Lead" l
WHERE NOT EXISTS (
  SELECT 1 FROM "Client" c 
  WHERE c."tenantId" = l."tenantId" AND c."axisCareId" = l."axiscareLeadId"
);

-- Drop Lead table
ALTER TABLE "Lead" DROP CONSTRAINT IF EXISTS "Lead_tenantId_fkey";
DROP TABLE IF EXISTS "Lead";

-- Client: drop old columns, make status nullable
ALTER TABLE "Client" DROP COLUMN "axiscareClientId";
ALTER TABLE "Client" DROP COLUMN "lastSyncedAt";
ALTER TABLE "Client" ALTER COLUMN "status" DROP NOT NULL;

-- Client: add unique, add owner FK
DROP INDEX IF EXISTS "Client_tenantId_axiscareClientId_key";
CREATE UNIQUE INDEX "Client_tenantId_axisCareId_key" ON "Client"("tenantId", "axisCareId");
ALTER TABLE "Client" ADD CONSTRAINT "Client_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
