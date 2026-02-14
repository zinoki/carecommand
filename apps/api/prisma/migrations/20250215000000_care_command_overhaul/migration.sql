-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "profilePhotoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceMonthly" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "stripePriceId" TEXT,
    "maxUsers" INTEGER,
    "maxActiveCaregivers" INTEGER,
    "featuresJson" JSONB NOT NULL DEFAULT '{}',
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantBilling" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "status" TEXT NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantBilling_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "invitedBy" TEXT,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "birthday" TIMESTAMP(3),
    "normalizedEmail" TEXT,
    "normalizedPhone" TEXT,
    "isDriver" BOOLEAN NOT NULL DEFAULT false,
    "eligibilityStatus" TEXT NOT NULL,
    "eligibilityReasonCategory" TEXT,
    "eligibilityReasonNotes" TEXT,
    "eligibilitySetByUserId" TEXT,
    "eligibilitySetAt" TIMESTAMP(3),
    "axiscareCaregiverId" TEXT,
    "driveFolderId" TEXT,
    "driveFolderUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmploymentEpisode" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "episodeNumber" INTEGER NOT NULL,
    "lifecycleStatus" TEXT NOT NULL,
    "recruitmentStage" TEXT,
    "onboardingStage" TEXT,
    "passDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "offboardDate" TIMESTAMP(3),
    "offboardType" TEXT,
    "offboardReasonCategory" TEXT,
    "offboardNotes" TEXT,
    "ownerUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmploymentEpisode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoShowEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "NoShowEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequirementTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequirementTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequirementTemplateItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "expires" BOOLEAN NOT NULL DEFAULT false,
    "requiredRule" TEXT NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "appliesTo" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequirementTemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonRequirement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employmentEpisodeId" TEXT NOT NULL,
    "templateItemId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "expiresOn" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "verifierUserId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequirementEvidence" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "personRequirementId" TEXT NOT NULL,
    "storageType" TEXT NOT NULL,
    "s3Key" TEXT,
    "fileName" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "driveFileId" TEXT,
    "driveUrl" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequirementEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AxisCareConnection" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "siteNumber" TEXT NOT NULL,
    "apiTokenEncrypted" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "syncMode" TEXT NOT NULL DEFAULT 'READ_ONLY',
    "syncFrequencyMinutes" INTEGER NOT NULL DEFAULT 60,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AxisCareConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AxisCareMapping" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "axiscareCaregiverId" TEXT NOT NULL,
    "externalIdVerified" BOOLEAN NOT NULL DEFAULT false,
    "writeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "matchConfidence" INTEGER NOT NULL DEFAULT 0,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AxisCareMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AxisCareSyncLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "personId" TEXT,
    "axiscareCaregiverId" TEXT,
    "operation" TEXT NOT NULL,
    "executed" BOOLEAN NOT NULL,
    "syncMode" TEXT NOT NULL,
    "oldValue" JSONB NOT NULL DEFAULT '{}',
    "newValue" JSONB NOT NULL DEFAULT '{}',
    "statusCode" INTEGER,
    "errorText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AxisCareSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AxisCareWriteLimiter" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "hourBucket" TEXT NOT NULL,
    "writeCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AxisCareWriteLimiter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "toNumber" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "providerMessageId" TEXT,

    CONSTRAINT "MessageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadataJson" JSONB NOT NULL DEFAULT '{}',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tenant_id_idx" ON "Tenant"("id");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");

-- CreateIndex
CREATE INDEX "Plan_isActive_idx" ON "Plan"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TenantBilling_tenantId_key" ON "TenantBilling"("tenantId");

-- CreateIndex
CREATE INDEX "TenantBilling_tenantId_idx" ON "TenantBilling"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_token_key" ON "Invite"("token");

-- CreateIndex
CREATE INDEX "Invite_token_idx" ON "Invite"("token");

-- CreateIndex
CREATE INDEX "Invite_tenantId_idx" ON "Invite"("tenantId");

-- CreateIndex
CREATE INDEX "Person_tenantId_idx" ON "Person"("tenantId");

-- CreateIndex
CREATE INDEX "Person_tenantId_eligibilityStatus_idx" ON "Person"("tenantId", "eligibilityStatus");

-- CreateIndex
CREATE INDEX "EmploymentEpisode_tenantId_idx" ON "EmploymentEpisode"("tenantId");

-- CreateIndex
CREATE INDEX "EmploymentEpisode_personId_idx" ON "EmploymentEpisode"("personId");

-- CreateIndex
CREATE INDEX "EmploymentEpisode_lifecycleStatus_idx" ON "EmploymentEpisode"("lifecycleStatus");

-- CreateIndex
CREATE UNIQUE INDEX "EmploymentEpisode_personId_episodeNumber_key" ON "EmploymentEpisode"("personId", "episodeNumber");

-- CreateIndex
CREATE INDEX "NoShowEvent_tenantId_idx" ON "NoShowEvent"("tenantId");

-- CreateIndex
CREATE INDEX "NoShowEvent_personId_idx" ON "NoShowEvent"("personId");

-- CreateIndex
CREATE INDEX "RequirementTemplate_tenantId_idx" ON "RequirementTemplate"("tenantId");

-- CreateIndex
CREATE INDEX "RequirementTemplateItem_tenantId_idx" ON "RequirementTemplateItem"("tenantId");

-- CreateIndex
CREATE INDEX "RequirementTemplateItem_templateId_idx" ON "RequirementTemplateItem"("templateId");

-- CreateIndex
CREATE INDEX "PersonRequirement_tenantId_idx" ON "PersonRequirement"("tenantId");

-- CreateIndex
CREATE INDEX "PersonRequirement_employmentEpisodeId_idx" ON "PersonRequirement"("employmentEpisodeId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonRequirement_employmentEpisodeId_templateItemId_key" ON "PersonRequirement"("employmentEpisodeId", "templateItemId");

-- CreateIndex
CREATE INDEX "RequirementEvidence_tenantId_idx" ON "RequirementEvidence"("tenantId");

-- CreateIndex
CREATE INDEX "RequirementEvidence_personRequirementId_idx" ON "RequirementEvidence"("personRequirementId");

-- CreateIndex
CREATE UNIQUE INDEX "AxisCareConnection_tenantId_key" ON "AxisCareConnection"("tenantId");

-- CreateIndex
CREATE INDEX "AxisCareConnection_tenantId_idx" ON "AxisCareConnection"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "AxisCareMapping_personId_key" ON "AxisCareMapping"("personId");

-- CreateIndex
CREATE INDEX "AxisCareMapping_tenantId_idx" ON "AxisCareMapping"("tenantId");

-- CreateIndex
CREATE INDEX "AxisCareMapping_personId_idx" ON "AxisCareMapping"("personId");

-- CreateIndex
CREATE INDEX "AxisCareSyncLog_tenantId_idx" ON "AxisCareSyncLog"("tenantId");

-- CreateIndex
CREATE INDEX "AxisCareSyncLog_personId_idx" ON "AxisCareSyncLog"("personId");

-- CreateIndex
CREATE INDEX "AxisCareSyncLog_createdAt_idx" ON "AxisCareSyncLog"("createdAt");

-- CreateIndex
CREATE INDEX "AxisCareWriteLimiter_tenantId_idx" ON "AxisCareWriteLimiter"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "AxisCareWriteLimiter_tenantId_hourBucket_key" ON "AxisCareWriteLimiter"("tenantId", "hourBucket");

-- CreateIndex
CREATE INDEX "MessageLog_tenantId_idx" ON "MessageLog"("tenantId");

-- CreateIndex
CREATE INDEX "MessageLog_personId_idx" ON "MessageLog"("personId");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_entityType_entityId_idx" ON "AuditLog"("tenantId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantBilling" ADD CONSTRAINT "TenantBilling_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantBilling" ADD CONSTRAINT "TenantBilling_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentEpisode" ADD CONSTRAINT "EmploymentEpisode_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentEpisode" ADD CONSTRAINT "EmploymentEpisode_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentEpisode" ADD CONSTRAINT "EmploymentEpisode_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoShowEvent" ADD CONSTRAINT "NoShowEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoShowEvent" ADD CONSTRAINT "NoShowEvent_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoShowEvent" ADD CONSTRAINT "NoShowEvent_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementTemplate" ADD CONSTRAINT "RequirementTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementTemplateItem" ADD CONSTRAINT "RequirementTemplateItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementTemplateItem" ADD CONSTRAINT "RequirementTemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "RequirementTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonRequirement" ADD CONSTRAINT "PersonRequirement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonRequirement" ADD CONSTRAINT "PersonRequirement_employmentEpisodeId_fkey" FOREIGN KEY ("employmentEpisodeId") REFERENCES "EmploymentEpisode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonRequirement" ADD CONSTRAINT "PersonRequirement_templateItemId_fkey" FOREIGN KEY ("templateItemId") REFERENCES "RequirementTemplateItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonRequirement" ADD CONSTRAINT "PersonRequirement_verifierUserId_fkey" FOREIGN KEY ("verifierUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementEvidence" ADD CONSTRAINT "RequirementEvidence_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementEvidence" ADD CONSTRAINT "RequirementEvidence_personRequirementId_fkey" FOREIGN KEY ("personRequirementId") REFERENCES "PersonRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementEvidence" ADD CONSTRAINT "RequirementEvidence_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AxisCareConnection" ADD CONSTRAINT "AxisCareConnection_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AxisCareMapping" ADD CONSTRAINT "AxisCareMapping_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AxisCareMapping" ADD CONSTRAINT "AxisCareMapping_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

