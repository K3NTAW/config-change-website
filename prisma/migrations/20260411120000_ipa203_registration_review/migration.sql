-- AlterTable
ALTER TABLE "registration_requests" ADD COLUMN "rejectionReason" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
