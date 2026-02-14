-- AlterTable
ALTER TABLE "EmploymentEpisode" ADD COLUMN     "expectedAvailabilityStart" TIMESTAMP(3),
ADD COLUMN     "referenceNotes" TEXT,
ADD COLUMN     "referrerEmail" TEXT,
ADD COLUMN     "referrerName" TEXT,
ADD COLUMN     "referrerRelationship" TEXT,
ADD COLUMN     "resumeS3Key" TEXT;

-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "city" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "hca" TEXT;
